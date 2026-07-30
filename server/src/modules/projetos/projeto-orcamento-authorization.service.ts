import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import { resolveMeuPapel } from './mappers/projeto.mapper';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoOrcamentoPermissoes } from './types/projeto-orcamento.types';
import { ProjetoPapel, ProjetoRecord } from './types/projeto.types';

const PROJECT_INCLUDE = { responsavel: true, criadoPor: true, arquivadoPor: true, membros: { include: { usuario: true } } };
export type ProjetoOrcamentoContexto = { empresaId: number; projeto: ProjetoRecord; papel: ProjetoPapel | null };

@Injectable()
export class ProjetoOrcamentoAuthorizationService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ProjetoAuthorizationService) {}

  async projetos(user: JwtPayload) {
    const empresaId = await this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.ORCAMENTO, ProjetoAcao.VISUALIZAR);
    return { empresaId, where: this.authorization.isSystemAdmin(user) ? { empresaId } : { empresaId, ...this.authorization.visibilityWhere(user) } };
  }

  async contexto(projetoId: string, user: JwtPayload): Promise<ProjetoOrcamentoContexto> {
    const empresaId = await this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.ORCAMENTO, ProjetoAcao.VISUALIZAR);
    const projeto = await this.prisma.projeto.findFirst({ where: { id: projetoId, empresaId }, include: PROJECT_INCLUDE }) as unknown as ProjetoRecord | null;
    this.authorization.assertVisibleProject(projeto, user, empresaId);
    return { empresaId, projeto, papel: resolveMeuPapel(projeto, user.sub) };
  }

  async gerenciarFinanceiro(contexto: ProjetoOrcamentoContexto, user: JwtPayload): Promise<void> {
    await this.financeiro(contexto, user, ProjetoAcao.GERENCIAR_FINANCEIRO, 'gerenciar o financeiro');
  }

  async aprovarOrcamento(contexto: ProjetoOrcamentoContexto, user: JwtPayload): Promise<void> {
    await this.financeiro(contexto, user, ProjetoAcao.APROVAR_ORCAMENTO, 'aprovar o orcamento');
  }

  async permissoes(contexto: ProjetoOrcamentoContexto, user: JwtPayload): Promise<ProjetoOrcamentoPermissoes> {
    if (this.authorization.isSystemAdmin(user)) {
      return { podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: !contexto.projeto.arquivadoEm, podeAprovarOrcamento: !contexto.projeto.arquivadoEm };
    }
    const [visualizar, gerenciar, aprovar] = await Promise.all([
      this.can(() => this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.ORCAMENTO, ProjetoAcao.VISUALIZAR_FINANCEIRO).then(() => undefined)),
      this.can(() => this.gerenciarFinanceiro(contexto, user)),
      this.can(() => this.aprovarOrcamento(contexto, user))
    ]);
    return { podeVisualizarFinanceiro: visualizar, podeGerenciarFinanceiro: gerenciar, podeAprovarOrcamento: aprovar };
  }

  private async financeiro(contexto: ProjetoOrcamentoContexto, user: JwtPayload, action: string, operation: string) {
    await this.authorization.assertOperationalAction(user, contexto.projeto, contexto.empresaId, contexto.papel,
      ProjetoFuncionalidade.ORCAMENTO, action, [ProjetoPapel.RESPONSAVEL], operation);
  }

  private async can(operation: () => Promise<void>): Promise<boolean> {
    try { await operation(); return true; }
    catch (error) { if (error instanceof ForbiddenException) return false; throw error; }
  }
}
