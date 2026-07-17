import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { FullAccessGroup, FuncionalidadeAuthorizationService } from '../solucoes/funcionalidade-authorization.service';
import { FEATURES, SOLUTION_SLUG } from './constants/chamado.constants';
import { usuarioLabel } from './mappers/chamado.mapper';
import { isClosedStatus } from './policies/chamado-status.policy';
import { ChamadoRecord } from './types/chamado-record.types';

type ChamadosAccessGroup = FullAccessGroup & {
  solucoes?: Array<{ solucao?: { slug: string } | null }>;
  funcionalidades?: Array<{ funcionalidade?: { solucao?: { slug: string } | null } | null }>;
};

@Injectable()
export class ChamadoAuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly funcionalidadeAuthorization: FuncionalidadeAuthorizationService
  ) {}

  assertCompanyContext(user: JwtPayload): number {
    if (!user?.empresaId) {
      throw new ForbiddenException('Selecione uma empresa para acessar o controle de chamados.');
    }

    return user.empresaId;
  }

  async assertFeatureAction(user: JwtPayload, featureSlug: string, action: string): Promise<void> {
    return this.funcionalidadeAuthorization.assertFeatureAction(user, SOLUTION_SLUG, featureSlug, action);
  }

  async assertAnyFeatureAction(user: JwtPayload, featureSlug: string, actions: string[]): Promise<void> {
    for (const action of actions) {
      if (await this.canFeatureAction(user, featureSlug, action)) {
        return;
      }
    }

    throw new ForbiddenException('Usuario sem permissao para executar esta acao.');
  }

  async canFeatureAction(user: JwtPayload, featureSlug: string, action: string): Promise<boolean> {
    return this.funcionalidadeAuthorization.canFeatureAction(user, SOLUTION_SLUG, featureSlug, action);
  }

  async assertCanAttachFiles(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (chamado.solicitanteId === user.sub) {
      if (
        await this.canFeatureAction(user, FEATURES.meus, 'responder_proprio_chamado') ||
        await this.canFeatureAction(user, FEATURES.meus, 'visualizar') ||
        await this.canFeatureAction(user, FEATURES.abrir, 'incluir')
      ) {
        return;
      }

      throw new ForbiddenException('Usuario sem permissao para anexar arquivos neste chamado.');
    }

    if (await this.isAcompanhanteAtivo(chamado.id, user.sub) && await this.canUseAnyChamadosFeature(user)) {
      return;
    }

    await this.assertFeatureAction(user, FEATURES.painel, 'responder_chamado');
    this.assertCanOperateAtendimentoAtual(user, chamado);
  }

  async assertCanViewChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (isClosedStatus(chamado.status) && await this.canFeatureAction(user, FEATURES.arquivados, 'visualizar')) {
      return;
    }

    if (chamado.solicitanteId === user.sub) {
      await this.assertFeatureAction(user, FEATURES.meus, 'visualizar');
      return;
    }

    if (await this.isAcompanhanteAtivo(chamado.id, user.sub) && await this.canUseAnyChamadosFeature(user)) {
      return;
    }

    await this.assertFeatureAction(user, FEATURES.painel, 'visualizar_fila');
  }

  async assertCanRespondChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (chamado.solicitanteId === user.sub && await this.canFeatureAction(user, FEATURES.meus, 'responder_proprio_chamado')) {
      return;
    }

    if (await this.isAcompanhanteAtivo(chamado.id, user.sub) && await this.canUseAnyChamadosFeature(user)) {
      return;
    }

    await this.assertFeatureAction(user, FEATURES.painel, 'responder_chamado');
  }

  async assertCanManageAcompanhantes(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (chamado.solicitanteId === user.sub) {
      await this.assertFeatureAction(user, FEATURES.meus, 'visualizar');
      return;
    }

    if (await this.isUsuarioResponsavelOuLiderDoChamado(user, chamado)) {
      return;
    }

    if (
      await this.canFeatureAction(user, FEATURES.painel, 'gerenciar_acompanhantes') ||
      await this.canFeatureAction(user, FEATURES.painel, 'atribuir_chamado')
    ) {
      return;
    }

    throw new ForbiddenException('Usuario sem permissao para gerenciar acompanhantes deste chamado.');
  }

  async assertCanArchiveChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    await this.assertUsuarioResponsavelPeloChamado(user, chamado);

    if (await this.canFeatureAction(user, FEATURES.painel, 'encerrar_chamado')) {
      return;
    }

    if (chamado.solicitanteId === user.sub && await this.canFeatureAction(user, FEATURES.meus, 'excluir')) {
      return;
    }

    throw new ForbiddenException('Usuario sem permissao para arquivar este chamado.');
  }

  assertCanUnarchiveChamado(user: JwtPayload): void {
    if (this.isSystemAdmin(user) || this.hasFullAccessGroup(user.grupo)) {
      return;
    }

    throw new ForbiddenException('Apenas administradores podem desarquivar chamados.');
  }

  assertCanOperateAtendimentoAtual(user: JwtPayload, chamado: ChamadoRecord): void {
    if (!chamado.liderAtendimentoId || chamado.liderAtendimentoId === user.sub || this.isSystemAdmin(user)) {
      return;
    }

    throw new BadRequestException(`Este chamado ja esta em atendimento por ${usuarioLabel(chamado.liderAtendimento) || 'outro usuario'}.`);
  }

  async assertUsuarioResponsavelPeloChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (chamado.responsavelId) {
      if (chamado.responsavelId === user.sub) {
        return;
      }

      throw new ForbiddenException('Apenas o responsavel atual pelo chamado pode arquivar.');
    }

    if (chamado.liderAtendimentoId) {
      if (chamado.liderAtendimentoId === user.sub) {
        return;
      }

      throw new ForbiddenException('Apenas o responsavel atual pelo chamado pode arquivar.');
    }

    if (chamado.responsavelGrupoId) {
      await this.ensureUsuarioPertenceAoGrupoNaEmpresa(user.sub, chamado.empresaId, chamado.responsavelGrupoId);
      return;
    }

    throw new ForbiddenException('Apenas o responsavel atual pelo chamado pode arquivar.');
  }

  async ensureUsuarioPertenceAoGrupoNaEmpresa(usuarioId: string, empresaId: number, grupoId: number): Promise<void> {
    const vinculo = await this.prisma.empresaUsuario.findFirst({
      where: {
        empresaId,
        usuarioId,
        usuario: { grupoId }
      },
      select: { id: true }
    });

    if (!vinculo) {
      throw new ForbiddenException('Este chamado esta vinculado a um grupo do qual voce nao faz parte.');
    }
  }

  async isAcompanhanteAtivo(chamadoId: string, usuarioId: string): Promise<boolean> {
    const acompanhante = await (this.prisma as never as { chamadoAcompanhante: { findFirst: Function } }).chamadoAcompanhante.findFirst({
      where: { chamadoId, usuarioId, ativo: true },
      select: { id: true }
    });

    return !!acompanhante;
  }

  grupoPossuiAcessoControleChamados(grupo?: ChamadosAccessGroup | null): boolean {
    return !!grupo && (
      this.hasFullAccessGroup(grupo) ||
      (grupo.solucoes ?? []).some((item) => item.solucao?.slug === SOLUTION_SLUG) ||
      (grupo.funcionalidades ?? []).some((item) => item.funcionalidade?.solucao?.slug === SOLUTION_SLUG)
    );
  }

  isSystemAdmin(user?: { login?: string | null } | null): boolean {
    return user?.login?.toLowerCase() === 'admin';
  }

  hasFullAccessGroup(grupo?: FullAccessGroup | null): boolean {
    return this.funcionalidadeAuthorization.hasFullAccessGroup(grupo);
  }

  private async isUsuarioResponsavelOuLiderDoChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<boolean> {
    if (chamado.responsavelId && chamado.responsavelId === user.sub) {
      return true;
    }

    if (chamado.liderAtendimentoId && chamado.liderAtendimentoId === user.sub) {
      return true;
    }

    if (chamado.responsavelGrupoId) {
      const vinculo = await this.prisma.empresaUsuario.findFirst({
        where: {
          empresaId: chamado.empresaId,
          usuarioId: user.sub,
          usuario: { grupoId: chamado.responsavelGrupoId }
        },
        select: { id: true }
      });

      return !!vinculo;
    }

    return false;
  }

  async canUseAnyChamadosFeature(user: JwtPayload): Promise<boolean> {
    const candidates: Array<[string, string]> = [
      [FEATURES.abrir, 'visualizar'],
      [FEATURES.abrir, 'incluir'],
      [FEATURES.meus, 'visualizar'],
      [FEATURES.painel, 'visualizar_fila'],
      [FEATURES.arquivados, 'visualizar'],
      [FEATURES.categorias, 'visualizar'],
      [FEATURES.responsaveis, 'visualizar']
    ];

    for (const [feature, action] of candidates) {
      if (await this.canFeatureAction(user, feature, action)) {
        return true;
      }
    }

    return false;
  }

}
