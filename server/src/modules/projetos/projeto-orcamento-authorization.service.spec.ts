import { ForbiddenException } from '@nestjs/common';
import { ProjetoOrcamentoAuthorizationService } from './projeto-orcamento-authorization.service';

describe('ProjetoOrcamentoAuthorizationService', () => {
  const user = { sub: 'usuario-1', empresaId: 7 } as never;

  it('consulta visualizar_financeiro sem exigir a tela de orcamento', async () => {
    const authorization = {
      isSystemAdmin: jest.fn().mockReturnValue(false),
      assertFeatureActionAccess: jest.fn().mockResolvedValue(7)
    };
    const service = new ProjetoOrcamentoAuthorizationService({} as never, authorization as never);

    await expect(service.podeVisualizarFinanceiro(user)).resolves.toBe(true);
    expect(authorization.assertFeatureActionAccess).toHaveBeenCalledWith(
      user,
      'orcamento-do-projeto',
      'visualizar_financeiro'
    );
  });

  it('converte somente negacao de permissao em bloco financeiro oculto', async () => {
    const authorization = {
      isSystemAdmin: jest.fn().mockReturnValue(false),
      assertFeatureActionAccess: jest.fn().mockRejectedValue(new ForbiddenException())
    };
    const service = new ProjetoOrcamentoAuthorizationService({} as never, authorization as never);

    await expect(service.podeVisualizarFinanceiro(user)).resolves.toBe(false);
  });
});
