import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import { resolveMeuPapel } from './mappers/projeto.mapper';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import {
  ProjetoItemContexto,
  ProjetoItemPermissoesEfetivas
} from './types/projeto-item.types';
import { ProjetoPapel, ProjetoRecord } from './types/projeto.types';

const PROJECT_INCLUDE = {
  responsavel: true,
  criadoPor: true,
  arquivadoPor: true,
  membros: { include: { usuario: true } }
};

@Injectable()
export class ProjetoItemAuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoAuthorizationService
  ) {}

  async assertReadContext(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoItemContexto> {
    const empresaId = await this.authorization.assertFeatureActionAccess(
      user,
      ProjetoFuncionalidade.BACKLOG,
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

  async assertCreateContext(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoItemContexto> {
    return this.assertMutationContext(
      projetoId,
      user,
      ProjetoAcao.INCLUIR,
      'criar itens'
    );
  }

  async assertEditContext(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoItemContexto> {
    return this.assertMutationContext(
      projetoId,
      user,
      ProjetoAcao.ALTERAR,
      'alterar itens'
    );
  }

  async assertStatusContext(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoItemContexto> {
    return this.assertMutationContext(
      projetoId,
      user,
      ProjetoAcao.ALTERAR_STATUS,
      'alterar o status de itens'
    );
  }

  async assertArchiveContext(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoItemContexto> {
    return this.assertMutationContext(
      projetoId,
      user,
      ProjetoAcao.EXCLUIR,
      'arquivar itens'
    );
  }

  async assertReactivateContext(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoItemContexto> {
    return this.assertMutationContext(
      projetoId,
      user,
      ProjetoAcao.ALTERAR,
      'reativar itens'
    );
  }

  async assertPrioritizeContext(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoItemContexto> {
    return this.assertMutationContext(
      projetoId,
      user,
      ProjetoAcao.PRIORIZAR,
      'priorizar o backlog'
    );
  }

  async assertResponsavelElegivel(
    tx: Prisma.TransactionClient,
    contexto: ProjetoItemContexto,
    responsavelId?: string | null
  ): Promise<void> {
    if (!responsavelId) return;

    const papel = responsavelId === contexto.projeto.responsavelId
      ? ProjetoPapel.RESPONSAVEL
      : contexto.projeto.membros.find(
          (item) => item.usuarioId === responsavelId
        )?.papel;
    const vinculo = await tx.empresaUsuario.findUnique({
      where: {
        empresaId_usuarioId: {
          empresaId: contexto.empresaId,
          usuarioId: responsavelId
        }
      },
      select: { id: true }
    });

    if (
      !vinculo ||
      (papel !== ProjetoPapel.RESPONSAVEL && papel !== ProjetoPapel.MEMBRO)
    ) {
      throw new ForbiddenException(
        'O responsavel do item deve pertencer a empresa e a equipe executora do projeto.'
      );
    }
  }

  async effectivePermissions(
    user: JwtPayload,
    contexto: ProjetoItemContexto
  ): Promise<ProjetoItemPermissoesEfetivas> {
    const podeExecutar = this.authorization.isSystemAdmin(user) ||
      contexto.papel === ProjetoPapel.RESPONSAVEL ||
      contexto.papel === ProjetoPapel.MEMBRO;
    const somenteLeitura = !!contexto.projeto.arquivadoEm;

    if (this.authorization.isSystemAdmin(user)) {
      return {
        podeVisualizar: true,
        podeCriar: !somenteLeitura,
        podeAlterar: !somenteLeitura,
        podeAlterarStatus: !somenteLeitura,
        podeArquivar: !somenteLeitura,
        podeReativar: !somenteLeitura,
        podePriorizar: !somenteLeitura
      };
    }

    const [
      podeCriar,
      podeAlterar,
      podeAlterarStatus,
      podeArquivar,
      podePriorizar
    ] = await Promise.all([
      this.can(user, ProjetoAcao.INCLUIR),
      this.can(user, ProjetoAcao.ALTERAR),
      this.can(user, ProjetoAcao.ALTERAR_STATUS),
      this.can(user, ProjetoAcao.EXCLUIR),
      this.can(user, ProjetoAcao.PRIORIZAR)
    ]);

    return {
      podeVisualizar: !!contexto.papel,
      podeCriar: podeExecutar && podeCriar && !somenteLeitura,
      podeAlterar: podeExecutar && podeAlterar && !somenteLeitura,
      podeAlterarStatus:
        podeExecutar && podeAlterarStatus && !somenteLeitura,
      podeArquivar: podeExecutar && podeArquivar && !somenteLeitura,
      podeReativar: podeExecutar && podeAlterar && !somenteLeitura,
      podePriorizar: podeExecutar && podePriorizar && !somenteLeitura
    };
  }

  private async assertMutationContext(
    projetoId: string,
    user: JwtPayload,
    action: string,
    operation: string
  ): Promise<ProjetoItemContexto> {
    const contexto = await this.assertReadContext(projetoId, user);
    await this.authorization.assertOperationalAction(
      user,
      contexto.projeto,
      contexto.empresaId,
      contexto.papel,
      ProjetoFuncionalidade.BACKLOG,
      action,
      [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO],
      operation
    );
    return contexto;
  }

  private async can(user: JwtPayload, action: string): Promise<boolean> {
    try {
      await this.authorization.assertFeatureActionAccess(
        user,
        ProjetoFuncionalidade.BACKLOG,
        action
      );
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) return false;
      throw error;
    }
  }
}
