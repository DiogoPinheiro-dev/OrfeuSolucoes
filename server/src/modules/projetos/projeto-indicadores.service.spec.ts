import { ProjetoIndicadoresService } from './projeto-indicadores.service';

describe('ProjetoIndicadoresService', () => {
  it('cruza as fontes do projeto com a formula D8 sem executar escritas', async () => {
    const prisma = {
      projetoItem: { findMany: jest.fn().mockResolvedValue([
        { id: 'i1', status: 'CONCLUIDO', estimativaMinutos: 60, fimPrevistoEm: new Date('2026-10-14Z'), arquivadoEm: null },
        { id: 'i2', status: 'ABERTO', estimativaMinutos: 180, fimPrevistoEm: new Date('2026-10-15Z'), arquivadoEm: null },
        { id: 'i3', status: 'CANCELADO', estimativaMinutos: 600, fimPrevistoEm: null, arquivadoEm: null }
      ]) },
      projetoSprint: { findFirst: jest.fn().mockResolvedValue(null) },
      projetoItemDependencia: { findMany: jest.fn().mockResolvedValue([]) },
      projetoMarco: { findMany: jest.fn().mockResolvedValue([]) },
      projetoEntrega: { findMany: jest.fn().mockResolvedValue([]) },
      projetoAtualizacao: { findFirst: jest.fn().mockResolvedValue({
        criadoEm: new Date('2026-10-15T12:00:00Z'), saudePercebida: 'EM_DIA',
        autor: { nome: 'Ana' }
      }) },
      projetoEvento: {
        count: jest.fn().mockResolvedValue(4),
        findFirst: jest.fn().mockResolvedValue({ criadoEm: new Date('2026-10-16T10:00:00Z') })
      },
      projetoApontamento: { groupBy: jest.fn().mockResolvedValue([
        { status: 'APROVADO', _sum: { minutos: 90 } },
        { status: 'ENVIADO', _sum: { minutos: 30 } }
      ]) }
    };
    const service = new ProjetoIndicadoresService(prisma as never);

    const result = await service.calcular({
      empresaId: 7,
      projeto: {
        id: 'projeto-1', empresaId: 7, inicioPrevistoEm: new Date('2026-10-01Z'),
        fimPrevistoEm: new Date('2026-10-31Z'), metodologia: 'SCRUM'
      } as never,
      agora: new Date('2026-10-16T12:00:00Z'),
      hojeOperacional: '2026-10-16'
    });

    expect(result.progresso).toMatchObject({
      percentual: 25, esperadoPercentual: 50, itensAbertos: 1,
      itensConcluidos: 1, itensCancelados: 1
    });
    expect(result.prazos).toMatchObject({ diasAteFim: 15, itensAtrasados: 1, itensSemFimPrevisto: 0 });
    expect(result.esforco).toMatchObject({
      estimativaTotalMinutos: 240, minutosAprovados: 90, minutosEnviadosPendentes: 30
    });
    expect(result.sprintAtiva).toMatchObject({
      nome: null,
      diasRestantes: null,
      progressoPercentual: 0,
      avisos: ['O projeto Scrum nao possui sprint ativa.']
    });
    expect(result.atividade).toMatchObject({
      ultimaAtualizacaoAutor: 'Ana', saudePercebida: 'EM_DIA', eventosNosUltimosSeteDias: 4
    });
    expect(Object.keys(prisma).every((nome) => nome.startsWith('projeto'))).toBe(true);
  });
});
