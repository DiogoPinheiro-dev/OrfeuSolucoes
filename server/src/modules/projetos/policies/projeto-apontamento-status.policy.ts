import { BadRequestException, ForbiddenException } from '@nestjs/common';
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

/**
 * Devolve a situação resultante, ou `null` quando o rascunho é excluído. Permissões e projeto arquivado
 * continuam com a autorização do projeto; esta policy cuida do estado, do ator, do ciclo e da competência.
 */
export function resolveProjetoApontamentoTransicao(transicao: ProjetoApontamentoTransicao): ProjetoApontamentoStatus | null {
  const { operacao, status, descartado, atorEhAutor, situacaoProjeto, competenciaFechada } = transicao;
  const regra = REGRAS[operacao];

  if (descartado) {
    throw new BadRequestException('O apontamento descartado está disponível somente para consulta.');
  }

  if (!regra.origem.includes(status)) {
    const situacao = status ? DESCRICAO_STATUS[status] : 'que ainda não foi salvo';
    throw new BadRequestException(`Não é possível ${regra.verbo} um apontamento ${situacao}.`);
  }

  if (regra.ator === 'AUTOR' && !atorEhAutor) {
    throw new ForbiddenException(`Somente o autor pode ${regra.verbo} o apontamento.`);
  }

  if (regra.ator === 'OUTRO' && atorEhAutor) {
    throw new ForbiddenException(`Ninguém pode ${regra.verbo} o próprio apontamento.`);
  }

  if (regra.exigeCicloElegivel && !PROJETO_APONTAMENTO_CICLOS_ELEGIVEIS.includes(situacaoProjeto)) {
    throw new BadRequestException(
      `Para ${regra.verbo} o apontamento, o projeto precisa estar em Rascunho, Planejado ou Em andamento.`
    );
  }

  if (regra.bloqueadaPorCompetenciaFechada && competenciaFechada) {
    throw new BadRequestException('A competência deste apontamento está fechada.');
  }

  if (regra.destino === 'REMOVIDO') return null;
  if (regra.destino === 'MANTIDO') return status ?? RASCUNHO;
  return regra.destino;
}
