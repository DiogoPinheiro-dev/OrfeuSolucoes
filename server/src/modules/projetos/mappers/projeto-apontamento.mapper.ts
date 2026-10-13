import {
  ProjetoApontamentoAcoesType,
  ProjetoApontamentoTotalDiaType,
  ProjetoApontamentoTotalProjetoType,
  ProjetoApontamentoType
} from '../dto/projeto-apontamento.type';
import { formatCalendarDate } from '../policies/projeto-input.policy';
import { ProjetoApontamentoDetalheRecord, ProjetoApontamentoStatus } from '../types/projeto-apontamento.types';
import { ProjetoSituacao } from '../types/projeto.types';
import { toProjetoUsuarioType } from './projeto.mapper';

export type ProjetoApontamentoDoPeriodo = {
  dataTrabalho: Date;
  minutos: number;
  projeto: { id: string; chave: string; nome: string };
};

export type ProjetoApontamentoTotais = {
  totalMinutos: number;
  totaisPorDia: ProjetoApontamentoTotalDiaType[];
  totaisPorProjeto: ProjetoApontamentoTotalProjetoType[];
};

export function toProjetoApontamentoType(
  apontamento: ProjetoApontamentoDetalheRecord,
  competencia: string,
  acoes: ProjetoApontamentoAcoesType
): ProjetoApontamentoType {
  return {
    id: apontamento.id,
    projetoId: apontamento.projetoId,
    projeto: {
      id: apontamento.projeto.id,
      chave: apontamento.projeto.chave,
      nome: apontamento.projeto.nome,
      situacao: apontamento.projeto.situacao as ProjetoSituacao,
      arquivadoEm: apontamento.projeto.arquivadoEm ?? null
    },
    usuarioId: apontamento.usuarioId,
    itemId: apontamento.itemId ?? null,
    item: apontamento.item
      ? { id: apontamento.item.id, chave: apontamento.item.chave, titulo: apontamento.item.titulo }
      : null,
    dataTrabalho: formatCalendarDate(apontamento.dataTrabalho),
    competencia,
    minutos: apontamento.minutos,
    descricao: apontamento.descricao,
    faturavel: apontamento.faturavel,
    status: apontamento.status as ProjetoApontamentoStatus,
    enviadoEm: apontamento.enviadoEm ?? null,
    decididoEm: apontamento.decididoEm ?? null,
    decididoPor: apontamento.decididoPor ? toProjetoUsuarioType(apontamento.decididoPor) : null,
    motivo: apontamento.motivo ?? null,
    versao: apontamento.versao,
    criadoEm: apontamento.criadoEm,
    atualizadoEm: apontamento.atualizadoEm,
    acoes
  };
}

export function totalizarApontamentosDoPeriodo(apontamentos: ProjetoApontamentoDoPeriodo[]): ProjetoApontamentoTotais {
  const porDia = new Map<string, number>();
  const porProjeto = new Map<string, ProjetoApontamentoTotalProjetoType>();

  for (const apontamento of apontamentos) {
    const dia = formatCalendarDate(apontamento.dataTrabalho);
    porDia.set(dia, (porDia.get(dia) ?? 0) + apontamento.minutos);

    const { id, chave, nome } = apontamento.projeto;
    const totalDoProjeto = porProjeto.get(id) ?? { projetoId: id, chave, nome, minutos: 0 };
    totalDoProjeto.minutos += apontamento.minutos;
    porProjeto.set(id, totalDoProjeto);
  }

  return {
    totalMinutos: apontamentos.reduce((total, apontamento) => total + apontamento.minutos, 0),
    totaisPorDia: [...porDia]
      .sort(([diaA], [diaB]) => diaA.localeCompare(diaB))
      .map(([data, minutos]) => ({ data, minutos })),
    totaisPorProjeto: [...porProjeto.values()]
      .sort((projetoA, projetoB) => projetoA.nome.localeCompare(projetoB.nome) || projetoA.chave.localeCompare(projetoB.chave))
  };
}
