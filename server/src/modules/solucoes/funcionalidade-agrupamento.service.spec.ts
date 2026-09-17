import { BadRequestException, Logger } from '@nestjs/common';
import { FormFieldConflictException } from '../../common/exceptions/form-field.exception';
import { AgrupamentoPadraoDefinition } from './constants/agrupamento-definitions';
import { FuncionalidadeAgrupamentoService } from './funcionalidade-agrupamento.service';

const agrupamento = { id: 5, solucaoId: 1, slug: 'configuracoes', titulo: 'Configurações', label: null, descricao: null, ordem: 10, ativo: true, padraoSistema: false, chaveTecnica: 'chave' };

const definicao: AgrupamentoPadraoDefinition = {
  slug: 'configuracoes-do-atendimento',
  titulo: 'Configurações do atendimento',
  label: 'Configurações',
  descricao: 'Configurações usadas no atendimento.',
  ordem: 50,
  funcionalidades: ['categorias', 'tipos', 'sla']
};

type BuildOverrides = {
  funcionalidade?: object | null;
  agrupamento?: object | null;
  membros?: number;
  /** Funcionalidades ainda sem agrupamento, por slug. */
  livres?: Record<string, number>;
};

function build(overrides: BuildOverrides = {}) {
  const livres = overrides.livres ?? {};
  const db = {
    solucao: { findUnique: jest.fn().mockResolvedValue({ id: 1 }) },
    funcionalidade: {
      findFirst: jest.fn().mockImplementation(({ where }) => Promise.resolve(
        'agrupamentoId' in where
          ? (livres[where.slug] ? { id: livres[where.slug] } : null)
          : overrides.funcionalidade ?? null
      )),
      count: jest.fn().mockResolvedValue(overrides.membros ?? 0),
      update: jest.fn().mockResolvedValue({})
    },
    funcionalidadeAgrupamento: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(overrides.agrupamento === undefined ? agrupamento : overrides.agrupamento),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...agrupamento, ...data })),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...agrupamento, ...data })),
      delete: jest.fn().mockResolvedValue(agrupamento)
    },
    catalogoAuditoria: { create: jest.fn().mockResolvedValue({}) }
  };
  const prisma = { ...db, $transaction: jest.fn((callback) => callback(db)) };
  return { db, service: new FuncionalidadeAgrupamentoService(prisma as never) };
}

