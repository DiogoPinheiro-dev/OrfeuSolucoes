import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateEmpresaInput } from './dto/create-empresa.input';
import { EmpresaType } from './dto/empresa.type';
import { UpdateEmpresaInput } from './dto/update-empresa.input';
import { EmpresasService } from './empresas.service';

@Resolver(() => EmpresaType)
export class EmpresasResolver {
  constructor(private readonly empresasService: EmpresasService) {}

  @Query(() => [EmpresaType])
  empresas(): Promise<EmpresaType[]> {
    return this.empresasService.findAll();
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => EmpresaType)
  createEmpresa(
    @Args('input') input: CreateEmpresaInput,
    @CurrentUser() user: JwtPayload
  ): Promise<EmpresaType> {
    return this.empresasService.create(input, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => EmpresaType)
  updateEmpresa(
    @Args('input') input: UpdateEmpresaInput,
    @CurrentUser() user: JwtPayload
  ): Promise<EmpresaType> {
    return this.empresasService.update(input, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  deleteEmpresa(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: JwtPayload
  ): Promise<boolean> {
    return this.empresasService.remove(id, user);
  }
}
