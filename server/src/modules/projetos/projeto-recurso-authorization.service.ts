import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoRecursoPermissoes } from './types/projeto-recurso.types';

export type ProjetoRecursoContexto = {
  empresaId: number;
  projeto: { id: string; arquivadoEm: Date | null };
};

@Injectable()
export class ProjetoRecursoAuthorizationService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ProjetoAuthorizationService) {}

  empresa(user: JwtPayload, action: string = ProjetoAcao.VISUALIZAR): Promise<number> {
    return this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.PLANEJAMENTO_RECURSOS, action);
  }

  async contexto(projetoId: string, user: JwtPayload, action: string = ProjetoAcao.VISUALIZAR): Promise<ProjetoRecursoContexto> {
    const empresaId = await this.empresa(user, action);
    const projeto = await this.prisma.projeto.findFirst({ where: { id: projetoId, empresaId }, select: { id: true, arquivadoEm: true } });
    if (!projeto) throw new NotFoundException('Projeto nao encontrado.');
    return { empresaId, projeto };
  }

  async permissoes(user: JwtPayload): Promise<ProjetoRecursoPermissoes> {
    if (this.authorization.isSystemAdmin(user)) return { podeIncluir: true, podeAlterar: true, podeExcluir: true };
    const [incluir, alterar, excluir] = await Promise.all([
      this.can(() => this.empresa(user, ProjetoAcao.INCLUIR).then(() => undefined)),
      this.can(() => this.empresa(user, ProjetoAcao.ALTERAR).then(() => undefined)),
      this.can(() => this.empresa(user, ProjetoAcao.EXCLUIR).then(() => undefined))
    ]);
    return { podeIncluir: incluir, podeAlterar: alterar, podeExcluir: excluir };
  }

  isSystemAdmin(user: { login?: string | null }) { return this.authorization.isSystemAdmin(user); }
  groupHasProjectAccess(group: Parameters<ProjetoAuthorizationService['groupHasProjectAccess']>[0]) { return this.authorization.groupHasProjectAccess(group); }

  private async can(operation: () => Promise<void>): Promise<boolean> {
    try { await operation(); return true; }
    catch (error) { if (error instanceof ForbiddenException) return false; throw error; }
  }
}
