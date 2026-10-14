import { Prisma } from '@prisma/client';
import {
  ProjetoApontamentoLancado,
  toProjetoApontamentoCustoType,
  toProjetoHorasLinhaCustoType,
  totalizarCustoDasHoras,
  totalizarHorasDoProjeto
} from './projeto-horas.mapper';

const pessoa = (id: string, nome: string | null, login: string | null = null) => ({ id, nome, login, email: `${id}@orfeu.test` });
const item = { id: 'item-2', chave: 'GHR-2', titulo: 'Homologar' };
const lancado = (dados: Partial<ProjetoApontamentoLancado>): ProjetoApontamentoLancado => ({
  usuarioId: 'ana',
  usuario: pessoa('ana', 'Ana'),
  itemId: null,
  item: null,
  minutos: 30,
  status: 'APROVADO',
  custoSituacao: 'CALCULADO',
  valorCusto: '10.00',
  ...dados
});

describe('projeto-horas.mapper', () => {
  const lancados = [
    lancado({ usuarioId: 'bruno', usuario: pessoa('bruno', null, 'bruno.login'), minutos: 60, valorCusto: '120.00' }),
    lancado({ itemId: item.id, item, minutos: 45, valorCusto: '90.00' }),
    lancado({ itemId: 'item-10', item: { id: 'item-10', chave: 'GHR-10', titulo: 'Publicar' }, minutos: 15, valorCusto: '30.00' }),
    lancado({ minutos: 20, status: 'ENVIADO', custoSituacao: 'NAO_APLICAVEL', valorCusto: null }),
    lancado({ usuarioId: 'bruno', usuario: pessoa('bruno', null, 'bruno.login'), minutos: 10, custoSituacao: 'SEM_TAXA', valorCusto: null })
  ];

  it('totaliza minutos por pessoa e por item, com os sem item no fim', () => {
    expect(totalizarHorasDoProjeto(lancados)).toEqual({
      totalMinutos: 150,
      totaisPorUsuario: [
        { usuario: expect.objectContaining({ id: 'ana', nome: 'Ana' }), minutos: 80 },
        { usuario: expect.objectContaining({ id: 'bruno', login: 'bruno.login' }), minutos: 70 }
      ],
      totaisPorItem: [
        { item, minutos: 45 },
        { item: { id: 'item-10', chave: 'GHR-10', titulo: 'Publicar' }, minutos: 15 },
        { item: null, minutos: 90 }
      ]
    });
  });

  it('soma so o custo calculado das horas aprovadas', () => {
    expect(totalizarCustoDasHoras(lancados)).toEqual({
      totalCusto: '240.00',
      custosPorUsuario: [
        { usuario: expect.objectContaining({ id: 'ana' }), minutos: 60, valor: '120.00' },
        { usuario: expect.objectContaining({ id: 'bruno' }), minutos: 60, valor: '120.00' }
      ],
      custosPorItem: [
        { item, minutos: 45, valor: '90.00' },
        { item: expect.objectContaining({ chave: 'GHR-10' }), minutos: 15, valor: '30.00' },
        { item: null, minutos: 60, valor: '120.00' }
      ]
    });
    expect(totalizarCustoDasHoras([])).toEqual({ totalCusto: '0.00', custosPorUsuario: [], custosPorItem: [] });
  });

  it('formata o custo congelado e a linha de custo com as casas do orcamento', () => {
    expect(toProjetoApontamentoCustoType({
      custoSituacao: 'CALCULADO', custoId: 'linha', taxaHoraAplicada: new Prisma.Decimal('133.3333'), valorCusto: '82.2', moeda: 'BRL'
    })).toEqual({ situacao: 'CALCULADO', custoId: 'linha', taxaHoraAplicada: '133.3333', valorCusto: '82.20', moeda: 'BRL' });
    expect(toProjetoApontamentoCustoType({})).toEqual({
      situacao: 'NAO_APLICAVEL', custoId: null, taxaHoraAplicada: null, valorCusto: null, moeda: null
    });
    expect(toProjetoHorasLinhaCustoType(
      { id: 'linha', descricao: 'Análise', valorPlanejado: '195', taxaHora: null, recurso: null, item: null },
      { minutos: 50, valor: new Prisma.Decimal('81.25') }
    )).toEqual({
      custoId: 'linha',
      descricao: 'Análise',
      usuario: null,
      item: null,
      quantidadeMinutos: null,
      taxaHora: null,
      valorPlanejado: '195.00',
      minutosAprovados: 50,
      valorRealizadoHoras: '81.25'
    });
  });

  it('ordena as pessoas pelo nome, pelo login ou pelo email e desempata pelo identificador', () => {
    const ordem = totalizarHorasDoProjeto([
      lancado({ usuarioId: 'z', usuario: pessoa('z', 'Ana') }),
      lancado({ usuarioId: 'y', usuario: { id: 'y', nome: null, login: null, email: 'aaa@orfeu.test' } }),
      lancado({ usuarioId: 'a', usuario: pessoa('a', 'Ana') })
    ]).totaisPorUsuario.map((total) => total.usuario.id);

    expect(ordem).toEqual(['y', 'a', 'z']);
  });
});
