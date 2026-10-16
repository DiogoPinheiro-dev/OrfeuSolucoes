import {
  calcularProjetoIndicadores,
  percentualConsumido,
  statusDoOrcamento
} from './projeto-indicadores.policy';

describe('projeto-indicadores.policy', () => {
  it.each([
    ['100', '25', 25],
    ['80', '100', 125],
    ['0', '0', null]
  ])('calcula o percentual consumido de %s por %s', (planejado, realizado, esperado) => {
    expect(percentualConsumido(planejado, realizado)).toBe(esperado);
  });

  it.each([
    ['100', '25', 'DENTRO_DO_PLANEJADO'],
    ['100', '100', 'NO_LIMITE'],
    ['100', '101', 'ACIMA_DO_PLANEJADO'],
    ['0', '0', 'SEM_BASE'],
    ['0', '1', 'ACIMA_DO_PLANEJADO']
  ])('classifica o orcamento', (planejado, realizado, esperado) => {
    expect(statusDoOrcamento(planejado, realizado)).toBe(esperado);
  });

  it('calcula os indicadores sem depender de acesso ao banco', () => {
    const calculadoEm = new Date('2026-10-16T12:00:00Z');
    const resultado = calcularProjetoIndicadores({
      projeto: {
        id: 'projeto-1',
        metodologia: 'SCRUM',
        inicioPrevistoEm: new Date('2026-10-01T00:00:00Z'),
        fimPrevistoEm: new Date('2026-10-31T00:00:00Z')
      } as never,
      itens: [
        {
          id: 'item-1',
          status: 'ABERTO',
          estimativaMinutos: null,
          inicioPrevistoEm: new Date('2026-10-17T00:00:00Z'),
          fimPrevistoEm: new Date('2026-10-15T00:00:00Z')
        }
      ],
      sprintAtiva: null,
      dependencias: [],
      marcos: [],
      entregas: [],
      ultimaAtualizacao: null,
      eventosNosUltimosSeteDias: 0,
      ultimoEvento: null,
      esforcoPorStatus: [],
      agora: calculadoEm,
      hojeOperacional: '2026-10-16'
    });

    expect(resultado.progresso).toMatchObject({
      calculadoEm,
      percentual: 0,
      esperadoPercentual: 50,
      origem: { tela: 'Backlog do projeto' }
    });
    expect(resultado.sprintAtiva.avisos).toEqual([
      'O projeto Scrum nao possui sprint ativa.'
    ]);
    expect(resultado.bloqueios.inconsistenciasDeDatas).toBe(1);
    expect(resultado.atividade.avisos).toEqual([
      'O projeto nao possui atualizacao de status.'
    ]);
  });
});
