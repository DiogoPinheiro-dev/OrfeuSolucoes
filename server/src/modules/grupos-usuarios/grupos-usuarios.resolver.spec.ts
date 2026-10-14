import { GUARDS_METADATA } from '@nestjs/common/constants';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { UpdateGrupoUsuarioInput } from './dto/update-grupo-usuario.input';
import { GruposUsuariosResolver } from './grupos-usuarios.resolver';

describe('GruposUsuariosResolver security', () => {
  it('preserva a identidade do administrador que altera um grupo', async () => {
    const service = {
      update: jest.fn().mockResolvedValue({ id: 7 })
    };
    const resolver = new GruposUsuariosResolver(service as never);
    const input = { id: 7 } as UpdateGrupoUsuarioInput;
    const user = {
      sub: 'admin-1',
      email: 'admin@orfeu.local',
      padraoSistema: true
    } as JwtPayload;

    await resolver.updateGrupoUsuario(input, user);

    expect(service.update).toHaveBeenCalledWith(input, user.sub);
  });

  it('exige autenticacao para alterar grupos', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      GruposUsuariosResolver.prototype.updateGrupoUsuario
    ) ?? [];

    expect(guards).toContain(GqlAuthGuard);
  });
});
