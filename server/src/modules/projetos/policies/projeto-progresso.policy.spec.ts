import {
  calcularProgressoEsperado,
  calcularProjetoProgresso,
  diasAteData,
  estaVencidoNoDiaOperacional
} from './projeto-progresso.policy';

describe('projeto-progresso.policy', () => {
  it('pondera o progresso por estimativa e exclui cancelados dos dois lados', () => {
    expect(calcularProjetoProgresso([
      { status: 'CONCLUIDO', estimativaMinutos: 60 },
      { status: 'ABERTO', estimativaMinutos: 180 },
      { status: 'CANCELADO', estimativaMinutos: 600 }
    ])).toMatchObject({
      percentual: 25,
      totalItens: 2,
      itensConcluidos: 1,
      estimativaTotalMinutos: 240,
      estimativaConcluidaMinutos: 60,
      usaEstimativas: true
    });
  });

  it('usa quantidade quando nenhum item considerado tem estimativa', () => {
    expect(calcularProjetoProgresso([
      { status: 'CONCLUIDO' },
      { status: 'ABERTO', estimativaMinutos: 0 },
      { status: 'CONCLUIDO', estimativaMinutos: null }
    ])).toMatchObject({ percentual: 67, usaEstimativas: false });
  });

  it.each([
    [[], 0],
    [[{ status: 'CANCELADO', estimativaMinutos: 30 }], 0],
    [[{ status: 'CONCLUIDO', estimativaMinutos: 30, arquivadoEm: new Date() }], 0]
  ])('resulta em zero sem itens considerados', (itens, percentual) => {
    expect(calcularProjetoProgresso(itens).percentual).toBe(percentual);
  });

  it.each([
    ['2026-09-30', 0],
    ['2026-10-01', 0],
    ['2026-10-06', 50],
    ['2026-10-11', 100],
    ['2026-10-20', 100]
  ])('calcula o progresso esperado em %s', (hoje, esperado) => {
    expect(calcularProgressoEsperado(
      new Date('2026-10-01T00:00:00.000Z'),
      new Date('2026-10-11T00:00:00.000Z'),
      hoje
    )).toBe(esperado);
  });

  it('retorna nulo quando o projeto nao tem periodo planejado completo', () => {
    expect(calcularProgressoEsperado(null, new Date(), '2026-10-16')).toBeNull();
  });

  it('compara prazo pelo dia operacional, sem depender do fuso do servidor', () => {
    const data = new Date('2026-10-15T00:00:00.000Z');
    expect(diasAteData(data, '2026-10-16')).toBe(-1);
    expect(estaVencidoNoDiaOperacional(data, '2026-10-16')).toBe(true);
    expect(estaVencidoNoDiaOperacional(data, '2026-10-15')).toBe(false);
  });
});
