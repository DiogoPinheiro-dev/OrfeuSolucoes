import { ProjetoCronogramaService } from './projeto-cronograma.service';
import { ProjetoSprintService } from './projeto-sprint.service';

describe('politica de progresso nos consumidores', () => {
  const itens = [
    { id: 'i1', status: 'CONCLUIDO', estimativaMinutos: 60 },
    { id: 'i2', status: 'ABERTO', estimativaMinutos: 180 },
    { id: 'i3', status: 'CANCELADO', estimativaMinutos: 600 }
  ];

  it('aplica D8 no cronograma', () => {
    const service = new ProjetoCronogramaService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    expect((service as any).progress(itens)).toBe(25);
  });

  it('aplica D8 na sprint sem alterar as contagens exibidas', () => {
    const service = new ProjetoSprintService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );
    const sprint = {
      id: 's1', projetoId: 'p1', nome: 'Sprint 1', objetivo: null,
      status: 'ATIVA', inicioPrevistoEm: new Date(), fimPrevistoEm: new Date(),
      versao: 1, itensAdicionadosAposInicio: 0, itensRetiradosAposInicio: 0,
      criadoEm: new Date(), atualizadoEm: new Date(),
      itens: itens.map((item, index) => ({
        id: `v${index}`, itemId: item.id, item: {
          ...item, chave: `P-${index}`, titulo: `Item ${index}`,
          tipo: 'TAREFA', prioridade: 'MEDIA'
        },
        escopoInicial: true, incluidoEm: new Date(), retiradoEm: null
      }))
    };

    expect((service as any).toType(sprint)).toMatchObject({
      totalItens: 3,
      totalConcluidos: 1,
      progressoPercentual: 25
    });
  });
});
