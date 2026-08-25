import { DEFAULT_CHAMADO_PRIORIDADES, DEFAULT_CHAMADO_TIPOS } from './constants/solucao.constants';
import { SolucaoChamadosBootstrapService } from './solucao-chamados-bootstrap.service';

describe('SolucaoChamadosBootstrapService configuracoes padrao', () => {
  function buildService(createTipo: jest.Mock, createPrioridade: jest.Mock) {
    const prisma = {
      chamadoTipo: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: createTipo
      },
      chamadoPrioridade: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: createPrioridade
      }
    };

    return new SolucaoChamadosBootstrapService(prisma as never, {} as never, {} as never);
  }

  it('trata conflito de unicidade concorrente como configuracao ja criada', async () => {
    const createTipo = jest.fn().mockRejectedValue({ code: 'P2002' });
    const createPrioridade = jest.fn().mockRejectedValue({ code: 'P2002' });
    const service = buildService(createTipo, createPrioridade);

    await expect(service.ensureDefaultChamadoConfiguracoesForEmpresa(7, true)).resolves.toBeUndefined();

    expect(createTipo).toHaveBeenCalledTimes(DEFAULT_CHAMADO_TIPOS.length);
    expect(createPrioridade).toHaveBeenCalledTimes(DEFAULT_CHAMADO_PRIORIDADES.length);
  });

  it('propaga falhas de persistencia que nao sejam conflito de unicidade', async () => {
    const persistenceError = new Error('falha de conexao');
    const service = buildService(jest.fn().mockRejectedValue(persistenceError), jest.fn());

    await expect(service.ensureDefaultChamadoConfiguracoesForEmpresa(7, true)).rejects.toBe(persistenceError);
  });
});
