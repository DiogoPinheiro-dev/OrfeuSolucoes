import { BadRequestException, Injectable } from '@nestjs/common';

export const PROJETO_PAGINACAO = {
  paginaInicial: 1,
  limitePadrao: 20,
  limiteMaximo: 100
} as const;

@Injectable()
export class ProjetoPeriodoService {
  assertPeriodoValido(inicio?: Date | null, fim?: Date | null): void {
    if (inicio && fim && fim.getTime() < inicio.getTime()) {
      throw new BadRequestException('A data final nao pode ser anterior a data inicial.');
    }
  }

  assertDuracaoMinutos(valor: number): number {
    if (!Number.isSafeInteger(valor) || valor < 0) {
      throw new BadRequestException(
        'A duracao deve ser informada em minutos inteiros nao negativos.'
      );
    }

    return valor;
  }

  normalizePaginacao(
    pagina?: number,
    limite?: number
  ): { pagina: number; limite: number } {
    return {
      pagina: Math.max(
        PROJETO_PAGINACAO.paginaInicial,
        pagina ?? PROJETO_PAGINACAO.paginaInicial
      ),
      limite: Math.min(
        PROJETO_PAGINACAO.limiteMaximo,
        Math.max(1, limite ?? PROJETO_PAGINACAO.limitePadrao)
      )
    };
  }
}

