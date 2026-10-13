import { ProjetoApontamentoCustoSituacao } from '../types/projeto-apontamento.types';
import { ProjetoApontamentoLinhaCusto, escolherTaxaApontamento } from './projeto-apontamento-taxa.policy';

const { CALCULADO, SEM_TAXA, TAXA_AMBIGUA } = ProjetoApontamentoCustoSituacao;

// Em Sao Paulo (UTC-3), o dia de trabalho termina na meia-noite seguinte, as 03:00 UTC do outro dia.
const fimDoDiaTrabalho = (data: string) => new Date(Date.parse(`${data}T03:00:00.000Z`) + 24 * 60 * 60 * 1000);

const linha = (dados: Partial<ProjetoApontamentoLinhaCusto> & { id: string }): ProjetoApontamentoLinhaCusto => ({
  itemId: null,
  taxaHora: '150.0000',
  taxas: [],
  ...dados
});

const historico = [
  { id: 't1', taxaHora: '100', criadoEm: new Date('2026-10-01T15:00:00.000Z') },
  { id: 't2', taxaHora: '120', criadoEm: new Date('2026-10-10T15:00:00.000Z') }
];

describe('ProjetoApontamentoTaxaPolicy', () => {
  it.each([
    ['antes da mudanca', '2026-10-09', 't1', '100.0000'],
    ['no dia da mudanca', '2026-10-10', 't2', '120.0000'],
    ['depois da mudanca', '2026-10-11', 't2', '120.0000'],
    ['antes do primeiro registro', '2026-09-15', 't1', '100.0000']
  ])('usa a taxa vigente %s', (_caso, dataTrabalho, taxaHistoricoId, taxaHora) => {
    expect(escolherTaxaApontamento([linha({ id: 'geral', taxas: historico })], null, fimDoDiaTrabalho(dataTrabalho))).toEqual({
      situacao: CALCULADO,
      custoId: 'geral',
      taxaHistoricoId,
      taxaHora
    });
  });

  it('considera a mudanca feita ate a meia-noite do fuso operacional', () => {
    const mudancaAs2330 = [historico[0]!, { id: 't3', taxaHora: '130', criadoEm: new Date('2026-10-11T02:30:00.000Z') }];
    const mudancaAMeiaNoite = [historico[0]!, { id: 't4', taxaHora: '140', criadoEm: new Date('2026-10-11T03:00:00.000Z') }];

    expect(escolherTaxaApontamento([linha({ id: 'geral', taxas: mudancaAs2330 })], null, fimDoDiaTrabalho('2026-10-10'))).toMatchObject({
      taxaHistoricoId: 't3'
    });
    expect(escolherTaxaApontamento([linha({ id: 'geral', taxas: mudancaAMeiaNoite })], null, fimDoDiaTrabalho('2026-10-10'))).toMatchObject({
      taxaHistoricoId: 't1'
    });
  });

  it('prefere a linha do item e usa a linha geral quando o item nao tem linha propria', () => {
    const linhas = [
      linha({ id: 'geral', taxaHora: '100.0000' }),
      linha({ id: 'item-a', itemId: 'A', taxaHora: '180.0000' }),
      linha({ id: 'item-b', itemId: 'B', taxaHora: '200.0000' })
    ];

    expect(escolherTaxaApontamento(linhas, 'A', fimDoDiaTrabalho('2026-10-10'))).toMatchObject({ custoId: 'item-a' });
    expect(escolherTaxaApontamento(linhas, 'C', fimDoDiaTrabalho('2026-10-10'))).toMatchObject({ custoId: 'geral' });
    expect(escolherTaxaApontamento(linhas, null, fimDoDiaTrabalho('2026-10-10'))).toMatchObject({ custoId: 'geral' });
  });

  it('marca taxa ambigua quando ha mais de uma linha no mesmo nivel', () => {
    expect(
      escolherTaxaApontamento([linha({ id: 'a1', itemId: 'A' }), linha({ id: 'a2', itemId: 'A' })], 'A', fimDoDiaTrabalho('2026-10-10'))
    ).toEqual({ situacao: TAXA_AMBIGUA });
    expect(escolherTaxaApontamento([linha({ id: 'g1' }), linha({ id: 'g2' })], null, fimDoDiaTrabalho('2026-10-10'))).toEqual({
      situacao: TAXA_AMBIGUA
    });
  });

  it('marca sem taxa quando nao ha linha aplicavel', () => {
    expect(escolherTaxaApontamento([], null, fimDoDiaTrabalho('2026-10-10'))).toEqual({ situacao: SEM_TAXA });
    expect(escolherTaxaApontamento([linha({ id: 'item-b', itemId: 'B' })], null, fimDoDiaTrabalho('2026-10-10'))).toEqual({
      situacao: SEM_TAXA
    });
  });

  it('usa a taxa atual da linha sem historico e marca sem taxa quando ela nao existe', () => {
    expect(escolherTaxaApontamento([linha({ id: 'geral', taxaHora: '97.5' })], null, fimDoDiaTrabalho('2026-10-10'))).toEqual({
      situacao: CALCULADO,
      custoId: 'geral',
      taxaHistoricoId: null,
      taxaHora: '97.5000'
    });
    expect(escolherTaxaApontamento([linha({ id: 'geral', taxaHora: null })], null, fimDoDiaTrabalho('2026-10-10'))).toEqual({
      situacao: SEM_TAXA
    });
  });
});
