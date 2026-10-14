import { Prisma } from '@prisma/client';
import { custoDaLinha, resumirCustoDasHoras } from './projeto-apontamento-custo.mapper';

describe('resumirCustoDasHoras', () => {
  it('soma minutos e custo congelado por linha de custo e conta os aprovados sem custo', () => {
    const resumo = resumirCustoDasHoras([
      { custoId: 'geral', minutos: 90, valorCusto: '180.00', custoSituacao: 'CALCULADO' },
      { custoId: 'geral', minutos: 37, valorCusto: new Prisma.Decimal('82.22'), custoSituacao: 'CALCULADO' },
      { custoId: 'item', minutos: 50, valorCusto: '81.25', custoSituacao: 'CALCULADO' },
      { custoId: null, minutos: 60, valorCusto: null, custoSituacao: 'TAXA_AMBIGUA' },
      { custoId: null, minutos: 30, valorCusto: null, custoSituacao: 'SEM_TAXA' }
    ]);

    expect(resumo.total.toFixed(2)).toBe('343.47');
    expect(resumo.semCusto).toBe(2);
    expect([...resumo.porCusto].map(([custoId, horas]) => [custoId, horas.minutos, horas.valor.toFixed(2)])).toEqual([
      ['geral', 127, '262.22'],
      ['item', 50, '81.25']
    ]);
  });

  it('ignora o que nao tem custo congelado e devolve zero para a linha sem horas aprovadas', () => {
    const resumo = resumirCustoDasHoras([
      { custoId: 'geral', minutos: 15, valorCusto: null, custoSituacao: 'NAO_APLICAVEL' },
      { custoId: null, minutos: 20, valorCusto: '10.00' }
    ]);

    expect(resumo.total.toFixed(2)).toBe('0.00');
    expect(resumo.semCusto).toBe(0);
    expect(custoDaLinha(resumo, 'geral')).toEqual({ minutos: 0, valor: new Prisma.Decimal(0) });
  });

  it('preserva a quantidade de apontamentos sem custo quando recebe grupos agregados', () => {
    const resumo = resumirCustoDasHoras([
      { custoId: null, minutos: 180, valorCusto: null, custoSituacao: 'SEM_TAXA', quantidade: 3 },
      { custoId: null, minutos: 120, valorCusto: null, custoSituacao: 'TAXA_AMBIGUA', quantidade: 2 }
    ]);

    expect(resumo.semCusto).toBe(5);
  });
});
