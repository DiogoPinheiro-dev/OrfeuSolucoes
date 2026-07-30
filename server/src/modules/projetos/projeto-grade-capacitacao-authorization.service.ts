import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import { ProjetoAuthorizationService } from './projeto-authorization.service';

export type ProjetoGradeCapacitacaoContexto = {
  empresaId: number;
  projeto: { id: string; arquivadoEm: Date | null };
};

@Injectable()
export class ProjetoGradeCapacitacaoAuthorizationService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ProjetoAuthorizationService) {}

  async empresa(user: JwtPayload, action: string = ProjetoAcao.VISUALIZAR): Promise<number> {
    try {
      return await this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.GRADE_CAPACITACAO, action);
    } catch (error) {
      if (!(error instanceof ForbiddenException)) throw error;
      return this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.TAREFAS, action);
    }
  }

  async contexto(projetoId: string, user: JwtPayload, action: string = ProjetoAcao.VISUALIZAR): Promise<ProjetoGradeCapacitacaoContexto> {
    const empresaId = await this.empresa(user, action);
    const projeto = await this.prisma.projeto.findFirst({ where: { id: projetoId, empresaId }, select: { id: true, arquivadoEm: true } });
    if (!projeto) throw new NotFoundException('Projeto nao encontrado.');
    return { empresaId, projeto };
  }

  async permissoes(user: JwtPayload) {
    if (this.authorization.isSystemAdmin(user)) return { podeIncluir: true, podeAlterar: true, podeExcluir: true };
    const [incluir, alterar, excluir] = await Promise.all([
      this.can(() => this.empresa(user, ProjetoAcao.INCLUIR).then(() => undefined)),
      this.can(() => this.empresa(user, ProjetoAcao.ALTERAR).then(() => undefined)),
      this.can(() => this.empresa(user, ProjetoAcao.EXCLUIR).then(() => undefined))
    ]);
    return { podeIncluir: incluir, podeAlterar: alterar, podeExcluir: excluir };
  }

  private async can(operation: () => Promise<void>): Promise<boolean> {
    try { await operation(); return true; }
    catch (error) { if (error instanceof ForbiddenException) return false; throw error; }
  }
}
