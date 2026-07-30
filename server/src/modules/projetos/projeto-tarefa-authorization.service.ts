import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoTarefaPermissoes } from './types/projeto-tarefa.types';

@Injectable()
export class ProjetoTarefaAuthorizationService {
  constructor(private readonly authorization: ProjetoAuthorizationService) {}

  async empresa(user: JwtPayload, action: string = ProjetoAcao.VISUALIZAR): Promise<number> {
    try {
      return await this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.GRADE_CAPACITACAO, action);
    } catch (error) {
      if (!(error instanceof ForbiddenException)) throw error;
      return this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.TAREFAS, action);
    }
  }

  async permissoes(user: JwtPayload): Promise<ProjetoTarefaPermissoes> {
    if (this.authorization.isSystemAdmin(user)) return { podeIncluir: true, podeAlterar: true, podeExcluir: true };
    const [incluir, alterar, excluir] = await Promise.all([
      this.can(() => this.empresa(user, ProjetoAcao.INCLUIR)),
      this.can(() => this.empresa(user, ProjetoAcao.ALTERAR)),
      this.can(() => this.empresa(user, ProjetoAcao.EXCLUIR))
    ]);
    return { podeIncluir: incluir, podeAlterar: alterar, podeExcluir: excluir };
  }

  private async can(operation: () => Promise<unknown>): Promise<boolean> {
    try { await operation(); return true; }
    catch (error) { if (error instanceof ForbiddenException) return false; throw error; }
  }
}
