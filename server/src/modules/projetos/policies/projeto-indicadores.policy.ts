import { Prisma } from '@prisma/client';
import {
  ProjetoIndicadorAtividadeType,
  ProjetoIndicadorBloqueiosType,
  ProjetoIndicadorMarcosEntregasType,
  ProjetoIndicadorPrazosType,
  ProjetoIndicadorProgressoType,
  ProjetoIndicadorSprintType,
  ProjetoPainelItemRecord
} from '../dto/projeto-painel.type';
import { ProjetoApontamentoStatus } from '../types/projeto-apontamento.types';
import { ProjetoEntregaStatus, ProjetoMarcoStatus } from '../types/projeto-marco-entrega.types';
import { ProjetoItemStatus } from '../types/projeto-item.types';
import { ProjetoRecord } from '../types/projeto.types';
import {
  calcularProgressoEsperado,
  calcularProjetoProgresso,
  diasAteData,
  estaVencidoNoDiaOperacional
} from './projeto-progresso.policy';

export type ProjetoIndicadoresDados = {
  projeto: ProjetoRecord;
  itens: ProjetoPainelItemRecord[];
  sprintAtiva: any | null;
  dependencias: any[];
  marcos: any[];
  entregas: any[];
  ultimaAtualizacao: any | null;
  eventosNosUltimosSeteDias: number;
  ultimoEvento: { criadoEm: Date } | null;
  esforcoPorStatus: any[];
  agora: Date;
  hojeOperacional: string;
};

export function calcularProjetoIndicadores(dados: ProjetoIndicadoresDados) {
  const {
    projeto,
    itens,
    sprintAtiva,
    dependencias,
    marcos,
    entregas,
    ultimaAtualizacao,
    eventosNosUltimosSeteDias,
    ultimoEvento,
    esforcoPorStatus,
    agora,
    hojeOperacional
  } = dados;

  return {
    progresso: indicadorProgresso(projeto, itens, agora, hojeOperacional),
    prazos: indicadorPrazos(projeto, itens, agora, hojeOperacional),
    sprintAtiva: indicadorSprint(projeto, sprintAtiva, agora, hojeOperacional),
    bloqueios: indicadorBloqueios(itens, dependencias, agora),
    marcosEntregas: indicadorMarcosEntregas(marcos, entregas, agora, hojeOperacional),
    esforco: {
      ...base(agora, 'Horas do projeto', ['arquivadoEm=null']),
      avisos: avisoItensSemEstimativa(itens),
      estimativaTotalMinutos: calcularProjetoProgresso(itens).estimativaTotalMinutos,
      minutosAprovados: minutos(esforcoPorStatus, ProjetoApontamentoStatus.APROVADO),
      minutosEnviadosPendentes: minutos(esforcoPorStatus, ProjetoApontamentoStatus.ENVIADO)
    },
    atividade: {
      ...base(agora, 'Comunicacao do projeto', ['periodo=ultimos-7-dias']),
      avisos: ultimaAtualizacao ? [] : ['O projeto nao possui atualizacao de status.'],
      ultimaAtualizacaoEm: ultimaAtualizacao?.criadoEm ?? null,
      ultimaAtualizacaoAutor: nomeDoUsuario(ultimaAtualizacao?.autor),
      saudePercebida: ultimaAtualizacao?.saudePercebida ?? null,
      eventosNosUltimosSeteDias,
      ultimoEventoEm: ultimoEvento?.criadoEm ?? null
    } satisfies ProjetoIndicadorAtividadeType
  };
}

function indicadorProgresso(
  projeto: ProjetoRecord,
  itens: ProjetoPainelItemRecord[],
  agora: Date,
  hojeOperacional: string
): ProjetoIndicadorProgressoType {
  const calculado = calcularProjetoProgresso(itens);
  const considerados = itens.filter((item) => item.status !== ProjetoItemStatus.CANCELADO);
  const avisos: string[] = [];
  if (calculado.usaEstimativas) avisos.push(...avisoItensSemEstimativa(considerados));
  if (!projeto.inicioPrevistoEm || !projeto.fimPrevistoEm) {
    avisos.push('O projeto nao possui periodo planejado completo para calcular o progresso esperado.');
  }
  const contar = (status: ProjetoItemStatus) =>
    itens.filter((item) => item.status === status).length;

  return {
    ...base(agora, 'Backlog do projeto', ['arquivadoEm=null']),
    avisos,
    percentual: calculado.percentual,
    esperadoPercentual: calcularProgressoEsperado(
      projeto.inicioPrevistoEm,
      projeto.fimPrevistoEm,
      hojeOperacional
    ),
    usaEstimativas: calculado.usaEstimativas,
    itensAbertos: contar(ProjetoItemStatus.ABERTO),
    itensEmAndamento: contar(ProjetoItemStatus.EM_ANDAMENTO),
    itensConcluidos: contar(ProjetoItemStatus.CONCLUIDO),
    itensCancelados: contar(ProjetoItemStatus.CANCELADO)
  };
}

