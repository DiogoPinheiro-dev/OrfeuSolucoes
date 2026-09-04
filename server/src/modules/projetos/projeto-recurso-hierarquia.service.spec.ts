import { ForbiddenException } from '@nestjs/common';
import { ProjetoRecursoHierarquiaService } from './projeto-recurso-hierarquia.service';

const user = { sub: 'usuario-1', padraoSistema: false } as never;

describe('ProjetoRecursoHierarquiaService', () => {
  it('mantém acesso irrestrito para administrador do sistema', async () => {
    const prisma = { recurso: { findUnique: jest.fn() } };
    const authorization = { isSystemAdmin: jest.fn().mockReturnValue(true) };
    const service = new ProjetoRecursoHierarquiaService(prisma as never, authorization as never);

    await expect(service.escopo(user, 7)).resolves.toEqual({ restrito: false, recursoIds: [], usuarioIds: [] });
    expect(prisma.recurso.findUnique).not.toHaveBeenCalled();
  });

  it('preserva o acesso administrativo de usuário que não é recurso', async () => {
    const prisma = { recurso: { findUnique: jest.fn().mockResolvedValue(null) } };
    const authorization = { isSystemAdmin: jest.fn().mockReturnValue(false) };
    const service = new ProjetoRecursoHierarquiaService(prisma as never, authorization as never);

    await expect(service.escopo(user, 7)).resolves.toEqual({ restrito: false, recursoIds: [], usuarioIds: [] });
    expect(prisma.recurso.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { empresaId_usuarioId: { empresaId: 7, usuarioId: 'usuario-1' } }
    }));
  });

  it('recurso sem capacitação visualiza somente as próprias tarefas', async () => {
    const prisma = {
      recurso: { findUnique: jest.fn().mockResolvedValue({ id: 'recurso-atual', usuarioId: 'usuario-1', ativo: true, capacitacao: null }) },
      equipeRecurso: { findMany: jest.fn() }
    };
    const service = new ProjetoRecursoHierarquiaService(prisma as never, { isSystemAdmin: () => false } as never);

    await expect(service.escopo(user, 7)).resolves.toEqual({ restrito: true, recursoIds: ['recurso-atual'], usuarioIds: ['usuario-1'] });
    expect(prisma.equipeRecurso.findMany).not.toHaveBeenCalled();
  });

  it('superior visualiza subordinados de equipes compartilhadas, sem incluir pares ou superiores', async () => {
    const prisma = {
      recurso: { findUnique: jest.fn().mockResolvedValue({ id: 'supervisor', usuarioId: 'usuario-1', ativo: true, capacitacao: { ativo: true, nivelHierarquico: 4 } }) },
      equipeRecurso: {
        findMany: jest.fn()
          .mockResolvedValueOnce([{ equipeId: 'equipe-a' }, { equipeId: 'equipe-a' }, { equipeId: 'equipe-b' }])
          .mockResolvedValueOnce([
            { recursoId: 'junior', recurso: { usuarioId: 'usuario-junior' } },
            { recursoId: 'pleno', recurso: { usuarioId: 'usuario-pleno' } },
            { recursoId: 'junior', recurso: { usuarioId: 'usuario-junior' } }
          ])
      }
    };
    const service = new ProjetoRecursoHierarquiaService(prisma as never, { isSystemAdmin: () => false } as never);

    await expect(service.escopo(user, 7, 'projeto-1')).resolves.toEqual({
      restrito: true,
      recursoIds: ['supervisor', 'junior', 'pleno'],
      usuarioIds: ['usuario-1', 'usuario-junior', 'usuario-pleno']
    });
    expect(prisma.equipeRecurso.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        empresaId: 7,
        recursoId: 'supervisor',
        equipe: {
          ativo: true,
          projetos: { some: { projetoId: 'projeto-1', ativo: true } }
        }
      },
      select: { equipeId: true }
    });
    expect(prisma.equipeRecurso.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        empresaId: 7,
        equipeId: { in: ['equipe-a', 'equipe-b'] },
        recurso: {
          ativo: true,
          capacitacao: { ativo: true, nivelHierarquico: { lt: 4 } },
          projetos: { some: { projetoId: 'projeto-1', ativo: true } }
        }
      },
      select: { recursoId: true, recurso: { select: { usuarioId: true } } }
    });
  });

  it('nega leitura e gestão fora do escopo calculado', () => {
    const service = new ProjetoRecursoHierarquiaService({} as never, { isSystemAdmin: () => false } as never);
    const escopo = { restrito: true, recursoIds: ['permitido'], usuarioIds: ['usuario-permitido'] };

    expect(() => service.assertPodeAcessarRecurso(escopo, 'negado')).toThrow(ForbiddenException);
    expect(() => service.assertPodeGerenciarRecursos(escopo, ['permitido', 'negado'])).toThrow(ForbiddenException);
    expect(() => service.assertPodeGerenciarRecursos(escopo, ['permitido'])).not.toThrow();
    expect(() => service.assertPodeAcessarResponsavel(escopo, 'usuario-negado')).toThrow(ForbiddenException);
    expect(() => service.assertPodeAcessarResponsavel(escopo, null)).toThrow(ForbiddenException);
    expect(() => service.assertPodeAcessarResponsavel(escopo, 'usuario-permitido')).not.toThrow();
    expect(() => service.assertVisaoCompleta(escopo, 'alterar o projeto')).toThrow(ForbiddenException);
    expect(() => service.assertVisaoCompleta({ restrito: false, recursoIds: [], usuarioIds: [] }, 'alterar o projeto')).not.toThrow();
  });
});
