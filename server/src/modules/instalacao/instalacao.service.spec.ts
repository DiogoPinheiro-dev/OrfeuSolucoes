import { compare } from 'bcrypt';
import { CatalogoActionConsumerRegistry } from '../solucoes/catalogo-action-consumer.registry';
import { CatalogoProviderRegistry } from '../solucoes/catalogo-provider.registry';
import { InstalacaoService } from './instalacao.service';
import { CATALOGO_PRODUTO } from './manifesto/catalogo-produto';

const SENHA_INICIAL = 'Instalacao@Teste2026!';

// Empresas, usuários, grupos, soluções e funcionalidades, na ordem em que o serviço conta.
type Contagens = [number, number, number, number, number];

function contadores(proxima: () => Contagens) {
  let atual: Contagens = [0, 0, 0, 0, 0];
  return {
    empresa: jest.fn(async () => { atual = proxima(); return atual[0]; }),
    usuario: jest.fn(async () => atual[1]),
    grupoUsuario: jest.fn(async () => atual[2]),
    solucao: jest.fn(async () => atual[3]),
    funcionalidade: jest.fn(async () => atual[4])
  };
}

function criarCenario(options: {
  marcas?: Array<{ origem: string } | null>;
  contagens?: Contagens[];
  config?: Record<string, string | undefined>;
  funcionalidadesPublicadas?: Array<{ registryKey: string | null; providerKey: string | null; providerVersion: number | null }>;
  acoesPublicadas?: Array<{ chave: string; consumerKey: string | null; consumerVersion: number | null }>;
} = {}) {
  const marcas = [...(options.marcas ?? [null])];
  const contagens = [...(options.contagens ?? [[0, 0, 0, 0, 0]])];
  const proximaContagem = () => (contagens.length > 1 ? contagens.shift() : contagens[0]) as Contagens;
  const proximaMarca = () => (marcas.length > 1 ? marcas.shift() : marcas[0]) ?? null;

  const foraDaTransacao = contadores(proximaContagem);
  const prisma = {
    sistemaInstalacao: { findUnique: jest.fn(async () => proximaMarca()) },
    empresa: { count: foraDaTransacao.empresa },
    usuario: { count: foraDaTransacao.usuario },
    grupoUsuario: { count: foraDaTransacao.grupoUsuario },
    solucao: { count: foraDaTransacao.solucao },
    funcionalidade: {
      count: foraDaTransacao.funcionalidade,
      findMany: jest.fn().mockResolvedValue(options.funcionalidadesPublicadas ?? [])
    },
    funcionalidadeAcao: { findMany: jest.fn().mockResolvedValue(options.acoesPublicadas ?? []) },
    $transaction: jest.fn()
  };

  const naTransacao = contadores(proximaContagem);
  const transacao = {
    sistemaInstalacao: { create: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({}) },
    empresa: { count: naTransacao.empresa, create: jest.fn().mockResolvedValue({ id: 11 }) },
    usuario: { count: naTransacao.usuario, create: jest.fn().mockResolvedValue({ id: 'admin-id' }) },
    grupoUsuario: { count: naTransacao.grupoUsuario, create: jest.fn().mockResolvedValue({ id: 21 }) },
    solucao: { count: naTransacao.solucao },
    funcionalidade: { count: naTransacao.funcionalidade },
    empresaUsuario: { create: jest.fn().mockResolvedValue({}) },
    empresaSolucao: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    grupoSolucao: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    empresaFuncionalidade: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    grupoFuncionalidade: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    grupoFuncionalidadeAcao: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    chamadoTipo: { createMany: jest.fn().mockResolvedValue({ count: 4 }) },
    chamadoPrioridade: { createMany: jest.fn().mockResolvedValue({ count: 4 }) }
  };
  prisma.$transaction.mockImplementation(async (operacao: (database: typeof transacao) => Promise<unknown>) => operacao(transacao));

  const config: Record<string, string | undefined> = { INITIAL_ADMIN_PASSWORD: SENHA_INICIAL, ...options.config };
  const configService = { get: jest.fn((chave: string) => config[chave]) };
  const operacoes = {
    criarCatalogo: jest.fn().mockResolvedValue({
      solucoes: [{ id: 1, slug: 'projetos', ativo: true }, { id: 2, slug: 'inativa', ativo: false }],
      funcionalidades: [{ id: 5, solucaoId: 1, slug: 'backlog-de-demandas', ativo: true }],
      acoes: [{ id: 9, funcionalidadeId: 5, ativo: true }, { id: 10, funcionalidadeId: 5, ativo: false }]
    })
  };
  const service = new InstalacaoService(
    prisma as never,
    configService as never,
    operacoes as never,
    new CatalogoProviderRegistry(),
    new CatalogoActionConsumerRegistry()
  );

  return { service, prisma, transacao, operacoes };
}

