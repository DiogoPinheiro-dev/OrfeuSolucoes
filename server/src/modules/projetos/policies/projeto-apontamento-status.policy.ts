import { BadRequestException, ForbiddenException, HttpException } from '@nestjs/common';
import { ProjetoSituacao } from '../types/projeto.types';
import { ProjetoApontamentoOperacao, ProjetoApontamentoStatus } from '../types/projeto-apontamento.types';

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
    return recusar(new ForbiddenException(`Ninguém pode ${regra.verbo} o próprio apontamento.`));
  }

  if (regra.exigeCicloElegivel && !PROJETO_APONTAMENTO_CICLOS_ELEGIVEIS.includes(situacaoProjeto)) {
    return recusar(new BadRequestException(
      `Para ${regra.verbo} o apontamento, o projeto precisa estar em Rascunho, Planejado ou Em andamento.`
    ));
  }

  if (regra.bloqueadaPorCompetenciaFechada && competenciaFechada) {
    return recusar(new BadRequestException('A competência deste apontamento está fechada.'));
  }

  if (regra.destino === 'REMOVIDO') return { permitida: true, destino: null };
  if (regra.destino === 'MANTIDO') return { permitida: true, destino: status ?? RASCUNHO };
  return { permitida: true, destino: regra.destino };
}

function motivoDeConsulta(situacao: ProjetoApontamentoSituacaoDoAutor): string | null {
  if (situacao.projetoArquivado) {
    return 'O projeto está arquivado, e o apontamento fica somente para consulta.';
  }

  if (!situacao.lancaNoProjeto) {
    return 'Você não participa mais deste projeto como responsável ou membro, e o apontamento fica somente para consulta.';
  }

  if (situacao.competenciaFechada) {
    const [ano, mes] = situacao.competencia.split('-');
    return `A competência ${mes}/${ano} deste projeto está fechada.`;
  }

  const dependeDoCiclo = OPERACOES_DO_AUTOR.some((operacao) =>
    REGRAS[operacao].exigeCicloElegivel && REGRAS[operacao].origem.includes(situacao.status)
  );
  if (dependeDoCiclo && !PROJETO_APONTAMENTO_CICLOS_ELEGIVEIS.includes(situacao.situacaoProjeto)) {
    return 'O projeto não está em Rascunho, Planejado ou Em andamento, então o apontamento não pode ser alterado, enviado nem recolhido.';
  }

  return null;
}
