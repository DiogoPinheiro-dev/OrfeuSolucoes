import { BadRequestException } from '@nestjs/common';
import { ProjetoPapel, ProjetoSituacao } from '../types/projeto.types';

const TRANSITIONS: Record<ProjetoSituacao, ProjetoSituacao[]> = {
  [ProjetoSituacao.RASCUNHO]: [ProjetoSituacao.EM_ORCAMENTO, ProjetoSituacao.PLANEJADO, ProjetoSituacao.CANCELADO],
  [ProjetoSituacao.EM_ORCAMENTO]: [ProjetoSituacao.CANCELADO],
  [ProjetoSituacao.PLANEJADO]: [ProjetoSituacao.EM_ANDAMENTO, ProjetoSituacao.PAUSADO, ProjetoSituacao.CANCELADO],
  [ProjetoSituacao.EM_ANDAMENTO]: [ProjetoSituacao.PAUSADO, ProjetoSituacao.CONCLUIDO, ProjetoSituacao.CANCELADO],
  [ProjetoSituacao.PAUSADO]: [ProjetoSituacao.PLANEJADO, ProjetoSituacao.EM_ANDAMENTO, ProjetoSituacao.CANCELADO],
  [ProjetoSituacao.CONCLUIDO]: [ProjetoSituacao.PLANEJADO],
  [ProjetoSituacao.CANCELADO]: [ProjetoSituacao.EM_ORCAMENTO]
};

export function assertProjetoSituacaoTransition(
  atual: ProjetoSituacao,
  nova: ProjetoSituacao,
  papel: ProjetoPapel | null,
  systemAdmin: boolean
): void {
  if (atual === nova) {
    return;
  }

  if (atual === ProjetoSituacao.EM_ORCAMENTO && nova !== ProjetoSituacao.CANCELADO) {
    throw new BadRequestException('Aprove o orçamento em Orçamento do projeto para mover o projeto para Rascunho.');
  }

  if (!TRANSITIONS[atual]?.includes(nova)) {
    throw new BadRequestException(`Transicao de ${atual} para ${nova} nao permitida.`);
  }

  if (
    (atual === ProjetoSituacao.CONCLUIDO || atual === ProjetoSituacao.CANCELADO) &&
    (nova === ProjetoSituacao.PLANEJADO || nova === ProjetoSituacao.EM_ORCAMENTO) &&
    !systemAdmin &&
    papel !== ProjetoPapel.RESPONSAVEL
  ) {
    throw new BadRequestException('Apenas o responsavel ou administrador pode reabrir um projeto concluido ou cancelado.');
  }
}
