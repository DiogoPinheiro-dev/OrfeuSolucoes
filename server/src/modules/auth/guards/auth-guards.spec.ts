import { Test } from '@nestjs/testing';
import { GqlAuthGuard } from './gql-auth.guard';
import { RestAuthGuard } from './rest-auth.guard';

describe('auth guards', () => {
  it('sao resolvidos pela injecao de dependencias sem AuthModuleOptions registrado', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [GqlAuthGuard, RestAuthGuard]
    }).compile();

    expect(moduleRef.get(GqlAuthGuard)).toBeInstanceOf(GqlAuthGuard);
    expect(moduleRef.get(RestAuthGuard)).toBeInstanceOf(RestAuthGuard);
  });
});
