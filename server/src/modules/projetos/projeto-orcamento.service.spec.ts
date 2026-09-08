import { BadRequestException, ConflictException } from '@nestjs/common';
import { ProjetoOrcamentoService } from './projeto-orcamento.service';
import { ProjetoCustoTipo, ProjetoOrcamentoStatus } from './types/projeto-orcamento.types';
import { ProjetoSituacao } from './types/projeto.types';

const user = { sub: 'admin' } as never;
const contexto = { empresaId: 7, projeto: { id: 'p1' } };
const financeiro = { id: 'o1', projetoId: 'p1', status: ProjetoOrcamentoStatus.RASCUNHO, moeda: 'BRL', categorias: [], custos: [] };

const createService = () => {
  const prisma: any = {
    projeto: { findMany: jest.fn() },
    projetoRecurso: { findMany: jest.fn(), findFirst: jest.fn() },
    projetoItem: { findMany: jest.fn(), findFirst: jest.fn() },
    projetoOrcamento: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
    projetoOrcamentoCategoria: { count: jest.fn(), findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn(), deleteMany: jest.fn() },
    projetoCusto: { count: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
    projetoCustoTaxaHistorico: { create: jest.fn() }
  };
  prisma.$transaction = jest.fn((callback) => callback(prisma));
  const authorization = {
    projetos: jest.fn().mockResolvedValue({ where: { empresaId: 7 } }),
    contexto: jest.fn().mockResolvedValue(contexto),
    permissoes: jest.fn().mockResolvedValue({ podeVisualizarFinanceiro: true }),
    gerenciarFinanceiro: jest.fn().mockResolvedValue(undefined),
    aprovarOrcamento: jest.fn().mockResolvedValue(undefined)
  };
  const auditoria = { registrar: jest.fn().mockResolvedValue({}) };
  return { prisma, authorization, auditoria, service: new ProjetoOrcamentoService(prisma, authorization as never, auditoria as never) };
};

describe('ProjetoOrcamentoService', () => {
  it('lista exclusivamente projetos ativos em orçamento dentro do escopo autorizado', async () => {
    const { prisma, service } = createService();
    prisma.projeto.findMany.mockResolvedValue([{ id: 'p1' }]);

    await expect(service.projetos(user)).resolves.toEqual([{ id: 'p1' }]);
    expect(prisma.projeto.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { empresaId: 7, situacao: ProjetoSituacao.EM_ORCAMENTO, arquivadoEm: null }
    }));
  });

  it('omite itens e financeiro quando a permissão financeira é negada', async () => {
    const { prisma, authorization, service } = createService();
    authorization.permissoes.mockResolvedValue({ podeVisualizarFinanceiro: false });
    prisma.projetoRecurso.findMany.mockResolvedValue([]);

    await expect(service.painel('p1', user)).resolves.toEqual({
      recursos: [], itens: [], financeiro: null, permissoes: { podeVisualizarFinanceiro: false }
    });
    expect(prisma.projetoItem.findMany).not.toHaveBeenCalled();
    expect(prisma.projetoOrcamento.findUnique).not.toHaveBeenCalled();
  });

  it('rejeita moeda inválida e orçamento aprovado sem abrir transação', async () => {
    const invalid = createService();
    await expect(invalid.service.salvarOrcamento({ projetoId: 'p1', moeda: 'real' } as never, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(invalid.prisma.$transaction).not.toHaveBeenCalled();

    const approved = createService();
    approved.prisma.projetoOrcamento.findUnique.mockResolvedValue({ ...financeiro, status: ProjetoOrcamentoStatus.APROVADO });
    await expect(approved.service.salvarOrcamento({ projetoId: 'p1', moeda: 'brl' } as never, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(approved.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('cria orçamento normalizando moeda e registra auditoria atomicamente', async () => {
    const { prisma, auditoria, service } = createService();
    prisma.projetoOrcamento.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(financeiro);
    prisma.projetoOrcamento.create.mockResolvedValue(financeiro);

    await expect(service.salvarOrcamento({ projetoId: 'p1', moeda: ' brl ' } as never, user)).resolves.toMatchObject({ moeda: 'BRL', totalPlanejado: '0.00' });
    expect(prisma.projetoOrcamento.create).toHaveBeenCalledWith({ data: { empresaId: 7, projetoId: 'p1', moeda: 'BRL' } });
    expect(auditoria.registrar).toHaveBeenCalledWith(prisma, expect.objectContaining({ evento: 'CRIADO', empresaId: 7 }));
  });

  it('impede troca de moeda quando já existem categorias ou custos', async () => {
    const { prisma, service } = createService();
    prisma.projetoOrcamento.findUnique.mockResolvedValue({ ...financeiro, moeda: 'BRL' });
    prisma.projetoOrcamentoCategoria.count.mockResolvedValue(1);
    prisma.projetoCusto.count.mockResolvedValue(0);

    await expect(service.salvarOrcamento({ projetoId: 'p1', moeda: 'USD', versao: 1 } as never, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('valida valores monetários e pré-requisitos de custos', async () => {
    const invalidMoney = createService();
    invalidMoney.prisma.projetoOrcamento.findUnique.mockResolvedValue(financeiro);
    await expect(invalidMoney.service.salvarCategoria({ projetoId: 'p1', nome: 'Serviços', valorPlanejado: '-1', valorComprometido: '0', valorRealizado: '0' } as never, user)).rejects.toBeInstanceOf(BadRequestException);

    const missingResource = createService();
    missingResource.prisma.projetoOrcamento.findUnique.mockResolvedValue(financeiro);
    await expect(missingResource.service.salvarCusto({ projetoId: 'p1', tipo: ProjetoCustoTipo.RECURSO, descricao: 'Horas', valorComprometido: '0', valorRealizado: '0' } as never, user)).rejects.toBeInstanceOf(BadRequestException);

    const fixedWithItem = createService();
    fixedWithItem.prisma.projetoOrcamento.findUnique.mockResolvedValue(financeiro);
    await expect(fixedWithItem.service.salvarCusto({ projetoId: 'p1', tipo: ProjetoCustoTipo.FIXO, itemId: 'i1', descricao: 'Licença', valorPlanejado: '1', valorComprometido: '0', valorRealizado: '0' } as never, user)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cria categoria e custo fixo com valores normalizados e auditoria', async () => {
    const category = createService();
    category.prisma.projetoOrcamento.findUnique.mockResolvedValue(financeiro);
    category.prisma.projetoOrcamentoCategoria.create.mockResolvedValue({ id: 'c1', nome: 'Serviços', valorPlanejado: '100.125', valorComprometido: '20', valorRealizado: '10' });
    await expect(category.service.salvarCategoria({ projetoId: 'p1', nome: ' Serviços ', valorPlanejado: '100.125', valorComprometido: '20', valorRealizado: '10' } as never, user)).resolves.toMatchObject({ valorPlanejado: '100.13', variacao: '90.13' });
    expect(category.auditoria.registrar).toHaveBeenCalledWith(category.prisma, expect.objectContaining({ evento: 'CRIADA' }));

    const cost = createService();
    cost.prisma.projetoOrcamento.findUnique.mockResolvedValue(financeiro);
    cost.prisma.projetoCusto.create.mockResolvedValue({ id: 'cost1' });
    cost.prisma.projetoCusto.findUnique.mockResolvedValue({ id: 'cost1', descricao: 'Licença', taxaHora: null, valorPlanejado: '50', valorComprometido: '5', valorRealizado: '2', recurso: null, item: null, taxas: [] });
    await expect(cost.service.salvarCusto({ projetoId: 'p1', tipo: ProjetoCustoTipo.FIXO, descricao: ' Licença ', valorPlanejado: '50', valorComprometido: '5', valorRealizado: '2' } as never, user)).resolves.toMatchObject({ valorPlanejado: '50.00', taxaHora: null });
    expect(cost.auditoria.registrar).toHaveBeenCalledWith(cost.prisma, expect.objectContaining({ evento: 'CRIADO' }));
  });

  it('cria custo de recurso, valida item atribuído e registra histórico da taxa', async () => {
    const { prisma, service } = createService();
    prisma.projetoOrcamento.findUnique.mockResolvedValue(financeiro);
    prisma.projetoRecurso.findFirst
      .mockResolvedValueOnce({ id: 'pr1', ativo: true, cadastro: { ativo: true, usuarioId: 'u1', usuario: { id: 'u1', nome: 'Ana', email: 'ana@example.com' } } })
      .mockResolvedValueOnce({ id: 'pr1', cadastro: { usuarioId: 'u1' } });
    prisma.projetoItem.findFirst.mockResolvedValue({ id: 'i1', titulo: 'Entrega', arquivadoEm: null });
    prisma.projetoCusto.create.mockResolvedValue({ id: 'cost1' });
    prisma.projetoCusto.findUnique.mockResolvedValue({ id: 'cost1', taxaHora: '120', valorPlanejado: '240', valorComprometido: '0', valorRealizado: '0', recurso: null, item: null, taxas: [] });

    await expect(service.salvarCusto({ projetoId: 'p1', tipo: ProjetoCustoTipo.RECURSO, descricao: 'Desenvolvimento', recursoId: 'pr1', itemId: 'i1', quantidadeMinutos: 120, taxaHora: '120', valorComprometido: '0', valorRealizado: '0' } as never, user)).resolves.toMatchObject({ taxaHora: '120.0000', valorPlanejado: '240.00' });
    expect(prisma.projetoCustoTaxaHistorico.create).toHaveBeenCalledWith({ data: { custoId: 'cost1', taxaHora: '120.0000', criadoPorId: 'admin' } });
  });

  it('bloqueia categoria com custos vinculados', async () => {
    const { prisma, service } = createService();
    prisma.projetoOrcamento.findUnique.mockResolvedValue(financeiro);
    prisma.projetoCusto.count.mockResolvedValue(2);

    await expect(service.excluirCategoria({ projetoId: 'p1', id: 'c1', versao: 1 } as never, user)).rejects.toThrow('2 custo(s)');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita aprovação concorrente sem auditar', async () => {
    const { prisma, auditoria, service } = createService();
    prisma.projetoOrcamento.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.aprovar({ projetoId: 'p1', id: 'o1', versao: 1 } as never, user)).rejects.toBeInstanceOf(ConflictException);
    expect(auditoria.registrar).not.toHaveBeenCalled();
  });

  it('aprova orçamento e exclui categoria e custo com auditoria', async () => {
    const approval = createService();
    approval.prisma.projetoOrcamento.updateMany.mockResolvedValue({ count: 1 });
    approval.prisma.projetoOrcamento.findUnique.mockResolvedValueOnce({ ...financeiro, status: ProjetoOrcamentoStatus.APROVADO }).mockResolvedValueOnce({ ...financeiro, status: ProjetoOrcamentoStatus.APROVADO });
    await expect(approval.service.aprovar({ projetoId: 'p1', id: 'o1', versao: 1 } as never, user)).resolves.toMatchObject({ status: ProjetoOrcamentoStatus.APROVADO });
    expect(approval.auditoria.registrar).toHaveBeenCalledWith(approval.prisma, expect.objectContaining({ evento: 'APROVADO' }));

    const deletion = createService();
    deletion.prisma.projetoOrcamento.findUnique.mockResolvedValue(financeiro);
    deletion.prisma.projetoCusto.count.mockResolvedValue(0);
    deletion.prisma.projetoOrcamentoCategoria.findFirst.mockResolvedValue({ id: 'c1', nome: 'Serviços' });
    deletion.prisma.projetoOrcamentoCategoria.deleteMany.mockResolvedValue({ count: 1 });
    deletion.prisma.projetoCusto.findFirst.mockResolvedValue({ id: 'cost1', descricao: 'Licença', categoriaId: 'c1' });
    deletion.prisma.projetoCusto.deleteMany.mockResolvedValue({ count: 1 });
    await expect(deletion.service.excluirCategoria({ projetoId: 'p1', id: 'c1', versao: 1 } as never, user)).resolves.toBe(true);
    await expect(deletion.service.excluirCusto({ projetoId: 'p1', id: 'cost1', versao: 1 } as never, user)).resolves.toBe(true);
    expect(deletion.auditoria.registrar).toHaveBeenCalledTimes(2);
  });

  it('reabre somente orçamento aprovado e registra o estado anterior', async () => {
    const invalid = createService();
    invalid.prisma.projetoOrcamento.findFirst.mockResolvedValue({ ...financeiro, status: ProjetoOrcamentoStatus.RASCUNHO });
    await expect(invalid.service.reabrir({ projetoId: 'p1', id: 'o1', versao: 1 } as never, user)).rejects.toBeInstanceOf(BadRequestException);

    const valid = createService();
    valid.prisma.projetoOrcamento.findFirst.mockResolvedValue({ ...financeiro, status: ProjetoOrcamentoStatus.APROVADO });
    valid.prisma.projetoOrcamento.updateMany.mockResolvedValue({ count: 1 });
    valid.prisma.projetoOrcamento.findUnique.mockResolvedValueOnce({ ...financeiro, status: ProjetoOrcamentoStatus.RASCUNHO }).mockResolvedValueOnce(financeiro);
    await expect(valid.service.reabrir({ projetoId: 'p1', id: 'o1', versao: 1 } as never, user)).resolves.toMatchObject({ totalPlanejado: '0.00' });
    expect(valid.auditoria.registrar).toHaveBeenCalledWith(valid.prisma, expect.objectContaining({ evento: 'REABERTO', dados: { statusAnterior: ProjetoOrcamentoStatus.APROVADO } }));
  });
});
