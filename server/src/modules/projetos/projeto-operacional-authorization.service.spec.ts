import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import { ProjetoOrcamentoAuthorizationService } from './projeto-orcamento-authorization.service';
import { ProjetoRecursoAuthorizationService } from './projeto-recurso-authorization.service';

describe('autorizações operacionais de projetos', () => {
  const user = { sub: 'usuario-1', padraoSistema: false } as never;

  it('restringe a listagem financeira pela visibilidade quando não é administrador', async () => {
    const authorization = {
      assertFeatureActionAccess: jest.fn().mockResolvedValue(7), isSystemAdmin: jest.fn().mockReturnValue(false),
      visibilityWhere: jest.fn().mockReturnValue({ membros: { some: {} } })
    };
    const service = new ProjetoOrcamentoAuthorizationService({} as never, authorization as never);
    await expect(service.projetos(user)).resolves.toEqual({ empresaId: 7, where: { empresaId: 7, membros: { some: {} } } });
    authorization.isSystemAdmin.mockReturnValue(true);
    await expect(service.projetos(user)).resolves.toEqual({ empresaId: 7, where: { empresaId: 7 } });
  });

  it('resolve contexto, papel e delega ações financeiras', async () => {
    const projeto = { id: 'p1', arquivadoEm: null, responsavelId: 'usuario-1', membros: [] };
    const prisma = { projeto: { findFirst: jest.fn().mockResolvedValue(projeto) } };
    const authorization = {
      assertFeatureActionAccess: jest.fn().mockResolvedValue(7), assertVisibleProject: jest.fn(),
      assertOperationalAction: jest.fn().mockResolvedValue(undefined), isSystemAdmin: jest.fn().mockReturnValue(false)
    };
    const service = new ProjetoOrcamentoAuthorizationService(prisma as never, authorization as never);
    const contexto = await service.contexto('p1', user);
    expect(contexto).toMatchObject({ empresaId: 7, projeto });
    await service.gerenciarFinanceiro(contexto, user); await service.aprovarOrcamento(contexto, user);
    expect(authorization.assertOperationalAction).toHaveBeenNthCalledWith(1, user, projeto, 7, contexto.papel, ProjetoFuncionalidade.ORCAMENTO, ProjetoAcao.GERENCIAR_FINANCEIRO, expect.any(Array), 'gerenciar o financeiro');
    expect(authorization.assertOperationalAction).toHaveBeenNthCalledWith(2, user, projeto, 7, contexto.papel, ProjetoFuncionalidade.ORCAMENTO, ProjetoAcao.APROVAR_ORCAMENTO, expect.any(Array), 'aprovar o orcamento');
  });

  it('calcula permissões financeiras para administrador e usuário comum', async () => {
    const authorization = {
      isSystemAdmin: jest.fn().mockReturnValue(true), assertFeatureActionAccess: jest.fn().mockResolvedValue(7),
      assertOperationalAction: jest.fn().mockRejectedValue(new ForbiddenException())
    };
    const service = new ProjetoOrcamentoAuthorizationService({} as never, authorization as never);
    const contexto = { empresaId: 7, projeto: { id: 'p1', arquivadoEm: null as Date | null }, papel: null };
    await expect(service.permissoes(contexto as never, user)).resolves.toEqual({ podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: true, podeAprovarOrcamento: true });
    contexto.projeto.arquivadoEm = new Date();
    await expect(service.permissoes(contexto as never, user)).resolves.toEqual({ podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: false, podeAprovarOrcamento: false });
    authorization.isSystemAdmin.mockReturnValue(false);
    authorization.assertFeatureActionAccess.mockRejectedValueOnce(new ForbiddenException());
    await expect(service.permissoes(contexto as never, user)).resolves.toEqual({ podeVisualizarFinanceiro: false, podeGerenciarFinanceiro: false, podeAprovarOrcamento: false });
    authorization.assertFeatureActionAccess.mockRejectedValueOnce(new Error('falha'));
    await expect(service.permissoes(contexto as never, user)).rejects.toThrow('falha');
  });

  it('valida contexto e permissões de recursos', async () => {
    const prisma = { projeto: { findFirst: jest.fn().mockResolvedValue(null) } };
    const authorization = {
      assertFeatureActionAccess: jest.fn().mockResolvedValue(7), isSystemAdmin: jest.fn().mockReturnValue(false),
      groupHasProjectAccess: jest.fn().mockReturnValue(true)
    };
    const service = new ProjetoRecursoAuthorizationService(prisma as never, authorization as never);
    await expect(service.contexto('p1', user)).rejects.toBeInstanceOf(NotFoundException);
    prisma.projeto.findFirst.mockResolvedValue({ id: 'p1', arquivadoEm: null });
    await expect(service.contexto('p1', user, ProjetoAcao.ALTERAR)).resolves.toEqual({ empresaId: 7, projeto: { id: 'p1', arquivadoEm: null } });
    expect(service.isSystemAdmin(user)).toBe(false); expect(service.groupHasProjectAccess({} as never)).toBe(true);

    authorization.isSystemAdmin.mockReturnValue(true);
    await expect(service.permissoes(user)).resolves.toEqual({ podeIncluir: true, podeAlterar: true, podeExcluir: true });
    authorization.isSystemAdmin.mockReturnValue(false);
    authorization.assertFeatureActionAccess
      .mockRejectedValueOnce(new ForbiddenException()).mockResolvedValueOnce(7).mockRejectedValueOnce(new ForbiddenException());
    await expect(service.permissoes(user)).resolves.toEqual({ podeIncluir: false, podeAlterar: true, podeExcluir: false });
    authorization.assertFeatureActionAccess.mockRejectedValueOnce(new Error('falha'));
    await expect(service.permissoes(user)).rejects.toThrow('falha');
  });
});
