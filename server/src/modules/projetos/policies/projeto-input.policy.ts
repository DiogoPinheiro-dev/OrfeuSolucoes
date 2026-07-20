import { BadRequestException } from '@nestjs/common';
import { ProjetoMetodologia, ProjetoSaude, ProjetoSituacao } from '../types/projeto.types';

const METODOLOGIAS = new Set(Object.values(ProjetoMetodologia));
const SITUACOES_INICIAIS = new Set([ProjetoSituacao.RASCUNHO, ProjetoSituacao.PLANEJADO]);
const SAUDES = new Set(Object.values(ProjetoSaude));

export function normalizeProjetoKey(chave: string): string {
  const normalized = (chave ?? '').trim().toUpperCase();

  if (!/^[A-Z][A-Z0-9]{1,9}$/.test(normalized)) {
    throw new BadRequestException('A chave deve ter de 2 a 10 caracteres, iniciar por letra e conter apenas letras maiusculas e numeros.');
  }

  return normalized;
}

export function normalizeRequiredName(nome: string): string {
  const normalized = (nome ?? '').trim();

  if (!normalized) {
    throw new BadRequestException('O nome do projeto e obrigatorio.');
  }

  return normalized;
}

export function validateProjetoDefaults(
  metodologia: ProjetoMetodologia,
  situacao = ProjetoSituacao.RASCUNHO,
  saude = ProjetoSaude.EM_DIA
): void {
  if (!METODOLOGIAS.has(metodologia)) {
    throw new BadRequestException('Metodologia de projeto invalida.');
  }

  if (!SITUACOES_INICIAIS.has(situacao)) {
    throw new BadRequestException('A situacao inicial deve ser RASCUNHO ou PLANEJADO.');
  }

  if (!SAUDES.has(saude)) {
    throw new BadRequestException('Saude de projeto invalida.');
  }
}

export function validateProjetoMetodologia(metodologia: ProjetoMetodologia): void {
  if (!METODOLOGIAS.has(metodologia)) {
    throw new BadRequestException('Metodologia de projeto invalida.');
  }
}
export function normalizeCalendarDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('As datas do projeto devem usar o formato YYYY-MM-DD.');
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException('Data de projeto invalida.');
  }

  return date;
}

export function validatePlannedDates(inicio?: Date | null, fim?: Date | null): void {
  if (inicio && fim && inicio > fim) {
    throw new BadRequestException('A data prevista de inicio nao pode ser posterior a data prevista de termino.');
  }
}
