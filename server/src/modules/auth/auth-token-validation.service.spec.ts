import { AuthTokenValidationService } from './auth-token-validation.service';
import { JwtPayload } from './strategies/jwt-payload.type';

describe('AuthTokenValidationService', () => {
  const payload: JwtPayload = {
    sub: '11111111-1111-4111-8111-111111111111',
    email: 'admin@orfeu.test',
    login: 'admin',
    padraoSistema: true,
    sessaoVersao: 3,
    grupo: {
      id: 1,
      nome: 'Administradores',
      acessoEcommerce: true,
      acessoProjetos: true,
      acessoHoras: true,
      acessoConfigurador: true
    },
    empresaId: 10
  };

  const user = {
    id: payload.sub,
    email: payload.email,
    login: payload.login,
    nome: 'Administrador',
    grupoId: 1,
    deveAlterarSenha: false,
    sessaoVersao: 3,
    padraoSistema: true,
    grupo: {
      id: 1,
      nome: 'Administradores atuais',
      descricao: null,
      acessoEcommerce: true,
      acessoProjetos: true,
      acessoHoras: true,
      acessoConfigurador: true,
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true
    }
  };

  function buildService(overrides: { user?: typeof user | null; membership?: { id: number } | null } = {}) {
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue(overrides.user === undefined ? user : overrides.user)
      },
      empresaUsuario: {
        findUnique: jest.fn().mockResolvedValue(
          overrides.membership === undefined ? { id: 1 } : overrides.membership
        )
      }
    };

    return {
      prisma,
      service: new AuthTokenValidationService(prisma as never)
    };
  }

  it('aceita a sessao que corresponde ao estado atual', async () => {
    const { service } = buildService();

    await expect(service.validate(payload)).resolves.toMatchObject({
      sub: payload.sub,
      sessaoVersao: 3,
      padraoSistema: true,
      grupo: expect.objectContaining({ nome: 'Administradores atuais' })
    });
  });

  it('rejeita token emitido antes de uma revogacao', async () => {
    const { service } = buildService({ user: { ...user, sessaoVersao: 4 } });

    await expect(service.validate(payload)).rejects.toThrow('Sessao invalida ou revogada');
  });

  it('reconstroi autorizacao com as flags atuais do grupo, nunca com o JWT', async () => {
    const restrictedGroup = {
      ...user.grupo,
      nome: 'Grupo restrito',
      acessoEcommerce: false,
      acessoProjetos: false,
      acessoHoras: false,
      acessoConfigurador: false,
      podeVisualizar: true,
      podeIncluir: false,
      podeAlterar: false,
      podeExcluir: false
    };
    const { service } = buildService({ user: { ...user, grupo: restrictedGroup } });

    await expect(service.validate({
      ...payload,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true
    })).resolves.toMatchObject({
      grupo: expect.objectContaining({
        nome: 'Grupo restrito',
        acessoConfigurador: false
      }),
      podeIncluir: false,
      podeAlterar: false,
      podeExcluir: false
    });
  });

  it('rejeita empresa que nao esta mais vinculada ao usuario', async () => {
    const { service } = buildService({ membership: null });

    await expect(service.validate(payload)).rejects.toThrow('Sessao invalida ou revogada');
  });

  it('rejeita usuario removido', async () => {
    const { service } = buildService({ user: null });

    await expect(service.validate(payload)).rejects.toThrow('Sessao invalida ou revogada');
  });
});