describe('InstalacaoService', () => {
  it('apenas lê um banco já instalado e confere telas e regras', async () => {
    const { service, prisma, operacoes } = criarCenario({
      marcas: [{ origem: 'INSTALACAO' }],
      funcionalidadesPublicadas: [
        { registryKey: 'projetos.backlog-de-demandas', providerKey: 'projetos.backlog-de-demandas', providerVersion: 1 },
        { registryKey: 'projetos.tela-removida', providerKey: 'projetos.tela-removida', providerVersion: 1 }
      ],
      acoesPublicadas: [
        { chave: 'visualizar', consumerKey: 'visualizar', consumerVersion: 1 },
        { chave: 'regra_removida', consumerKey: 'regra_removida', consumerVersion: 1 }
      ]
    });

    await expect(service.verificarSubida()).resolves.toEqual({
      estado: 'JA_INSTALADA',
      origem: 'INSTALACAO',
      incompatibilidades: [
        'Tela incompativel: projetos.tela-removida.',
        'Regra de acao incompativel: regra_removida.'
      ]
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.empresa.count).not.toHaveBeenCalled();
    expect(operacoes.criarCatalogo).not.toHaveBeenCalled();
  });

  it('recusa banco com dados e sem marca, sem alterar nada', async () => {
    const { service, prisma } = criarCenario({ marcas: [null], contagens: [[1, 1, 1, 4, 28]] });

    await expect(service.verificarSubida()).rejects.toThrow('npm run banco:transicao');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('trata como instalado o banco que outra instância acabou de instalar', async () => {
    const { service, prisma } = criarCenario({
      marcas: [null, { origem: 'INSTALACAO' }],
      contagens: [[1, 1, 1, 4, 28]]
    });

    await expect(service.verificarSubida()).resolves.toMatchObject({ estado: 'JA_INSTALADA', origem: 'INSTALACAO' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('instala o banco vazio numa transação com marca, admin, contratos e permissões totais', async () => {
    const { service, prisma, transacao, operacoes } = criarCenario({ config: { INSTALACAO_EMPRESA_NOME: 'Orfeu Cliente' } });

    await expect(service.verificarSubida()).resolves.toEqual({
      estado: 'INSTALADA_AGORA',
      origem: 'INSTALACAO',
      incompatibilidades: []
    });

    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: 'ReadCommitted', timeout: 120_000 })
    );
    expect(transacao.sistemaInstalacao.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: 1, origem: 'INSTALACAO', versaoManifesto: CATALOGO_PRODUTO.versao })
    });
    // A marca é gravada antes de qualquer item do catálogo: é ela que trava uma segunda instância.
    const ordemDaMarca = transacao.sistemaInstalacao.create.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY;
    const ordemDoCatalogo = operacoes.criarCatalogo.mock.invocationCallOrder[0] ?? Number.NEGATIVE_INFINITY;
    expect(ordemDaMarca).toBeLessThan(ordemDoCatalogo);
    expect(transacao.empresa.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ nome: 'Orfeu Cliente', padraoSistema: true })
    });

    const usuario = transacao.usuario.create.mock.calls[0][0].data;
    expect(usuario).toMatchObject({ login: 'admin', grupoId: 21, deveAlterarSenha: true, padraoSistema: true });
    expect(usuario.senhaHash).not.toBe(SENHA_INICIAL);
    await expect(compare(SENHA_INICIAL, usuario.senhaHash)).resolves.toBe(true);

    expect(transacao.empresaUsuario.create).toHaveBeenCalledWith({ data: { empresaId: 11, usuarioId: 'admin-id' } });
    expect(transacao.empresaSolucao.createMany).toHaveBeenCalledWith({ data: [{ empresaId: 11, solucaoId: 1 }] });
    expect(transacao.grupoSolucao.createMany).toHaveBeenCalledWith({ data: [{ grupoId: 21, solucaoId: 1 }] });
    expect(transacao.empresaFuncionalidade.createMany).toHaveBeenCalledWith({ data: [{ empresaId: 11, funcionalidadeId: 5 }] });
    expect(transacao.grupoFuncionalidade.createMany).toHaveBeenCalledWith({ data: [{
      grupoId: 21, funcionalidadeId: 5, podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true
    }] });
    expect(transacao.grupoFuncionalidadeAcao.createMany).toHaveBeenCalledWith({ data: [{ grupoId: 21, funcionalidadeAcaoId: 9, permitido: true }] });
    expect(transacao.chamadoTipo.createMany.mock.calls[0][0].data).toHaveLength(4);
    expect(transacao.chamadoPrioridade.createMany.mock.calls[0][0].data).toHaveLength(4);
    expect(transacao.sistemaInstalacao.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { duracaoMs: expect.any(Number) } });
  });

  it('usa o nome padrão da empresa quando a instalação não informa outro', async () => {
    const { service, transacao } = criarCenario();

    await service.verificarSubida();

    expect(transacao.empresa.create).toHaveBeenCalledWith({ data: expect.objectContaining({ nome: 'Empresa Teste' }) });
  });

  it('desiste da instalação quando a marca de outra instância chega primeiro', async () => {
    const { service, prisma, transacao, operacoes } = criarCenario({ marcas: [null, { origem: 'INSTALACAO' }] });
    transacao.sistemaInstalacao.create.mockRejectedValueOnce(Object.assign(new Error('duplicada'), { code: 'P2002' }));

    await expect(service.verificarSubida()).resolves.toMatchObject({ estado: 'JA_INSTALADA', origem: 'INSTALACAO' });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(operacoes.criarCatalogo).not.toHaveBeenCalled();
  });

  it('propaga falhas que não são de concorrência para impedir a subida', async () => {
    const { service, operacoes } = criarCenario();
    operacoes.criarCatalogo.mockRejectedValueOnce(new Error('falha ao criar o catalogo'));

    await expect(service.verificarSubida()).rejects.toThrow('falha ao criar o catalogo');
  });

  it('recusa a instalação quando o banco deixa de estar vazio dentro da transação', async () => {
    const { service, operacoes } = criarCenario({ contagens: [[0, 0, 0, 0, 0], [1, 0, 0, 0, 0]] });

    await expect(service.verificarSubida()).rejects.toThrow('deixou de estar vazio');
    expect(operacoes.criarCatalogo).not.toHaveBeenCalled();
  });

  it('exige a senha inicial antes de abrir a transação', async () => {
    const { service, prisma } = criarCenario({ config: { INITIAL_ADMIN_PASSWORD: undefined } });

    await expect(service.verificarSubida()).rejects.toThrow('INITIAL_ADMIN_PASSWORD');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
