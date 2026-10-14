import { BadRequestException, ForbiddenException, HttpException } from '@nestjs/common';
import { ProjetoSituacao } from '../types/projeto.types';
import { ProjetoApontamentoOperacao, ProjetoApontamentoStatus } from '../types/projeto-apontamento.types';
import { formatCompetencia } from './projeto-input.policy';

const { RASCUNHO, ENVIADO, APROVADO, REJEITADO } = ProjetoApontamentoStatus;

export const PROJETO_APONTAMENTO_CICLOS_ELEGIVEIS: readonly ProjetoSituacao[] = [
  ProjetoSituacao.RASCUNHO,
  ProjetoSituacao.PLANEJADO,
  ProjetoSituacao.EM_ANDAMENTO
];

type RegraOperacao = {
  verbo: string;
  origem: readonly (ProjetoApontamentoStatus | null)[];
  destino: ProjetoApontamentoStatus | 'MANTIDO' | 'REMOVIDO';
  ator: 'AUTOR' | 'OUTRO' | 'QUALQUER';
  exigeCicloElegivel: boolean;
  bloqueadaPorCompetenciaFechada: boolean;
};

const REGRAS: Record<ProjetoApontamentoOperacao, RegraOperacao> = {
  [ProjetoApontamentoOperacao.SALVAR]: {
    verbo: 'salvar', origem: [null, RASCUNHO, REJEITADO], destino: 'MANTIDO',
    ator: 'AUTOR', exigeCicloElegivel: true, bloqueadaPorCompetenciaFechada: true
  },
  [ProjetoApontamentoOperacao.EXCLUIR]: {
    verbo: 'excluir', origem: [RASCUNHO], destino: 'REMOVIDO',
    ator: 'AUTOR', exigeCicloElegivel: false, bloqueadaPorCompetenciaFechada: true
  },
  [ProjetoApontamentoOperacao.DESCARTAR]: {
    verbo: 'descartar', origem: [REJEITADO], destino: REJEITADO,
    ator: 'AUTOR', exigeCicloElegivel: false, bloqueadaPorCompetenciaFechada: true
  },
  [ProjetoApontamentoOperacao.ENVIAR]: {
    verbo: 'enviar', origem: [RASCUNHO, REJEITADO], destino: ENVIADO,
    ator: 'AUTOR', exigeCicloElegivel: true, bloqueadaPorCompetenciaFechada: true
  },
  [ProjetoApontamentoOperacao.RECOLHER]: {
    verbo: 'recolher', origem: [ENVIADO], destino: RASCUNHO,
    ator: 'AUTOR', exigeCicloElegivel: true, bloqueadaPorCompetenciaFechada: true
  },
  [ProjetoApontamentoOperacao.APROVAR]: {
    verbo: 'aprovar', origem: [ENVIADO], destino: APROVADO,
    ator: 'OUTRO', exigeCicloElegivel: false, bloqueadaPorCompetenciaFechada: true
  },
  [ProjetoApontamentoOperacao.REJEITAR]: {
    verbo: 'rejeitar', origem: [ENVIADO], destino: REJEITADO,
    ator: 'OUTRO', exigeCicloElegivel: false, bloqueadaPorCompetenciaFechada: false
  },
  [ProjetoApontamentoOperacao.REABRIR]: {
    verbo: 'reabrir', origem: [APROVADO], destino: RASCUNHO,
    ator: 'QUALQUER', exigeCicloElegivel: true, bloqueadaPorCompetenciaFechada: true
  }
};

const PROJETO_ARQUIVADO = 'O projeto está arquivado, e o apontamento fica somente para consulta.';

const DESCRICAO_STATUS: Record<ProjetoApontamentoStatus, string> = {
  [RASCUNHO]: 'em rascunho',
  [ENVIADO]: 'enviado',
  [APROVADO]: 'aprovado',
  [REJEITADO]: 'rejeitado'
};

export type ProjetoApontamentoTransicao = {
  operacao: ProjetoApontamentoOperacao;
  status: ProjetoApontamentoStatus | null;
  descartado: boolean;
  atorEhAutor: boolean;
  situacaoProjeto: ProjetoSituacao;
  competenciaFechada: boolean;
  /** Mês do apontamento (YYYY-MM); quando informado, a recusa por competência fechada nomeia o mês. */
  competencia?: string;
};

/** Só a exclusão remove o apontamento; as demais operações terminam numa situação. */
export type ProjetoApontamentoDestino<O extends ProjetoApontamentoOperacao> =
  O extends ProjetoApontamentoOperacao.EXCLUIR ? null : ProjetoApontamentoStatus;

