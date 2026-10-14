import { BadRequestException } from '@nestjs/common';
import {
  assertLimiteDiarioApontamentos,
  assertMinutosApontamento,
  normalizeDescricaoApontamento,
  normalizeMotivoApontamento
} from './projeto-apontamento-limite.policy';

describe('ProjetoApontamentoLimitePolicy', () => {
  it.each([1, 1439, 1440])('aceita %i minutos', (minutos) => {
    expect(assertMinutosApontamento(minutos)).toBe(minutos);
  });

  it.each([0, 1441, -30, 1.5, Number.NaN])('rejeita %s minutos', (minutos) => {
    expect(() => assertMinutosApontamento(minutos)).toThrow(
      new BadRequestException('A duração do apontamento deve ser um número inteiro de minutos entre 1 e 1.440.')
    );
  });

  it('aceita completar exatamente 24 horas no dia', () => {
    expect(() => assertLimiteDiarioApontamentos([{ id: 'a', minutos: 1439 }], { minutos: 1 })).not.toThrow();
    expect(() => assertLimiteDiarioApontamentos([], { minutos: 1440 })).not.toThrow();
  });

  it('bloqueia o minuto que passa de 24 horas e informa quanto ainda cabe', () => {
    expect(() => assertLimiteDiarioApontamentos([{ id: 'a', minutos: 1439 }], { minutos: 2 })).toThrow(
      new BadRequestException('O dia já tem 23:59 lançadas e só cabem mais 00:01.')
    );
    expect(() => assertLimiteDiarioApontamentos([{ id: 'a', minutos: 600 }, { id: 'b', minutos: 840 }], { minutos: 1 })).toThrow(
      'O dia já tem 24:00 lançadas e só cabem mais 00:00.'
    );
  });

  it('desconsidera o proprio apontamento em edicao e os descartados', () => {
    expect(() => assertLimiteDiarioApontamentos([{ id: 'a', minutos: 1000 }], { id: 'a', minutos: 1440 })).not.toThrow();
    expect(() =>
      assertLimiteDiarioApontamentos([{ id: 'b', minutos: 1440, arquivadoEm: new Date('2026-10-10T12:00:00Z') }], { minutos: 60 })
    ).not.toThrow();
  });

  it('exige descricao e aceita ate 1.000 caracteres sem os espacos das pontas', () => {
    expect(normalizeDescricaoApontamento('  Reuniao de planejamento  ')).toBe('Reuniao de planejamento');
    expect(normalizeDescricaoApontamento(` ${'a'.repeat(1000)} `)).toHaveLength(1000);
    expect(() => normalizeDescricaoApontamento('   ')).toThrow(new BadRequestException('Informe a descrição do apontamento.'));
    expect(() => normalizeDescricaoApontamento('a'.repeat(1001))).toThrow(
      new BadRequestException('A descrição do apontamento pode ter até 1.000 caracteres.')
    );
  });

  it('exige motivo de 5 a 500 caracteres sem os espacos das pontas', () => {
    const recusa = new BadRequestException('Informe um motivo com 5 a 500 caracteres.');

    expect(normalizeMotivoApontamento('  Falta a entrega revisada.  ')).toBe('Falta a entrega revisada.');
    expect(normalizeMotivoApontamento('abcde')).toBe('abcde');
    expect(normalizeMotivoApontamento(` ${'a'.repeat(500)} `)).toHaveLength(500);
    expect(() => normalizeMotivoApontamento('  abcd  ')).toThrow(recusa);
    expect(() => normalizeMotivoApontamento('a'.repeat(501))).toThrow(recusa);
    expect(() => normalizeMotivoApontamento(undefined as unknown as string)).toThrow(recusa);
  });
});
