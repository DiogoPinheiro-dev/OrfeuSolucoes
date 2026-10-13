import { BadRequestException } from '@nestjs/common';
import { calcularValorPorMinutos, normalizeProjetoDinheiro } from './projeto-dinheiro.policy';

describe('ProjetoDinheiroPolicy', () => {
  it('arredonda valores monetarios com meio para cima', () => {
    expect(normalizeProjetoDinheiro('10')).toBe('10.00');
    expect(normalizeProjetoDinheiro('10.005')).toBe('10.01');
    expect(normalizeProjetoDinheiro('10.004')).toBe('10.00');
    expect(normalizeProjetoDinheiro('97.5', 4)).toBe('97.5000');
    expect(normalizeProjetoDinheiro('133.33335', 4)).toBe('133.3334');
  });

  it.each(['-0.01', 'abc', ''])('rejeita o valor %p', (valor) => {
    expect(() => normalizeProjetoDinheiro(valor)).toThrow(new BadRequestException('Valor monetario invalido.'));
  });

  it.each([
    [90, '120.0000', '180.00'],
    [50, '97.5000', '81.25'],
    [37, '133.3333', '82.22'],
    [1, '0.3000', '0.01'],
    [1, '0.2999', '0.00']
  ])('calcula %i minutos a %s por hora como %s', (minutos, taxaHora, esperado) => {
    expect(calcularValorPorMinutos(minutos, taxaHora)).toBe(esperado);
  });
});
