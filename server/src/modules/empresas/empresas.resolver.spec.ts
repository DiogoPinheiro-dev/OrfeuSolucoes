import { GUARDS_METADATA } from '@nestjs/common/constants';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { EmpresasResolver } from './empresas.resolver';

describe('EmpresasResolver security', () => {
  it('exige autenticacao para a listagem administrativa', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      EmpresasResolver.prototype.empresas
    ) ?? [];

    expect(guards).toContain(GqlAuthGuard);
  });
});