/**
 * Devolve a situação resultante, ou `null` quando o rascunho é excluído. Permissões e projeto arquivado
 * continuam com a autorização do projeto; esta policy cuida do estado, do ator, do ciclo e da competência.
 */
export function resolveProjetoApontamentoTransicao<O extends ProjetoApontamentoOperacao>(
  transicao: ProjetoApontamentoTransicao & { operacao: O }
): ProjetoApontamentoDestino<O> {
  const avaliacao = avaliarTransicao(transicao);

  if (!avaliacao.permitida) {
    throw avaliacao.recusa;
  }

  return avaliacao.destino as ProjetoApontamentoDestino<O>;
}

export function permiteProjetoApontamentoTransicao(transicao: ProjetoApontamentoTransicao): boolean {
  return avaliarTransicao(transicao).permitida;
}

export type ProjetoApontamentoSituacaoDoAutor = {
  status: ProjetoApontamentoStatus;
  competencia: string;
  competenciaFechada: boolean;
  situacaoProjeto: ProjetoSituacao;
  projetoArquivado: boolean;
  lancaNoProjeto: boolean;
  podeAlterar: boolean;
  podeExcluir: boolean;
};

export type ProjetoApontamentoAcoesDoAutor = {
  podeAlterar: boolean;
  podeExcluir: boolean;
  podeDescartar: boolean;
  podeEnviar: boolean;
  podeRecolher: boolean;
  bloqueio: string | null;
};

const OPERACOES_DO_AUTOR = [
  ProjetoApontamentoOperacao.SALVAR,
  ProjetoApontamentoOperacao.EXCLUIR,
  ProjetoApontamentoOperacao.DESCARTAR,
  ProjetoApontamentoOperacao.ENVIAR,
  ProjetoApontamentoOperacao.RECOLHER
];

/**
 * O que o autor ainda pode fazer com um apontamento não descartado, pela mesma tabela de transições, e o
 * motivo de ele ficar somente para consulta quando a causa não é a própria situação do apontamento.
 */
export function resolveProjetoApontamentoAcoesDoAutor(situacao: ProjetoApontamentoSituacaoDoAutor): ProjetoApontamentoAcoesDoAutor {
  const somenteConsulta = situacao.projetoArquivado || !situacao.lancaNoProjeto;
  const pode = (operacao: ProjetoApontamentoOperacao, acaoPermitida: boolean): boolean =>
    acaoPermitida && !somenteConsulta && permiteProjetoApontamentoTransicao({
      operacao,
      status: situacao.status,
      descartado: false,
      atorEhAutor: true,
      situacaoProjeto: situacao.situacaoProjeto,
      competenciaFechada: situacao.competenciaFechada
    });

  return {
    podeAlterar: pode(ProjetoApontamentoOperacao.SALVAR, situacao.podeAlterar),
    podeExcluir: pode(ProjetoApontamentoOperacao.EXCLUIR, situacao.podeExcluir),
    podeDescartar: pode(ProjetoApontamentoOperacao.DESCARTAR, situacao.podeExcluir),
    podeEnviar: pode(ProjetoApontamentoOperacao.ENVIAR, situacao.podeAlterar),
    podeRecolher: pode(ProjetoApontamentoOperacao.RECOLHER, situacao.podeAlterar),
    bloqueio: motivoDeConsulta(situacao)
  };
}

export type ProjetoApontamentoSituacaoDoGestor = {
  status: ProjetoApontamentoStatus;
  competencia: string;
  competenciaFechada: boolean;
  situacaoProjeto: ProjetoSituacao;
  projetoArquivado: boolean;
  atorEhAutor: boolean;
  podeAprovarHoras: boolean;
  podeReabrirHoras: boolean;
};

export type ProjetoApontamentoAcoesDoGestor = {
  podeAprovar: boolean;
  podeRejeitar: boolean;
  podeReabrir: boolean;
  bloqueio: string | null;
};

/**
 * O que quem gerencia as horas pode decidir sobre um apontamento do próprio escopo, pela mesma tabela de
 * transições, e o motivo quando nenhuma das decisões que a pessoa teria para aquela situação é possível.
 */
