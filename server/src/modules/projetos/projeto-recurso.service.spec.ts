import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProjetoRecursoService } from './projeto-recurso.service';

const user = { sub: 'usuario-admin' } as never;

const createPrisma = () => {
  const prisma: any = {
    projeto: { findMany: jest.fn(), findUnique: jest.fn() },
    recurso: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
    capacitacao: { findFirst: jest.fn() },
    empresaUsuario: { findMany: jest.fn() },
    projetoRecurso: { create: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
    projetoRecursoEquipe: { count: jest.fn() },
    projetoMembro: { findUnique: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    projetoItem: { count: jest.fn() },
    projetoCusto: { count: jest.fn() }
  };
  prisma.$transaction = jest.fn((callback) => callback(prisma));
  return prisma;
};

const createService = () => {
  const prisma = createPrisma();
  const authorization = {
    empresa: jest.fn().mockResolvedValue(7),
    permissoes: jest.fn().mockResolvedValue({ podeIncluir: true })
  };
  const auditoria = { registrar: jest.fn().mockResolvedValue({}) };
  return { prisma, authorization, auditoria, service: new ProjetoRecursoService(prisma, authorization as never, auditoria as never) };
};

describe('ProjetoRecursoService', () => {
  it('lista somente projetos da empresa autorizada', async () => {
    const { prisma, authorization, service } = createService();
    prisma.projeto.findMany.mockResolvedValue([{ id: 'projeto-1' }]);

    await expect(service.projetos(user)).resolves.toEqual([{ id: 'projeto-1' }]);
    expect(authorization.empresa).toHaveBeenCalledWith(user);
    expect(prisma.projeto.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { empresaId: 7 } }));
  });

  it('monta o painel com candidatos, recursos e permissões da mesma empresa', async () => {
    const { prisma, service } = createService();
    prisma.recurso.findMany.mockResolvedValue([{ id: 'recurso-1', usuarioId: 'u1', ativo: true, versao: 2, usuario: { id: 'u1', nome: null, login: 'ana', email: 'ana@example.com' }, capacitacao: null, projetos: [] }]);
    prisma.empresaUsuario.findMany.mockResolvedValue([{ id: 1, usuario: { id: 'u1', nome: 'Ana', login: 'ana', email: 'ana@example.com' } }]);

    await expect(service.painel(user)).resolves.toMatchObject({
      candidatos: [{ id: 'u1', nome: 'Ana', login: 'ana', email: 'ana@example.com' }],
      recursos: [{ id: 'recurso-1', usuarioId: 'u1', capacitacao: null, projetos: [] }],
      permissoes: { podeIncluir: true }
    });
    expect(prisma.recurso.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { empresaId: 7 } }));
    expect(prisma.empresaUsuario.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { empresaId: 7 } }));
  });

  it('rejeita criação para usuário de outra empresa e usuário duplicado', async () => {
    const first = createService();
    first.prisma.empresaUsuario.findMany.mockResolvedValue([]);
    await expect(first.service.salvarRecurso({ usuarioId: 'externo', ativo: true } as never, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(first.prisma.$transaction).not.toHaveBeenCalled();

    const second = createService();
    second.prisma.empresaUsuario.findMany.mockResolvedValue([{ usuario: { id: 'u1', nome: 'Ana', email: 'ana@example.com' } }]);
    second.prisma.recurso.findUnique.mockResolvedValue({ id: 'existente' });
    await expect(second.service.salvarRecurso({ usuarioId: 'u1', ativo: true } as never, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(second.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita edição inexistente, troca de usuário e capacitação de outra empresa', async () => {
    const missing = createService();
    missing.prisma.recurso.findFirst.mockResolvedValue(null);
    await expect(missing.service.salvarRecurso({ id: 'ausente', versao: 1, usuarioId: 'u1', ativo: true } as never, user)).rejects.toBeInstanceOf(NotFoundException);

    const changedUser = createService();
    changedUser.prisma.recurso.findFirst.mockResolvedValue({ id: 'r1', usuarioId: 'u1', projetos: [] });
    await expect(changedUser.service.salvarRecurso({ id: 'r1', versao: 1, usuarioId: 'u2', ativo: true } as never, user)).rejects.toBeInstanceOf(BadRequestException);

    const invalidCapability = createService();
    invalidCapability.prisma.recurso.findFirst.mockResolvedValue({ id: 'r1', usuarioId: 'u1', projetos: [] });
    invalidCapability.prisma.capacitacao.findFirst.mockResolvedValue(null);
    await expect(invalidCapability.service.salvarRecurso({ id: 'r1', versao: 1, usuarioId: 'u1', capacitacaoId: 'externa', ativo: true } as never, user)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cria recurso, vínculo direto, participação e auditoria na mesma transação', async () => {
    const { prisma, auditoria, service } = createService();
    prisma.projeto.findMany.mockResolvedValue([{ id: 'p1', chave: 'P1', nome: 'Projeto 1', arquivadoEm: null }]);
    prisma.empresaUsuario.findMany.mockResolvedValue([{ usuario: { id: 'u1', nome: 'Ana', email: 'ana@example.com' } }]);
    prisma.recurso.findUnique.mockResolvedValue(null);
    prisma.recurso.create.mockResolvedValue({ id: 'r1', usuarioId: 'u1', ativo: true });
    prisma.projetoRecurso.create.mockResolvedValue({ id: 'pr1', projetoId: 'p1', ativo: true, vinculoDireto: true, versao: 1 });
    prisma.projetoRecurso.findMany.mockResolvedValue([{ id: 'pr1', projetoId: 'p1', ativo: true }]);
    prisma.projeto.findUnique.mockResolvedValue({ responsavelId: 'outro' });
    prisma.projetoMembro.findUnique.mockResolvedValue(null);
    jest.spyOn(service, 'painel').mockResolvedValue({ recursos: [{ id: 'r1' }], candidatos: [], permissoes: {} } as never);

    await expect(service.salvarRecurso({ usuarioId: 'u1', projetoIds: ['p1', 'p1'], ativo: true } as never, user)).resolves.toEqual({ id: 'r1' });
    expect(prisma.projetoRecurso.create).toHaveBeenCalledTimes(1);
    expect(prisma.projetoMembro.create).toHaveBeenCalledWith({ data: { projetoId: 'p1', usuarioId: 'u1', papel: 'MEMBRO', origem: 'RECURSO' } });
    expect(auditoria.registrar).toHaveBeenCalledWith(prisma, expect.objectContaining({ empresaId: 7, projetoId: 'p1', evento: 'ALOCADO' }));
  });

  it('preserva vínculo originado por equipe ao remover apenas a origem direta', async () => {
    const { prisma, service } = createService();
    const atual = { id: 'r1', usuarioId: 'u1', ativo: true, projetos: [{ id: 'pr1', projetoId: 'p1', ativo: true, vinculoDireto: true, versao: 3 }] };
    prisma.recurso.findFirst.mockResolvedValue(atual);
    prisma.projeto.findMany.mockResolvedValue([]);
    prisma.recurso.updateMany.mockResolvedValue({ count: 1 });
    prisma.recurso.findUnique.mockResolvedValue({ id: 'r1', usuarioId: 'u1', ativo: true });
    prisma.projetoRecursoEquipe.count.mockResolvedValue(1);
    prisma.projetoRecurso.updateMany.mockResolvedValue({ count: 1 });
    prisma.projetoRecurso.findUnique.mockResolvedValue({ ...atual.projetos[0], ativo: true, vinculoDireto: false, versao: 4 });
    prisma.projetoRecurso.findMany.mockResolvedValue([{ id: 'pr1', projetoId: 'p1', ativo: true }]);
    prisma.projeto.findUnique.mockResolvedValue({ responsavelId: 'u1' });
    jest.spyOn(service, 'painel').mockResolvedValue({ recursos: [{ id: 'r1' }], candidatos: [], permissoes: {} } as never);

    await service.salvarRecurso({ id: 'r1', versao: 2, usuarioId: 'u1', projetoIds: [], ativo: true } as never, user);
    expect(prisma.projetoRecurso.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ativo: true, vinculoDireto: false }) }));
  });

  it('rejeita atualização desatualizada sem produzir auditoria', async () => {
    const { prisma, auditoria, service } = createService();
    prisma.recurso.findFirst.mockResolvedValue({ id: 'r1', usuarioId: 'u1', ativo: true, projetos: [] });
    prisma.recurso.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.salvarRecurso({ id: 'r1', versao: 1, usuarioId: 'u1', ativo: false } as never, user)).rejects.toBeInstanceOf(ConflictException);
    expect(auditoria.registrar).not.toHaveBeenCalled();
  });

  it('bloqueia exclusão com dependências e não remove vínculos', async () => {
    const { prisma, service } = createService();
    prisma.recurso.findFirst.mockResolvedValue({ id: 'r1', usuarioId: 'u1', versao: 2 });
    prisma.projetoRecurso.findMany.mockResolvedValue([{ id: 'pr1', projetoId: 'p1' }]);
    prisma.projetoItem.count.mockResolvedValue(2);
    prisma.projetoCusto.count.mockResolvedValue(1);

    await expect(service.excluirRecurso({ id: 'r1', versao: 2 } as never, user)).rejects.toThrow('2 item(ns) de projeto, 1 custo(s)');
    expect(prisma.projetoRecurso.deleteMany).not.toHaveBeenCalled();
  });

  it('exclui recurso sem dependências, remove participação e audita', async () => {
    const { prisma, auditoria, service } = createService();
    prisma.recurso.findFirst.mockResolvedValue({ id: 'r1', usuarioId: 'u1', versao: 2 });
    prisma.projetoRecurso.findMany.mockResolvedValue([{ id: 'pr1', projetoId: 'p1' }]);
    prisma.projetoItem.count.mockResolvedValue(0);
    prisma.projetoCusto.count.mockResolvedValue(0);
    prisma.recurso.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.excluirRecurso({ id: 'r1', versao: 2 } as never, user)).resolves.toBe(true);
    expect(prisma.projetoMembro.deleteMany).toHaveBeenCalledWith({ where: { projetoId: 'p1', usuarioId: 'u1', origem: 'RECURSO' } });
    expect(prisma.projetoRecurso.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['pr1'] }, empresaId: 7 } });
    expect(auditoria.registrar).toHaveBeenCalledWith(prisma, expect.objectContaining({ evento: 'EXCLUIDO' }));
  });
});
