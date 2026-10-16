import { ProjetoPainelService } from './projeto-painel.service';

const projeto = {
  id: 'projeto-1',
  empresaId: 7,
  responsavelId: 'usuario-1',
  membros: [],
  inicioPrevistoEm: null,
  fimPrevistoEm: null
};

const indicadores = {
  progresso: {}, prazos: {}, sprintAtiva: null, bloqueios: {},
  marcosEntregas: {}, esforco: {}, atividade: {}
};

describe('ProjetoPainelService', () => {
  const prisma = { projeto: { findFirst: jest.fn().mockResolvedValue(projeto) } };
  const authorization = {
    assertReadAccess: jest.fn().mockResolvedValue(7),
    assertVisibleProject: jest.fn()
  };
  const indicadorService = { calcular: jest.fn().mockResolvedValue(indicadores) };
  const orcamento = { resumoPainel: jest.fn().mockResolvedValue({ podeVisualizar: false, financeiro: null }) };
  const periodo = { hojeOperacional: jest.fn().mockReturnValue('2026-10-16') };
  const service = new ProjetoPainelService(
    prisma as never,
    authorization as never,
    indicadorService as never,
    orcamento as never,
    periodo as never
  );
  const user = { sub: 'usuario-1', empresaId: 7 } as never;

  beforeEach(() => jest.clearAllMocks());

  it('autoriza pelo cadastro, valida visibilidade e nao executa escrita', async () => {
    const result = await service.painel('projeto-1', user);

    expect(authorization.assertReadAccess).toHaveBeenCalledWith(user);
    expect(authorization.assertVisibleProject).toHaveBeenCalledWith(projeto, user, 7);
    expect(indicadorService.calcular).toHaveBeenCalledWith(expect.objectContaining({
      empresaId: 7,
      projeto,
      hojeOperacional: '2026-10-16'
    }));
    expect(result).toMatchObject({ projetoId: 'projeto-1', orcamento: null });
    expect(Object.keys(prisma)).toEqual(['projeto']);
  });

  it('reaproveita o consolidado financeiro quando autorizado', async () => {
    orcamento.resumoPainel.mockResolvedValueOnce({
      podeVisualizar: true,
      financeiro: {
        moeda: 'BRL', status: 'APROVADO', totalPlanejado: '100.00',
        totalRealizadoConsolidado: '25.00', variacaoConsolidada: '75.00',
        apontamentosSemCusto: 1
      }
    });

    const result = await service.painel('projeto-1', user);

    expect(result.orcamento).toMatchObject({
      moeda: 'BRL', percentualConsumido: 25, status: 'DENTRO_DO_PLANEJADO',
      avisos: ['Ha apontamentos aprovados sem custo calculado.']
    });
  });

  it('informa ausencia de orcamento a quem pode visualizar o financeiro', async () => {
    orcamento.resumoPainel.mockResolvedValueOnce({ podeVisualizar: true, financeiro: null });

    await expect(service.painel('projeto-1', user)).resolves.toMatchObject({
      orcamento: {
        status: 'SEM_ORCAMENTO',
        totalPlanejado: null,
        avisos: ['O projeto nao possui orcamento cadastrado.']
      }
    });
  });
});
