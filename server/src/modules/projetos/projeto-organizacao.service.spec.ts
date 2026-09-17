import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjetoOrganizacaoService } from './projeto-organizacao.service';
import { ProjetoRecursoAuthorizationService } from './projeto-recurso-authorization.service';

const user = { sub: 'user-1' } as never;
const acessoCompleto = { empresaId: 7, recursos: true, equipes: true };

describe('ProjetoOrganizacaoService', () => {
  const authorization = {
    empresa: jest.fn().mockResolvedValue(7),
    permissoes: jest.fn().mockResolvedValue({}),
    acessoPainel: jest.fn().mockResolvedValue(acessoCompleto)
  };

  it('lista somente dados da empresa autorizada e ordena a hierarquia', async () => {
    const authorization = {
      acessoPainel: jest.fn().mockResolvedValue(acessoCompleto),
      permissoes: jest.fn().mockResolvedValue({ podeIncluir: true, podeAlterar: true, podeExcluir: true })
    };
    const prisma = {
      capacitacao: { findMany: jest.fn().mockResolvedValue([]) },
      equipe: { findMany: jest.fn().mockResolvedValue([]) },
      recurso: { findMany: jest.fn().mockResolvedValue([]) },
      empresaUsuario: { findMany: jest.fn().mockResolvedValue([]) },
      projeto: { findMany: jest.fn().mockResolvedValue([]) }
    };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, {} as never);

    await expect(service.painel(user)).resolves.toMatchObject({
      capacitacoes: [],
      equipes: [],
      recursos: [],
      projetos: [],
      permissoes: { podeIncluir: true },
      permissoesEquipes: { podeIncluir: true }
    });
    expect(prisma.capacitacao.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { empresaId: 7 }, orderBy: [{ nivelHierarquico: 'desc' }, { nome: 'asc' }] }));
    expect(prisma.equipe.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { empresaId: 7 } }));
    expect(authorization.permissoes).toHaveBeenCalledWith(user);
    expect(authorization.permissoes).toHaveBeenCalledWith(user, 'equipes');
  });

  it('abre o painel com acesso somente a Equipes sem expor os usuários candidatos a recurso', async () => {
    const authorization = {
      acessoPainel: jest.fn().mockResolvedValue({ empresaId: 7, recursos: false, equipes: true }),
      permissoes: jest.fn().mockResolvedValue({ podeIncluir: true, podeAlterar: false, podeExcluir: false })
    };
    const prisma = {
      capacitacao: { findMany: jest.fn().mockResolvedValue([]) },
      equipe: { findMany: jest.fn().mockResolvedValue([]) },
      recurso: { findMany: jest.fn().mockResolvedValue([]) },
      empresaUsuario: { findMany: jest.fn().mockResolvedValue([{ usuario: { id: 'u1', nome: 'Pessoa', login: 'pessoa', email: 'pessoa@teste.local' } }]) },
      projeto: { findMany: jest.fn().mockResolvedValue([]) }
    };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, {} as never);

    await expect(service.painel(user)).resolves.toMatchObject({
      candidatos: [],
      permissoes: { podeIncluir: false, podeAlterar: false, podeExcluir: false },
      permissoesEquipes: { podeIncluir: true, podeAlterar: false, podeExcluir: false }
    });
    expect(authorization.permissoes).toHaveBeenCalledTimes(1);
    expect(authorization.permissoes).toHaveBeenCalledWith(user, 'equipes');
    expect(prisma.empresaUsuario.findMany).not.toHaveBeenCalled();
    expect(prisma.capacitacao.findMany).not.toHaveBeenCalled();
  });

  it('não expõe equipes nem projetos no painel de quem visualiza somente Recursos', async () => {
    const authorization = {
      acessoPainel: jest.fn().mockResolvedValue({ empresaId: 7, recursos: true, equipes: false }),
      permissoes: jest.fn().mockResolvedValue({ podeIncluir: true, podeAlterar: false, podeExcluir: false })
    };
    const prisma = {
      capacitacao: { findMany: jest.fn().mockResolvedValue([{ id: 'cap-1', nome: 'Analista' }]) },
      equipe: { findMany: jest.fn().mockResolvedValue([{ id: 'e1', nome: 'Equipe restrita', recursos: [], projetos: [] }]) },
      recurso: { findMany: jest.fn().mockResolvedValue([]) },
      empresaUsuario: { findMany: jest.fn().mockResolvedValue([{ usuario: { id: 'u1', nome: 'Candidato' } }]) },
      projeto: { findMany: jest.fn().mockResolvedValue([{ id: 'p1', nome: 'Projeto restrito' }]) }
    };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, {} as never);

    await expect(service.painel(user)).resolves.toMatchObject({
      capacitacoes: [{ id: 'cap-1' }],
      candidatos: [{ id: 'u1' }],
      equipes: [],
      projetos: [],
      permissoes: { podeIncluir: true },
      permissoesEquipes: { podeIncluir: false, podeAlterar: false, podeExcluir: false }
    });
    expect(prisma.equipe.findMany).not.toHaveBeenCalled();
    expect(prisma.projeto.findMany).not.toHaveBeenCalled();
    expect(authorization.permissoes).toHaveBeenCalledTimes(1);
    expect(authorization.permissoes).toHaveBeenCalledWith(user);
  });

  it.each([
    ['incluir equipe', 'planejamento-de-recursos', 'salvarEquipe', { nome: 'Time', ativo: true, recursoIds: [], projetoIds: [] }],
    ['alterar equipe', 'planejamento-de-recursos', 'salvarEquipe', { id: 'e1', versao: 1, nome: 'Time', ativo: true, recursoIds: [], projetoIds: [] }],
    ['excluir equipe', 'planejamento-de-recursos', 'excluirEquipe', { id: 'e1', versao: 1 }],
    ['incluir capacitação', 'equipes', 'salvarCapacitacao', { nome: 'Analista', nivelHierarquico: 1, ativo: true }],
    ['excluir capacitação', 'equipes', 'excluirCapacitacao', { id: 'cap-1', versao: 1 }]
  ] as const)('nega %s quando a permissão pertence somente à outra funcionalidade', async (_cenario, funcionalidadePermitida, operacao, input) => {
    const featureAuthorization = {
      assertFeatureActionAccess: jest.fn(async (_user, funcionalidade) => {
        if (funcionalidade !== funcionalidadePermitida) throw new ForbiddenException('Acesso negado.');
        return 7;
      })
    };
    const authorization = new ProjetoRecursoAuthorizationService({} as never, featureAuthorization as never);
    const service = new ProjetoOrganizacaoService({} as never, authorization, {} as never);

    await expect(service[operacao](input as never, user)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('impede excluir capacitação utilizada por recurso', async () => {
    const authorization = { empresa: jest.fn().mockResolvedValue(7) };
    const prisma = { recurso: { count: jest.fn().mockResolvedValue(1) }, capacitacao: { deleteMany: jest.fn() } };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, {} as never);

    await expect(service.excluirCapacitacao({ id: '00000000-0000-4000-8000-000000000001', versao: 1 }, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.capacitacao.deleteMany).not.toHaveBeenCalled();
    expect(authorization.empresa).toHaveBeenCalledWith(user, 'excluir');
  });

  it('salva equipe com a permissão de Equipes e substitui membros dentro da transação', async () => {
    const authorization = {
      empresa: jest.fn().mockResolvedValue(7),
      permissoes: jest.fn().mockResolvedValue({}),
      acessoPainel: jest.fn().mockResolvedValue(acessoCompleto)
    };
    const equipe = { id: '00000000-0000-4000-8000-000000000010', nome: 'Produto', descricao: null, ativo: true, versao: 1 };
    const tx = {
      equipe: { create: jest.fn().mockResolvedValue(equipe) },
      equipeRecurso: { deleteMany: jest.fn(), createMany: jest.fn() },
      projetoEquipe: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() }
    };
    const prisma = {
      equipe: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([{ ...equipe, recursos: [], projetos: [] }]) },
      recurso: { findMany: jest.fn().mockResolvedValue([{ id: '00000000-0000-4000-8000-000000000020', ativo: true }]) },
      empresaUsuario: { findMany: jest.fn().mockResolvedValue([]) },
      projeto: { findMany: jest.fn().mockResolvedValue([{ id: '00000000-0000-4000-8000-000000000030', chave: 'PRJ', nome: 'Projeto', arquivadoEm: null }]) },
      capacitacao: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((callback) => callback(tx))
    };
    const vinculosEquipe = { sincronizar: jest.fn() };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, vinculosEquipe as never);

    await service.salvarEquipe({ nome: 'Produto', ativo: true, recursoIds: ['00000000-0000-4000-8000-000000000020'], projetoIds: ['00000000-0000-4000-8000-000000000030'] }, user);
    expect(authorization.empresa).toHaveBeenCalledWith(user, 'incluir', 'equipes');
    expect(tx.equipeRecurso.createMany).toHaveBeenCalledWith({ data: [{ empresaId: 7, equipeId: equipe.id, recursoId: '00000000-0000-4000-8000-000000000020' }] });
    expect(tx.projetoEquipe.create).toHaveBeenCalledWith({ data: { empresaId: 7, equipeId: equipe.id, projetoId: '00000000-0000-4000-8000-000000000030', ativo: true } });
    expect(vinculosEquipe.sincronizar).toHaveBeenCalledWith(tx, expect.objectContaining({ empresaId: 7, equipeId: equipe.id, equipeAtiva: true }));
  });

  it('valida nome, duplicidade e concorrência ao salvar capacitações com a permissão de Recursos', async () => {
    const prisma = { capacitacao: { findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() } };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, {} as never);
    const base = { nome: '  ', nivelHierarquico: 1, ativo: true };
    await expect(service.salvarCapacitacao(base, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(authorization.empresa).toHaveBeenCalledWith(user, 'incluir');

    prisma.capacitacao.findFirst.mockResolvedValueOnce({ id: 'outra' });
    await expect(service.salvarCapacitacao({ ...base, nome: 'QA' }, user)).rejects.toBeInstanceOf(BadRequestException);

    prisma.capacitacao.findFirst.mockResolvedValue(null);
    prisma.capacitacao.create.mockResolvedValue({ id: 'cap-1' });
    await expect(service.salvarCapacitacao({ ...base, nome: ' QA ', descricao: '  ' }, user)).resolves.toEqual({ id: 'cap-1' });
    expect(prisma.capacitacao.create).toHaveBeenCalledWith({ data: expect.objectContaining({ empresaId: 7, nome: 'QA', descricao: null }) });

    await expect(service.salvarCapacitacao({ ...base, id: 'cap-1', nome: 'QA' }, user)).rejects.toBeInstanceOf(BadRequestException);
    prisma.capacitacao.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.salvarCapacitacao({ ...base, id: 'cap-1', versao: 1, nome: 'QA' }, user)).rejects.toBeInstanceOf(ConflictException);
    prisma.capacitacao.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.capacitacao.findUnique.mockResolvedValueOnce(null);
    await expect(service.salvarCapacitacao({ ...base, id: 'cap-1', versao: 1, nome: 'QA' }, user)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('exclui capacitação livre e detecta versão concorrente', async () => {
    const prisma = {
      recurso: { count: jest.fn().mockResolvedValue(0) },
      capacitacao: { deleteMany: jest.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 }) }
    };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, {} as never);
    const input = { id: 'cap-1', versao: 1 };
    await expect(service.excluirCapacitacao(input, user)).resolves.toBe(true);
    await expect(service.excluirCapacitacao(input, user)).rejects.toBeInstanceOf(ConflictException);
  });

  it.each([
    ['nome vazio', { nome: ' ', ativo: true, recursoIds: [], projetoIds: [] }, BadRequestException],
    ['recurso ausente', { nome: 'Time', ativo: true, recursoIds: ['r1'], projetoIds: [] }, NotFoundException],
    ['projeto ausente', { nome: 'Time', ativo: true, recursoIds: [], projetoIds: ['p1'] }, NotFoundException]
  ])('recusa equipe com %s', async (_label, input, errorType) => {
    const prisma = {
      equipe: { findFirst: jest.fn().mockResolvedValue(null) },
      recurso: { findMany: jest.fn().mockResolvedValue([]) }, projeto: { findMany: jest.fn().mockResolvedValue([]) }
    };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, {} as never);
    await expect(service.salvarEquipe(input as never, user)).rejects.toBeInstanceOf(errorType as never);
  });

  it('recusa recurso inativo e projeto arquivado em equipe ativa', async () => {
    const prisma = {
      equipe: { findFirst: jest.fn().mockResolvedValue(null) },
      recurso: { findMany: jest.fn().mockResolvedValue([{ id: 'r1', ativo: false }]) },
      projeto: { findMany: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'p1', arquivadoEm: new Date() }]) }
    };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, {} as never);
    await expect(service.salvarEquipe({ nome: 'Time', ativo: true, recursoIds: ['r1'], projetoIds: [] }, user)).rejects.toBeInstanceOf(BadRequestException);
    prisma.recurso.findMany.mockResolvedValue([{ id: 'r1', ativo: true }]);
    await expect(service.salvarEquipe({ nome: 'Time', ativo: true, recursoIds: ['r1'], projetoIds: ['p1'] }, user)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('impede excluir equipe com projeto ativo', async () => {
    const prisma = { projetoEquipe: { count: jest.fn().mockResolvedValue(1) } };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, {} as never);
    await expect(service.excluirEquipe({ id: 'e1', versao: 1 }, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(authorization.empresa).toHaveBeenCalledWith(user, 'excluir', 'equipes');
  });

  it('atualiza equipe, reativa e remove vínculos de projetos de modo versionado', async () => {
    const saved = { id: 'e1', nome: 'Time', descricao: 'Atualizado', ativo: false, versao: 2 };
    const tx = {
      equipe: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), findUnique: jest.fn().mockResolvedValue(saved) },
      equipeRecurso: { deleteMany: jest.fn(), createMany: jest.fn() },
      projetoEquipe: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'v1', projetoId: 'p1', ativo: false }, { id: 'v2', projetoId: 'p2', ativo: true }
        ]),
        update: jest.fn(), create: jest.fn()
      }
    };
    const prisma = {
      equipe: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([{ ...saved, recursos: [], projetos: [] }])
      },
      recurso: { findMany: jest.fn().mockResolvedValue([]) },
      projeto: {
        findMany: jest.fn()
          .mockResolvedValueOnce([{ id: 'p1', arquivadoEm: null }, { id: 'p3', arquivadoEm: null }])
          .mockResolvedValueOnce([])
      },
      capacitacao: { findMany: jest.fn().mockResolvedValue([]) },
      empresaUsuario: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((callback) => callback(tx))
    };
    const vinculos = { sincronizar: jest.fn() };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, vinculos as never);
    await service.salvarEquipe({ id: 'e1', versao: 1, nome: ' Time ', descricao: ' Atualizado ', ativo: false, recursoIds: [], projetoIds: ['p1', 'p3'] }, user);
    expect(authorization.empresa).toHaveBeenCalledWith(user, 'alterar', 'equipes');
    expect(tx.projetoEquipe.update).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { ativo: true, versao: { increment: 1 } } });
    expect(tx.projetoEquipe.create).toHaveBeenCalledWith({ data: { empresaId: 7, equipeId: 'e1', projetoId: 'p3', ativo: true } });
    expect(tx.projetoEquipe.update).toHaveBeenCalledWith({ where: { id: 'v2' }, data: { ativo: false, versao: { increment: 1 } } });
    expect(tx.equipeRecurso.createMany).not.toHaveBeenCalled();
  });

  it('exclui equipe sem vínculos ativos e limpa relações históricas', async () => {
    const tx = {
      equipeRecurso: { deleteMany: jest.fn() }, projetoEquipe: { deleteMany: jest.fn() },
      equipe: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) }
    };
    const prisma = { projetoEquipe: { count: jest.fn().mockResolvedValue(0) }, $transaction: jest.fn((callback) => callback(tx)) };
    const service = new ProjetoOrganizacaoService(prisma as never, authorization as never, {} as never);
    await expect(service.excluirEquipe({ id: 'e1', versao: 2 }, user)).resolves.toBe(true);
    expect(tx.equipeRecurso.deleteMany).toHaveBeenCalledWith({ where: { equipeId: 'e1', empresaId: 7 } });
    expect(tx.projetoEquipe.deleteMany).toHaveBeenCalledWith({ where: { equipeId: 'e1', empresaId: 7, ativo: false } });
  });
});
