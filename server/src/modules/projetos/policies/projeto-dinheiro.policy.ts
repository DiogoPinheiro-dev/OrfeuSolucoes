import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function normalizeProjetoDinheiro(valor: string, casas = 2): string {
  try {
    const decimal = new Prisma.Decimal(valor);
    if (decimal.isNegative()) throw new Error();
    return decimal.toDecimalPlaces(casas, Prisma.Decimal.ROUND_HALF_UP).toFixed(casas);
  } catch {
    throw new BadRequestException('Valor monetario invalido.');
  }
}

export function calcularValorPorMinutos(minutos: number, taxaHora: Prisma.Decimal.Value): string {
  return new Prisma.Decimal(minutos)
    .div(60)
    .mul(taxaHora)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    .toFixed(2);
}

/** Decimal gravado no formato do orçamento, com as casas informadas, ou nulo quando não há valor. */
export function formatarDecimal(valor: Prisma.Decimal.Value | null | undefined, casas: number): string | null {
  return valor === null || valor === undefined ? null : new Prisma.Decimal(valor).toFixed(casas);
}
