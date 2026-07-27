import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import {
  ProjetoAcao,
  ProjetoFuncionalidade
} from './constants/projeto-operacional.constants';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { resolveMeuPapel } from './mappers/projeto.mapper';
import { ProjetoMarcoEntregaPermissoes } from './types/projeto-marco-entrega.types';
import { ProjetoPapel, ProjetoRecord } from './types/projeto.types';

const PROJECT_INCLUDE = {
  responsavel: true,
  criadoPor: true,
  arquivadoPor: true,
  membros: { include: { usuario: true } }
};

export type ProjetoMarcoEntregaContexto = {
  empresaId: number;
  projeto: ProjetoRecord;
  papel: ProjetoPapel | null;
};

@Injectable()
export class ProjetoMarcoEntregaAuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoAuthorizationService
  ) {}

  async assertReadContext(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoMarcoEntregaContexto> {
    const empresaId = await this.authorization.assertFeatureActionAccess(
      user,
      ProjetoFuncionalidade.MARCOS_ENTREGAS,
      ProjetoAcao.VISUALIZAR
    );
    const projeto = await this.prisma.projeto.findFirst({
      where: { id: projetoId, empresaId },
      include: PROJECT_INCLUDE
    }) as unknown as ProjetoRecord | null;
    this.authorization.assertVisibleProject(projeto, user, empresaId);
    return { empresaId, projeto, papel: resolveMeuPapel(projeto, user.sub) };
  }

  async assertAction(
    contexto: ProjetoMarcoEntregaContexto,
    user: JwtPayload,
    action: string,
    operation: string
  ): Promise<void> {
    await this.authorization.assertOperationalAction(
      user,
      contexto.projeto,
      contexto.empresaId,
      contexto.papel,
      ProjetoFuncionalidade.MARCOS_ENTREGAS,
      action,
      [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO],
      operation
    );
  }

  async effectivePermissions(
    contexto: ProjetoMarcoEntregaContexto,
    user: JwtPayload
  ): Promise<ProjetoMarcoEntregaPermissoes> {
    const somenteLeitura = !!contexto.projeto.arquivadoEm;
    if (this.authorization.isSystemAdmin(user)) {
      return {
        podeVisualizar: true,
        podeCriar: !somenteLeitura,
        podeEditar: !somenteLeitura,
        podeArquivar: !somenteLeitura,
        podeReativar: !somenteLeitura
      };
    }
    const podeExecutar =
      contexto.papel === ProjetoPapel.RESPONSAVEL ||
      contexto.papel === ProjetoPapel.MEMBRO;
    const [incluir, alterar, excluir] = await Promise.all([
      this.can(user, ProjetoAcao.INCLUIR),
      this.can(user, ProjetoAcao.ALTERAR),
      this.can(user, ProjetoAcao.EXCLUIR)
    ]);
    const writable = podeExecutar && !somenteLeitura;
    return {
      podeVisualizar: !!contexto.papel,
      podeCriar: writable && incluir,
      podeEditar: writable && alterar,
      podeArquivar: writable && excluir,
      podeReativar: writable && alterar
    };
  }

  private async can(user: JwtPayload, action: string): Promise<boolean> {
    try {
      await this.authorization.assertFeatureActionAccess(
        user,
        ProjetoFuncionalidade.MARCOS_ENTREGAS,
        action
      );
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) return false;
      throw error;
    }
  }
}