export function resolveProjetoApontamentoAcoesDoGestor(situacao: ProjetoApontamentoSituacaoDoGestor): ProjetoApontamentoAcoesDoGestor {
  if (situacao.projetoArquivado) {
    return { podeAprovar: false, podeRejeitar: false, podeReabrir: false, bloqueio: PROJETO_ARQUIVADO };
  }

  const avaliar = (operacao: ProjetoApontamentoOperacao, acaoPermitida: boolean): AvaliacaoDaTransicao | null =>
    acaoPermitida && REGRAS[operacao].origem.includes(situacao.status)
      ? avaliarTransicao({
          operacao,
          status: situacao.status,
          descartado: false,
          atorEhAutor: situacao.atorEhAutor,
          situacaoProjeto: situacao.situacaoProjeto,
          competenciaFechada: situacao.competenciaFechada,
          competencia: situacao.competencia
        })
      : null;
  const permitida = (avaliacao: AvaliacaoDaTransicao | null): boolean => avaliacao?.permitida === true;
  const aprovar = avaliar(ProjetoApontamentoOperacao.APROVAR, situacao.podeAprovarHoras);
  const rejeitar = avaliar(ProjetoApontamentoOperacao.REJEITAR, situacao.podeAprovarHoras);
  const reabrir = avaliar(ProjetoApontamentoOperacao.REABRIR, situacao.podeReabrirHoras);
  const disponiveis = [aprovar, rejeitar, reabrir].filter((avaliacao): avaliacao is AvaliacaoDaTransicao => avaliacao !== null);

  return {
    podeAprovar: permitida(aprovar),
    podeRejeitar: permitida(rejeitar),
    podeReabrir: permitida(reabrir),
    bloqueio: disponiveis.length > 0 && !disponiveis.some(permitida) ? primeiraRecusa(disponiveis) : null
  };
}

type AvaliacaoDaTransicao =
  | { permitida: true; destino: ProjetoApontamentoStatus | null }
  | { permitida: false; recusa: HttpException };

function avaliarTransicao(transicao: ProjetoApontamentoTransicao): AvaliacaoDaTransicao {
  const { operacao, status, descartado, atorEhAutor, situacaoProjeto, competenciaFechada } = transicao;
  const regra = REGRAS[operacao];
  const recusar = (recusa: HttpException): AvaliacaoDaTransicao => ({ permitida: false, recusa });

  if (descartado) {
    return recusar(new BadRequestException('O apontamento descartado está disponível somente para consulta.'));
  }

  if (!regra.origem.includes(status)) {
    const situacao = status ? DESCRICAO_STATUS[status] : 'que ainda não foi salvo';
    return recusar(new BadRequestException(`Não é possível ${regra.verbo} um apontamento ${situacao}.`));
  }

  if (regra.ator === 'AUTOR' && !atorEhAutor) {
    return recusar(new ForbiddenException(`Somente o autor pode ${regra.verbo} o apontamento.`));
  }

  if (regra.ator === 'OUTRO' && atorEhAutor) {
    return recusar(new ForbiddenException(`Você não pode ${regra.verbo} os próprios apontamentos.`));
  }

  if (regra.exigeCicloElegivel && !PROJETO_APONTAMENTO_CICLOS_ELEGIVEIS.includes(situacaoProjeto)) {
    return recusar(new BadRequestException(
      `Para ${regra.verbo} o apontamento, o projeto precisa estar em Rascunho, Planejado ou Em andamento.`
    ));
  }

  if (regra.bloqueadaPorCompetenciaFechada && competenciaFechada) {
    return recusar(new BadRequestException(transicao.competencia
      ? descreverCompetenciaFechada(transicao.competencia)
      : 'A competência deste apontamento está fechada.'));
  }

  if (regra.destino === 'REMOVIDO') return { permitida: true, destino: null };
  if (regra.destino === 'MANTIDO') return { permitida: true, destino: status ?? RASCUNHO };
  return { permitida: true, destino: regra.destino };
}

function motivoDeConsulta(situacao: ProjetoApontamentoSituacaoDoAutor): string | null {
  if (situacao.projetoArquivado) {
    return PROJETO_ARQUIVADO;
  }

  if (!situacao.lancaNoProjeto) {
    return 'Você não participa mais deste projeto como responsável ou membro, e o apontamento fica somente para consulta.';
  }

  if (situacao.competenciaFechada) {
    return descreverCompetenciaFechada(situacao.competencia);
  }

  const dependeDoCiclo = OPERACOES_DO_AUTOR.some((operacao) =>
    REGRAS[operacao].exigeCicloElegivel && REGRAS[operacao].origem.includes(situacao.status)
  );
  if (dependeDoCiclo && !PROJETO_APONTAMENTO_CICLOS_ELEGIVEIS.includes(situacao.situacaoProjeto)) {
    return 'O projeto não está em Rascunho, Planejado ou Em andamento, então o apontamento não pode ser alterado, enviado nem recolhido.';
  }

  return null;
}

function primeiraRecusa(avaliacoes: readonly AvaliacaoDaTransicao[]): string | null {
  return avaliacoes.flatMap((avaliacao) => (avaliacao.permitida ? [] : [avaliacao.recusa.message]))[0] ?? null;
}

function descreverCompetenciaFechada(competencia: string): string {
  return `A competência ${formatCompetencia(competencia)} deste projeto está fechada.`;
}
