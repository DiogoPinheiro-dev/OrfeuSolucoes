import { ForbiddenException } from '@nestjs/common';
import { FuncionalidadeAuthorizationService } from './funcionalidade-authorization.service';

describe('FuncionalidadeAuthorizationService', () => {
  const myHubNavigation = jest.fn();
  const service = new FuncionalidadeAuthorizationService({ myHubNavigation } as never);
  const admin = {
    sub: 'admin',
    email: 'admin@orfeu.test',
    padraoSistema: true,
    empresaId: 10,
    grupo: null
  };

  beforeEach(() => myHubNavigation.mockReset());

  it('nao permite que o administrador contorne o contrato da empresa', async () => {
    myHubNavigation.mockResolvedValue([]);

    await expect(service.assertFeatureAction(
      admin,
      'projetos',
      'cadastro-de-projetos',
      'visualizar'
    )).rejects.toBeInstanceOf(ForbiddenException);
    expect(myHubNavigation).toHaveBeenCalledWith(admin);
  });

  it('autoriza a acao exposta pela navegacao efetiva', async () => {
    myHubNavigation.mockResolvedValue([{
      slug: 'projetos',
      funcionalidades: [{
        slug: 'cadastro-de-projetos',
        podeVisualizar: true,
        podeIncluir: true,
        podeAlterar: true,
        podeExcluir: true,
        acoes: [{ chave: 'visualizar', configuracao: 'visualizar', permitido: true }]
      }]
    }]);

    await expect(service.assertFeatureAction(
      admin,
      'projetos',
      'cadastro-de-projetos',
      'visualizar'
    )).resolves.toBeUndefined();
  });
});