function indicadorPrazos(
  projeto: ProjetoRecord,
  itens: ProjetoPainelItemRecord[],
  agora: Date,
  hojeOperacional: string
): ProjetoIndicadorPrazosType {
  const pendentes = itens.filter((item) =>
    ![ProjetoItemStatus.CONCLUIDO, ProjetoItemStatus.CANCELADO].includes(
      item.status as ProjetoItemStatus
    )
  );
  const itensSemFimPrevisto = pendentes.filter((item) => !item.fimPrevistoEm).length;
  return {
    ...base(agora, 'Cronograma do projeto', ['arquivadoEm=null']),
    avisos: itensSemFimPrevisto ? [`${itensSemFimPrevisto} item(ns) sem data de fim.`] : [],
    diasAteFim: diasAteData(projeto.fimPrevistoEm, hojeOperacional),
    itensAtrasados: pendentes.filter((item) =>
      estaVencidoNoDiaOperacional(item.fimPrevistoEm, hojeOperacional)
    ).length,
    itensSemFimPrevisto
  };
}

function indicadorSprint(
  projeto: ProjetoRecord,
  sprint: any | null,
  agora: Date,
  hojeOperacional: string
): ProjetoIndicadorSprintType {
  if (!sprint) {
    return {
      ...base(agora, 'Sprints do projeto', ['status=ATIVA']),
      avisos: projeto.metodologia === 'SCRUM'
        ? ['O projeto Scrum nao possui sprint ativa.']
        : [],
      nome: null,
      diasRestantes: null,
      progressoPercentual: 0,
      itensAdicionadosAposInicio: 0,
      itensRetiradosAposInicio: 0
    };
  }
  const atuais = (sprint.itens ?? []).filter((vinculo: any) => !vinculo.retiradoEm);
  const progresso = calcularProjetoProgresso(atuais.map((vinculo: any) => vinculo.item));
  return {
    ...base(agora, 'Sprints do projeto', ['status=ATIVA']),
    nome: sprint.nome,
    diasRestantes: diasAteData(sprint.fimPrevistoEm, hojeOperacional) ?? 0,
    progressoPercentual: progresso.percentual,
    itensAdicionadosAposInicio:
      sprint.itensAdicionadosAposInicio ??
      (sprint.itens ?? []).filter((vinculo: any) => !vinculo.escopoInicial).length,
    itensRetiradosAposInicio:
      sprint.itensRetiradosAposInicio ??
      (sprint.itens ?? []).filter((vinculo: any) => !!vinculo.retiradoEm).length
  };
}

function indicadorBloqueios(
  itens: ProjetoPainelItemRecord[],
  dependencias: any[],
  agora: Date
): ProjetoIndicadorBloqueiosType {
  const ativas = dependencias.filter(
    (item) => !item.bloqueador.arquivadoEm && !item.bloqueado.arquivadoEm
  );
  const bloqueados = new Set(
    ativas
      .filter((item) =>
        item.bloqueado.status !== ProjetoItemStatus.CONCLUIDO &&
        item.bloqueado.status !== ProjetoItemStatus.CANCELADO &&
        item.bloqueador.status !== ProjetoItemStatus.CONCLUIDO
      )
      .map((item) => item.bloqueado.id)
  );
  const itensComDatasInvalidas = itens.filter((item) =>
    item.inicioPrevistoEm && item.fimPrevistoEm &&
    item.inicioPrevistoEm > item.fimPrevistoEm
  ).length;
  const conflitosEntreDependencias = ativas.filter((item) =>
    item.bloqueador.fimPrevistoEm && item.bloqueado.inicioPrevistoEm &&
    item.bloqueador.fimPrevistoEm > item.bloqueado.inicioPrevistoEm
  ).length;
  return {
    ...base(agora, 'Cronograma do projeto', ['dependencia.arquivadoEm=null']),
    itensBloqueados: bloqueados.size,
    inconsistenciasDeDatas: itensComDatasInvalidas + conflitosEntreDependencias
  };
}

