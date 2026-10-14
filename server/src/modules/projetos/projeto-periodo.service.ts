import { BadRequestException, Injectable } from '@nestjs/common';
import { PROJETOS_TIMEZONE_PADRAO } from './constants/projeto-operacional.constants';
import { formatCalendarDate, normalizeCalendarDate } from './policies/projeto-input.policy';

export const PROJETO_PAGINACAO = {
  paginaInicial: 1,
  limitePadrao: 20,
  limiteMaximo: 100
} as const;

const COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;
const PERIODO_DE_CONSULTA_MAXIMO_EM_DIAS = 366;
const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ProjetoPeriodoService {
  private readonly timeZone = process.env.PROJETOS_TIMEZONE?.trim() || PROJETOS_TIMEZONE_PADRAO;

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

  /** Dia de hoje (YYYY-MM-DD) no fuso operacional dos projetos, não no fuso do servidor. */
  hojeOperacional(agora: Date = new Date()): string {
    const partes = partesNoFuso(agora, this.timeZone);
    return `${partes.ano}-${doisDigitos(partes.mes)}-${doisDigitos(partes.dia)}`;
  }

  assertDataTrabalho(valor: string, agora: Date = new Date()): Date {
    const data = normalizeCalendarDate(valor);

    if (!data) {
      throw new BadRequestException('Informe a data do apontamento.');
    }

    if (valor > this.hojeOperacional(agora)) {
      throw new BadRequestException('A data do apontamento não pode ser posterior a hoje.');
    }

    return data;
  }

  /** Instante exclusivo em que o dia informado termina no fuso operacional: a meia-noite seguinte. */
  fimDoDiaOperacional(data: string): Date {
    const dia = normalizeCalendarDate(data);

    if (!dia) {
      throw new BadRequestException('Informe a data do apontamento.');
    }

    const meiaNoiteSeguinteUtc = Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate() + 1);
    const palpite = meiaNoiteSeguinteUtc - deslocamentoDoFuso(new Date(meiaNoiteSeguinteUtc), this.timeZone);

    return new Date(meiaNoiteSeguinteUtc - deslocamentoDoFuso(new Date(palpite), this.timeZone));
  }

  normalizeCompetencia(valor: string): string {
    const competencia = (valor ?? '').trim();

    if (!COMPETENCIA.test(competencia)) {
      throw new BadRequestException('A competência deve usar o formato YYYY-MM.');
    }

    return competencia;
  }

  competenciaDaData(data: Date): string {
    return formatCalendarDate(data).slice(0, 7);
  }

  /** Competência do dia de hoje no fuso operacional. */
  competenciaAtual(agora: Date = new Date()): string {
    return this.hojeOperacional(agora).slice(0, 7);
  }

  /** Primeiro dia da competência e primeiro dia da seguinte, para filtrar por faixa de datas. */
  limitesDaCompetencia(competencia: string): { inicio: Date; fimExclusivo: Date } {
    const [ano, mes] = this.normalizeCompetencia(competencia).split('-').map(Number) as [number, number];

    return { inicio: new Date(Date.UTC(ano, mes - 1, 1)), fimExclusivo: new Date(Date.UTC(ano, mes, 1)) };
  }

  /** Competências (YYYY-MM) alcançadas pelo período, em ordem. */
  competenciasDoPeriodo(inicio: Date, fim: Date): string[] {
    const competencias: string[] = [];
    let mes = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), 1));

    while (mes.getTime() <= fim.getTime()) {
      competencias.push(this.competenciaDaData(mes));
      mes = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + 1, 1));
    }

    return competencias;
  }

  /** Período de uma consulta de horas: os dois dias obrigatórios, em ordem e com no máximo 366 dias. */
  periodoDeConsulta(inicioInformado: string, fimInformado: string): { inicio: Date; fim: Date } {
    const inicio = normalizeCalendarDate(inicioInformado);
    const fim = normalizeCalendarDate(fimInformado);

    if (!inicio || !fim) {
      throw new BadRequestException('Informe o primeiro e o último dia do período.');
    }

    this.assertPeriodoValido(inicio, fim);
    if ((fim.getTime() - inicio.getTime()) / UM_DIA_EM_MS + 1 > PERIODO_DE_CONSULTA_MAXIMO_EM_DIAS) {
      throw new BadRequestException(`Consulte no máximo ${PERIODO_DE_CONSULTA_MAXIMO_EM_DIAS} dias por vez.`);
    }

    return { inicio, fim };
  }
}

type PartesDaData = { ano: number; mes: number; dia: number; hora: number; minuto: number; segundo: number };

function partesNoFuso(instante: Date, timeZone: string): PartesDaData {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(instante);
  const valor = (tipo: Intl.DateTimeFormatPartTypes): number =>
    Number(partes.find((parte) => parte.type === tipo)?.value);

  return {
    ano: valor('year'),
    mes: valor('month'),
    dia: valor('day'),
    hora: valor('hour'),
    minuto: valor('minute'),
    segundo: valor('second')
  };
}

/** Quanto o relógio do fuso está à frente do UTC no instante informado, em milissegundos. */
function deslocamentoDoFuso(instante: Date, timeZone: string): number {
  const partes = partesNoFuso(instante, timeZone);
  const relogioLocalComoUtc = Date.UTC(partes.ano, partes.mes - 1, partes.dia, partes.hora, partes.minuto, partes.segundo);

  return relogioLocalComoUtc - Math.floor(instante.getTime() / 1000) * 1000;
}

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}
