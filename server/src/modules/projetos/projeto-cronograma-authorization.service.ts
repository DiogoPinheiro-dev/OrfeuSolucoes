import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import {
  ProjetoAcao,
  ProjetoFuncionalidade
} from './constants/projeto-operacional.constants';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { resolveMeuPapel } from './mappers/projeto.mapper';
import { ProjetoCronogramaPermissoes } from './types/projeto-cronograma.types';
import { ProjetoPapel, ProjetoRecord } from './types/projeto.types';

const PROJECT_INCLUDE = {
  responsavel: true,
  criadoPor: true,
  arquivadoPor: true,
  membros: { include: { usuario: true } }
};

export type ProjetoCronogramaContexto = {
  empresaId: number;
  projeto: ProjetoRecord;
  papel: ProjetoPapel | null;
};

@Injectable()
export class ProjetoCronogramaAuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoAuthorizationService
  ) {}

  async assertReadContext(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoCronogramaContexto> {
    const empresaId = await this.authorization.assertFeatureActionAccess(
      user,
      ProjetoFuncionalidade.CRONOGRAMA,
      ProjetoAcao.VISUALIZAR
    );
    const projeto = await this.prisma.projeto.findFirst({
      where: { id: projetoId, empresaId },
      include: PROJECT_INCLUDE
    }) as unknown as ProjetoRecord | null;
    this.authorization.assertVisibleProject(projeto, user, empresaId);
    return { empresaId, projeto, papel: resolveMeuPapel(projeto, user.sub) };
  }

  async assertManageDependencies(
    contexto: ProjetoCronogramaContexto,
    user: JwtPayload
  ): Promise<void> {
    await this.authorization.assertOperationalAction(
      user,
      contexto.projeto,
      contexto.empresaId,
      contexto.papel,
      ProjetoFuncionalidade.CRONOGRAMA,
      ProjetoAcao.ALTERAR,
      [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO],
      'gerenciar dependencias'
    );
  }

  async assertEditDates(
    contexto: ProjetoCronogramaContexto,
    user: JwtPayload
  ): Promise<void> {
    await this.authorization.assertOperationalAction(
      user,
      contexto.projeto,
      contexto.empresaId,
      contexto.papel,
      ProjetoFuncionalidade.CRONOGRAMA,
      ProjetoAcao.EDITAR_DATAS,
      [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO],
      'editar datas do cronograma'
    );
  }

  async effectivePermissions(
    contexto: ProjetoCronogramaContexto,
    user: JwtPayload
  ): Promise<ProjetoCronogramaPermissoes> {
    if (this.authorization.isSystemAdmin(user)) {
      const writable = !contexto.projeto.arquivadoEm;
      return {
        podeVisualizar: true,
        podeGerenciarDependencias: writable,
        podeEditarDatas: writable
      };
    }
    const writable = !contexto.projeto.arquivadoEm && (
      contexto.papel === ProjetoPapel.RESPONSAVEL ||
      contexto.papel === ProjetoPapel.MEMBRO
    );
    const [alterar, editarDatas] = await Promise.all([
      this.can(user, ProjetoAcao.ALTERAR),
      this.can(user, ProjetoAcao.EDITAR_DATAS)
    ]);
    return {
      podeVisualizar: !!contexto.papel,
      podeGerenciarDependencias: writable && alterar,
      podeEditarDatas: writable && editarDatas
    };
  }

  private async can(user: JwtPayload, action: string): Promise<boolean> {
    try {
      await this.authorization.assertFeatureActionAccess(
        user,
        ProjetoFuncionalidade.CRONOGRAMA,
        action
      );
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) return false;
      throw error;
    }
  }
}