function indicadorMarcosEntregas(
  marcos: any[],
  entregas: any[],
  agora: Date,
  hojeOperacional: string
): ProjetoIndicadorMarcosEntregasType {
  const itens = [
    ...marcos.map((marco) => ({
      id: marco.id,
      tipo: 'MARCO',
      nome: marco.nome,
      status: marco.status,
      dataPrevistaEm: marco.dataPrevistaEm,
      terminal: [ProjetoMarcoStatus.ATINGIDO, ProjetoMarcoStatus.CANCELADO].includes(marco.status),
      progressoPercentual: calcularProjetoProgresso(
        marco.itens.map((vinculo: any) => vinculo.item)
      ).percentual
    })),
    ...entregas.map((entrega) => ({
      id: entrega.id,
      tipo: 'ENTREGA',
      nome: entrega.nome,
      status: entrega.status,
      dataPrevistaEm: entrega.fimPrevistoEm,
      terminal: [ProjetoEntregaStatus.CONCLUIDA, ProjetoEntregaStatus.CANCELADA].includes(entrega.status),
      progressoPercentual: calcularProjetoProgresso(
        entrega.itens.map((vinculo: any) => vinculo.item)
      ).percentual
    }))
  ].map((item) => ({
    ...item,
    atrasado: !item.terminal && estaVencidoNoDiaOperacional(item.dataPrevistaEm, hojeOperacional)
  }));
  const proximos = itens
    .filter((item) => !item.terminal)
    .sort((a, b) => a.dataPrevistaEm.getTime() - b.dataPrevistaEm.getTime())
    .slice(0, 3)
    .map(({ terminal: _terminal, ...item }) => item);
  return {
    ...base(agora, 'Marcos e entregas do projeto', ['arquivadoEm=null']),
    avisos: [
      ...(marcos.some((item) => !item.itens.length)
        ? [`${marcos.filter((item) => !item.itens.length).length} marco(s) sem itens vinculados.`]
        : []),
      ...(entregas.some((item) => !item.itens.length)
        ? [`${entregas.filter((item) => !item.itens.length).length} entrega(s) sem itens vinculados.`]
        : [])
    ],
    proximos,
    atrasados: itens.filter((item) => item.atrasado).length
  };
}

function minutos(grupos: any[], status: ProjetoApontamentoStatus): number {
  return grupos.find((grupo) => grupo.status === status)?._sum?.minutos ?? 0;
}

function avisoItensSemEstimativa(itens: ProjetoPainelItemRecord[]): string[] {
  const considerados = itens.filter((item) => item.status !== ProjetoItemStatus.CANCELADO);
  const semEstimativa = considerados.filter((item) => !item.estimativaMinutos).length;
  return semEstimativa ? [`${semEstimativa} item(ns) sem estimativa.`] : [];
}

function base(calculadoEm: Date, tela: string, filtros: string[]) {
  return { calculadoEm, avisos: [], origem: { tela, filtros } };
}

export function percentualConsumido(
  totalPlanejado: Prisma.Decimal.Value,
  totalRealizado: Prisma.Decimal.Value
): number | null {
  const planejado = new Prisma.Decimal(totalPlanejado);
  if (planejado.isZero()) return null;
  return Number(new Prisma.Decimal(totalRealizado).div(planejado).mul(100).toFixed(2));
}

export function statusDoOrcamento(
  totalPlanejado: Prisma.Decimal.Value,
  totalRealizado: Prisma.Decimal.Value
): string {
  const planejado = new Prisma.Decimal(totalPlanejado);
  const realizado = new Prisma.Decimal(totalRealizado);
  if (planejado.isZero()) return realizado.isZero() ? 'SEM_BASE' : 'ACIMA_DO_PLANEJADO';
  if (realizado.greaterThan(planejado)) return 'ACIMA_DO_PLANEJADO';
  if (realizado.equals(planejado)) return 'NO_LIMITE';
  return 'DENTRO_DO_PLANEJADO';
}

export function nomeDoUsuario(usuario?: {
  nome?: string | null;
  login?: string | null;
  email?: string | null;
} | null): string | null {
  return usuario?.nome || usuario?.login || usuario?.email || null;
}
