import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import {
  ProjetoAcao,
  ProjetoFuncionalidade
} from './constants/projeto-operacional.constants';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { resolveMeuPapel } from './mappers/projeto.mapper';
import {
  ProjetoSprintPermissoesEfetivas
} from './types/projeto-sprint.types';
import { ProjetoPapel, ProjetoRecord } from './types/projeto.types';

const PROJECT_INCLUDE = {
  responsavel: true,
  criadoPor: true,
  arquivadoPor: true,
  membros: { include: { usuario: true } }
};

export type ProjetoSprintContexto = {
  empresaId: number;
  projeto: ProjetoRecord;
  papel: ProjetoPapel | null;
};

@Injectable()
export class ProjetoSprintAuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoAuthorizationService
  ) {}

  async assertReadContext(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoSprintContexto> {
    const empresaId = await this.authorization.assertFeatureActionAccess(
      user,
      ProjetoFuncionalidade.SPRINTS,
      ProjetoAcao.VISUALIZAR
    );
    const projeto = await this.prisma.projeto.findFirst({
      where: { id: projetoId, empresaId },
      include: PROJECT_INCLUDE
    }) as unknown as ProjetoRecord | null;

    this.authorization.assertVisibleProject(projeto, user, empresaId);
    return {
      empresaId,
      projeto,
      papel: resolveMeuPapel(projeto, user.sub)
    };
  }

  assertWritable(contexto: ProjetoSprintContexto): void {
    this.authorization.assertWritableProject(contexto.projeto);
  }

  async assertAction(
    contexto: ProjetoSprintContexto,
    user: JwtPayload,
    action: string,
    operation: string
  ): Promise<void> {
    await this.authorization.assertOperationalAction(
      user,
      contexto.projeto,
      contexto.empresaId,
      contexto.papel,
      ProjetoFuncionalidade.SPRINTS,
      action,
      [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO],
      operation
    );
  }

  async effectivePermissions(
    contexto: ProjetoSprintContexto,
    user: JwtPayload
  ): Promise<ProjetoSprintPermissoesEfetivas> {
    const somenteLeitura = !!contexto.projeto.arquivadoEm;

    if (this.authorization.isSystemAdmin(user)) {
      return {
        podeVisualizar: true,
        podeCriar: !somenteLeitura,
        podeEditar: !somenteLeitura,
        podePlanejar: !somenteLeitura,
        podeIniciar: !somenteLeitura,
        podeConcluir: !somenteLeitura,
        podeCancelar: !somenteLeitura
      };
    }

    const podeExecutar =
      contexto.papel === ProjetoPapel.RESPONSAVEL ||
      contexto.papel === ProjetoPapel.MEMBRO;
    const [podeIncluir, podeAlterar, podePlanejar, podeIniciar, podeConcluir, podeCancelar] =
      await Promise.all([
        this.can(user, ProjetoAcao.INCLUIR),
        this.can(user, ProjetoAcao.ALTERAR),
        this.can(user, ProjetoAcao.PLANEJAR),
        this.can(user, ProjetoAcao.INICIAR),
        this.can(user, ProjetoAcao.CONCLUIR),
        this.can(user, ProjetoAcao.CANCELAR)
      ]);
    const writable = podeExecutar && !somenteLeitura;

    return {
      podeVisualizar: !!contexto.papel,
      podeCriar: writable && podeIncluir,
      podeEditar: writable && podeAlterar,
      podePlanejar: writable && podePlanejar,
      podeIniciar: writable && podeIniciar,
      podeConcluir: writable && podeConcluir,
      podeCancelar: writable && podeCancelar
    };
  }

  private async can(user: JwtPayload, action: string): Promise<boolean> {
    try {
      await this.authorization.assertFeatureActionAccess(
        user,
        ProjetoFuncionalidade.SPRINTS,
        action
      );
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) return false;
      throw error;
    }
  }
}
