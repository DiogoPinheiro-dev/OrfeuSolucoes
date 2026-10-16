import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoIndicadorOrcamentoType, ProjetoPainelType } from './dto/projeto-painel.type';
import { percentualConsumido, statusDoOrcamento } from './policies/projeto-indicadores.policy';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoIndicadoresService } from './projeto-indicadores.service';
import { ProjetoOrcamentoService } from './projeto-orcamento.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoRecord } from './types/projeto.types';

const PROJECT_INCLUDE = {
  responsavel: true,
  criadoPor: true,
  arquivadoPor: true,
  membros: { include: { usuario: true } }
};

@Injectable()
export class ProjetoPainelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoAuthorizationService,
    private readonly indicadores: ProjetoIndicadoresService,
    private readonly orcamento: ProjetoOrcamentoService,
    private readonly periodo: ProjetoPeriodoService
  ) {}

  async painel(projetoId: string, user: JwtPayload): Promise<ProjetoPainelType> {
    const empresaId = await this.authorization.assertReadAccess(user);
    const projeto = await this.prisma.projeto.findFirst({
      where: { id: projetoId, empresaId },
      include: PROJECT_INCLUDE
    }) as unknown as ProjetoRecord | null;
    this.authorization.assertVisibleProject(projeto, user, empresaId);

    const agora = new Date();
    const [indicadores, resumoOrcamento] = await Promise.all([
      this.indicadores.calcular({
        empresaId,
        projeto,
        agora,
        hojeOperacional: this.periodo.hojeOperacional(agora)
      }),
      this.orcamento.resumoPainel(projetoId, empresaId, user)
    ]);

    return {
      projetoId,
      ...indicadores,
      orcamento: resumoOrcamento.podeVisualizar
        ? this.mapearOrcamento(resumoOrcamento.financeiro, agora)
        : null
    };
  }

  private mapearOrcamento(financeiro: any | null, calculadoEm: Date): ProjetoIndicadorOrcamentoType {
    if (!financeiro) {
      return {
        calculadoEm,
        avisos: ['O projeto nao possui orcamento cadastrado.'],
        origem: { tela: 'Orcamento do projeto', filtros: [] },
        moeda: null,
        totalPlanejado: null,
        totalRealizadoConsolidado: null,
        variacaoConsolidada: null,
        percentualConsumido: null,
        status: 'SEM_ORCAMENTO',
        apontamentosSemCusto: 0
      };
    }
    const avisos = [
      ...(financeiro.status !== 'APROVADO' ? ['O orcamento ainda nao foi aprovado.'] : []),
      ...(financeiro.apontamentosSemCusto ? ['Ha apontamentos aprovados sem custo calculado.'] : [])
    ];
    return {
      calculadoEm,
      avisos,
      origem: {
        tela: 'Orcamento do projeto',
        filtros: ['horas.status=APROVADO']
      },
      moeda: financeiro.moeda,
      totalPlanejado: financeiro.totalPlanejado,
      totalRealizadoConsolidado: financeiro.totalRealizadoConsolidado,
      variacaoConsolidada: financeiro.variacaoConsolidada,
      percentualConsumido: percentualConsumido(
        financeiro.totalPlanejado,
        financeiro.totalRealizadoConsolidado
      ),
      status: statusDoOrcamento(
        financeiro.totalPlanejado,
        financeiro.totalRealizadoConsolidado
      ),
      apontamentosSemCusto: financeiro.apontamentosSemCusto
    };
  }
}