describe('FuncionalidadeAgrupamentoService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('cria o agrupamento e registra auditoria', async () => {
    const { db, service } = build();

    await expect(service.create({ solucaoId: 1, slug: 'Configurações', titulo: ' Configurações ' }, 'admin-1')).resolves.toMatchObject({ id: 5 });

    expect(db.funcionalidadeAgrupamento.create).toHaveBeenCalledWith({ data: expect.objectContaining({ solucaoId: 1, titulo: 'Configurações' }) });
    expect(db.catalogoAuditoria.create).toHaveBeenCalledWith({ data: expect.objectContaining({ entidade: 'AGRUPAMENTO', evento: 'CRIADO', autorId: 'admin-1' }) });
  });

  it('nega identificador ja usado por uma funcionalidade da mesma solucao', async () => {
    const { db, service } = build({ funcionalidade: { id: 20 } });

    await expect(service.create({ solucaoId: 1, slug: 'tipos', titulo: 'Tipos' })).rejects.toBeInstanceOf(FormFieldConflictException);
    expect(db.funcionalidadeAgrupamento.create).not.toHaveBeenCalled();
  });

  it('personaliza apresentacao e estado de agrupamento padrao com auditoria', async () => {
    const { db, service } = build({ agrupamento: { ...agrupamento, padraoSistema: true } });

    await expect(service.update({ id: 5, titulo: ' Parâmetros ', ativo: false }, 'admin-1')).resolves.toMatchObject({ titulo: 'Parâmetros', ativo: false });
    expect(db.catalogoAuditoria.create).toHaveBeenCalledWith({ data: expect.objectContaining({ entidade: 'AGRUPAMENTO', evento: 'ALTERADO', autorId: 'admin-1' }) });
    await expect(service.update({ id: 5, titulo: '   ' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('nao exclui agrupamento padrao nem agrupamento com funcionalidades', async () => {
    await expect(build({ agrupamento: { ...agrupamento, padraoSistema: true } }).service.remove(5)).rejects.toThrow('Desative-o');
    const comMembros = build({ membros: 2 });
    await expect(comMembros.service.remove(5)).rejects.toThrow('Retire as funcionalidades');
    expect(comMembros.db.funcionalidadeAgrupamento.delete).not.toHaveBeenCalled();
  });

  it('exclui agrupamento customizado vazio com auditoria', async () => {
    const { db, service } = build();

    await expect(service.remove(5, 'admin-1')).resolves.toBe(true);
    expect(db.catalogoAuditoria.create).toHaveBeenCalledWith({ data: expect.objectContaining({ entidade: 'AGRUPAMENTO', evento: 'EXCLUIDO', depois: null }) });
  });

  it('cria o agrupamento padrao e associa somente funcionalidades livres na ordem da definicao', async () => {
    const { db, service } = build({ agrupamento: null, livres: { categorias: 31, sla: 33 } });

    await service.ensureAgrupamentoPadrao(1, definicao);

    expect(db.funcionalidadeAgrupamento.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ solucaoId: 1, slug: 'configuracoes-do-atendimento', titulo: 'Configurações do atendimento', ativo: true, padraoSistema: true })
    });
    expect(db.funcionalidade.update.mock.calls.map(([args]) => args)).toEqual([
      { where: { id: 31 }, data: { agrupamentoId: 5, ordemNoAgrupamento: 1 } },
      { where: { id: 33 }, data: { agrupamentoId: 5, ordemNoAgrupamento: 3 } }
    ]);
    expect(db.catalogoAuditoria.create.mock.calls.map(([args]) => [args.data.evento, args.data.autorId])).toEqual([
      ['BOOTSTRAP_REGISTRADO', null],
      ['AGRUPAMENTO_ALTERADO', null],
      ['AGRUPAMENTO_ALTERADO', null]
    ]);
  });

  it('nunca regrava agrupamento padrao existente nem ocupa a rota de uma funcionalidade', async () => {
    const existente = build({ agrupamento: { ...agrupamento, padraoSistema: true, titulo: 'Personalizado' }, livres: { categorias: 31 } });
    await existente.service.ensureAgrupamentoPadrao(1, definicao);
    expect(existente.db.funcionalidadeAgrupamento.create).not.toHaveBeenCalled();
    expect(existente.db.funcionalidade.update).not.toHaveBeenCalled();

    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const rotaOcupada = build({ agrupamento: null, funcionalidade: { id: 40 }, livres: { categorias: 31 } });
    await rotaOcupada.service.ensureAgrupamentoPadrao(1, definicao);
    expect(rotaOcupada.db.funcionalidadeAgrupamento.create).not.toHaveBeenCalled();
    expect(rotaOcupada.db.funcionalidade.update).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('configuracoes-do-atendimento'));
  });

  it('nega associar funcionalidade a agrupamento de outra solucao', async () => {
    await expect(build().service.assertAssociacaoValida(2, 5)).rejects.toThrow('não pertence à solução');
    await expect(build({ agrupamento: null }).service.assertAssociacaoValida(1, 99)).rejects.toBeInstanceOf(BadRequestException);
    await expect(build().service.assertAssociacaoValida(1, null)).resolves.toBeUndefined();
  });

  it('registra alteracao de associacao somente quando ela mudou', async () => {
    const { db, service } = build();
    const associacao = { agrupamentoId: 5, ordemNoAgrupamento: 1 };

    await service.registrarAssociacao(20, associacao, { ...associacao });
    expect(db.catalogoAuditoria.create).not.toHaveBeenCalled();

    await service.registrarAssociacao(20, { agrupamentoId: null, ordemNoAgrupamento: null }, associacao, 'admin-1');
    expect(db.catalogoAuditoria.create).toHaveBeenCalledWith({ data: expect.objectContaining({ entidade: 'FUNCIONALIDADE', evento: 'AGRUPAMENTO_ALTERADO' }) });
  });
});
