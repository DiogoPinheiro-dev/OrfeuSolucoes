import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ForbiddenException, INestApplication, ValidationPipe } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { ExtractJwt, Strategy } from 'passport-jwt';
import request from 'supertest';
import { GqlAuthGuard } from '../src/modules/auth/guards/gql-auth.guard';
import { ProjetoApontamentoAuthorizationService } from '../src/modules/projetos/projeto-apontamento-authorization.service';
import { ProjetoApontamentoPeriodoService } from '../src/modules/projetos/projeto-apontamento-periodo.service';
import { ProjetoApontamentoQueryService } from '../src/modules/projetos/projeto-apontamento-query.service';
import { ProjetoApontamentoResolver } from '../src/modules/projetos/projeto-apontamento.resolver';
import { ProjetoApontamentoService } from '../src/modules/projetos/projeto-apontamento.service';
import { ProjetoAuditoriaService } from '../src/modules/projetos/projeto-auditoria.service';
import { ProjetoAuthorizationService } from '../src/modules/projetos/projeto-authorization.service';
import { ProjetoPeriodoService } from '../src/modules/projetos/projeto-periodo.service';
import { ProjetoRecursoAuthorizationService } from '../src/modules/projetos/projeto-recurso-authorization.service';
import { ProjetoRecursoHierarquiaService } from '../src/modules/projetos/projeto-recurso-hierarquia.service';
import { ProjetosService } from '../src/modules/projetos/projetos.service';

type Registro = Record<string, any>;

function expectDefinido<T>(valor: T | undefined): T {
  expect(valor).toBeDefined();
  return valor as T;
}

const pessoa = (sub: string, login: string) => ({
  sub,
  login,
  nome: login,
  email: `${login}@orfeu.local`,
  padraoSistema: false,
  empresaId: 10
});
const membro = pessoa('22222222-2222-4222-8222-222222222222', 'membro');
const observador = pessoa('33333333-3333-4333-8333-333333333333', 'observador');
const PROJETO_ID = '44444444-4444-4444-8444-444444444444';
const PROJETO_DE_OUTRA_EMPRESA_ID = '55555555-5555-4555-8555-555555555555';
const APONTAMENTO_REPETIDO_ID = '66666666-6666-4666-8666-666666666666';
const TODAS_AS_ACOES = ['visualizar', 'incluir', 'alterar', 'excluir'];

class ApontamentoTestJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: 'apontamento-test-secret'
    });
  }

  validate(payload: Record<string, unknown>) {
    return payload;
  }
}

/** Persistência mínima para a borda GraphQL; as regras completas são provadas na integração com o Prisma em memória. */
function criarPersistencia() {
  const usuario = (dono: typeof membro) => ({ id: dono.sub, nome: dono.nome, login: dono.login, email: dono.email });
  const projetos: Registro[] = [
    {
      id: PROJETO_ID,
      empresaId: 10,
      chave: 'HRS',
      nome: 'Projeto de horas',
      situacao: 'EM_ANDAMENTO',
      arquivadoEm: null,
      responsavelId: '11111111-1111-4111-8111-111111111111',
      membros: [
        { usuarioId: membro.sub, papel: 'MEMBRO', usuario: usuario(membro) },
        { usuarioId: observador.sub, papel: 'OBSERVADOR', usuario: usuario(observador) }
      ]
    },
    {
      id: PROJETO_DE_OUTRA_EMPRESA_ID,
      empresaId: 20,
      chave: 'EXT',
      nome: 'Projeto de outra empresa',
      situacao: 'EM_ANDAMENTO',
      arquivadoEm: null,
      responsavelId: membro.sub,
      membros: []
    }
  ];
  const apontamentos: Registro[] = [];
  const noPeriodo = (data: Date, periodo: Registro) =>
    (!periodo.gte || data >= periodo.gte) && (!periodo.lte || data <= periodo.lte) && (!periodo.lt || data < periodo.lt);
  const atende = (apontamento: Registro, where: Registro) =>
    apontamento.empresaId === where.empresaId &&
    apontamento.usuarioId === where.usuarioId &&
    (!('arquivadoEm' in where) || apontamento.arquivadoEm === null) &&
    (!where.projetoId || apontamento.projetoId === where.projetoId) &&
    (!where.status || apontamento.status === where.status) &&
    (!where.id || where.id.in.includes(apontamento.id)) &&
    (!where.dataTrabalho || noPeriodo(apontamento.dataTrabalho, where.dataTrabalho));
  const comDetalhe = (apontamento: Registro) => {
    const projeto = projetos.find((candidato) => candidato.id === apontamento.projetoId) ?? {};
    return {
      ...apontamento,
      projeto: {
        ...projeto,
        membros: (projeto.membros ?? [])
          .filter((vinculo: Registro) => vinculo.usuarioId === apontamento.usuarioId)
          .map((vinculo: Registro) => ({ papel: vinculo.papel }))
      },
      item: null,
      decididoPor: null
    };
  };

  const prisma = {
    projeto: {
      findFirst: jest.fn(async ({ where }: Registro) =>
        projetos.find((projeto) => projeto.id === where.id && projeto.empresaId === where.empresaId) ?? null),
      findMany: jest.fn(async ({ where }: Registro) => projetos
        .filter((projeto) => projeto.empresaId === where.empresaId)
        .map(({ id, chave, nome, situacao, arquivadoEm }) => ({ id, chave, nome, situacao, arquivadoEm })))
    },
    projetoItem: {
      findMany: jest.fn(async ({ where }: Registro) =>
        where.projetoId === PROJETO_ID ? [{ id: '77777777-7777-4777-8777-777777777777', chave: 'HRS-1', titulo: 'Preparar a entrega' }] : [])
    },
    projetoApontamento: {
      findFirst: jest.fn(async ({ where }: Registro) => apontamentos.find((apontamento) =>
        apontamento.id === where.id &&
        apontamento.empresaId === where.empresaId &&
        apontamento.usuarioId === where.usuarioId &&
        (!where.projetoId || apontamento.projetoId === where.projetoId)) ?? null),
      count: jest.fn(async ({ where }: Registro) => apontamentos.filter((apontamento) => atende(apontamento, where)).length),
      findMany: jest.fn(async ({ where, skip = 0, take }: Registro) => apontamentos
        .filter((apontamento) => atende(apontamento, where))
        .slice(skip, take === undefined ? undefined : skip + take)
        .map(comDetalhe)),
      create: jest.fn(async ({ data }: Registro) => {
        const criado = {
          id: randomUUID(),
          status: 'RASCUNHO',
          enviadoEm: null,
          decididoPorId: null,
          decididoEm: null,
          motivo: null,
          arquivadoEm: null,
          arquivadoPorId: null,
          versao: 1,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
          ...data
        };
        apontamentos.push(criado);
        return criado;
      }),
      updateMany: jest.fn(async ({ where, data }: Registro) => {
        const atual = apontamentos.find((apontamento) => apontamento.id === where.id && apontamento.versao === where.versao);
        if (!atual) return { count: 0 };
        const { versao: _incremento, ...campos } = data;
        Object.assign(atual, campos, { versao: atual.versao + 1, atualizadoEm: new Date() });
        return { count: 1 };
      }),
      deleteMany: jest.fn(async ({ where }: Registro) => {
        const indice = apontamentos.findIndex((apontamento) => apontamento.id === where.id && apontamento.versao === where.versao);
        if (indice < 0) return { count: 0 };
        apontamentos.splice(indice, 1);
        return { count: 1 };
      })
    },
    projetoApontamentoPeriodo: { findMany: jest.fn(async () => []) },
    projetoEvento: { create: jest.fn(async () => ({})) },
    recurso: { findUnique: jest.fn(async () => null) },
    $transaction: jest.fn((operacao: (tx: unknown) => Promise<unknown>): Promise<unknown> => operacao(prisma))
  };

  return { prisma, apontamentos };
}

describe('Meus apontamentos GraphQL e2e', () => {
  let app: INestApplication;
  let memberToken: string;
  let observerToken: string;
  const acessos = new Map<string, Set<string>>();
  const funcionalidadeAuthorization = {
    isSystemAdmin: (user?: { padraoSistema?: boolean | null } | null) => user?.padraoSistema === true,
    assertFeatureAction: jest.fn(async (user: { sub: string }, solucao: string, funcionalidade: string, acao: string) => {
      if (solucao !== 'projetos' || funcionalidade !== 'meus-apontamentos' || !acessos.get(user.sub)?.has(acao)) {
        throw new ForbiddenException('Usuario sem permissao para acessar esta funcionalidade.');
      }
    })
  };
  const { prisma, apontamentos } = criarPersistencia();

  beforeAll(async () => {
    const persistencia = prisma as never;
    const projetoAuthorization = new ProjetoAuthorizationService(funcionalidadeAuthorization as never);
    const periodo = new ProjetoPeriodoService();
    const autorizacao = new ProjetoApontamentoAuthorizationService(
      persistencia,
      projetoAuthorization,
      new ProjetoRecursoHierarquiaService(persistencia, new ProjetoRecursoAuthorizationService(persistencia, projetoAuthorization))
    );
    const periodos = new ProjetoApontamentoPeriodoService(persistencia, periodo);
    const consultas = new ProjetoApontamentoQueryService(persistencia, autorizacao, periodo, periodos);
    const apontamentoService = new ProjetoApontamentoService(
      persistencia,
      autorizacao,
      consultas,
      periodo,
      periodos,
      new ProjetoAuditoriaService()
    );
    const naoUsado = {} as never;
    const projetosService = new ProjetosService(
      naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado,
      naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado,
      apontamentoService,
      consultas
    );

    const fixture = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          context: ({ req, res }: { req: Request; res: Response }) => ({ req, res })
        })
      ],
      providers: [
        ProjetoApontamentoResolver,
        GqlAuthGuard,
        ApontamentoTestJwtStrategy,
        { provide: ProjetosService, useValue: projetosService }
      ]
    }).compile();

    app = fixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    const jwt = new JwtService({ secret: 'apontamento-test-secret' });
    memberToken = jwt.sign(membro);
    observerToken = jwt.sign(observador);
  });

  afterAll(async () => app.close());

  beforeEach(() => {
    jest.clearAllMocks();
    apontamentos.length = 0;
    acessos.clear();
  });

  const gql = (token: string, query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/graphql').set('Authorization', `Bearer ${token}`).send({ query, variables });
  const SALVAR = `mutation Salvar($input: SalvarProjetoApontamentoInput!) {
    salvarProjetoApontamento(input: $input) {
      id status dataTrabalho competencia minutos descricao faturavel versao
      projeto { chave situacao }
      acoes { podeAlterar podeExcluir podeEnviar podeRecolher bloqueio }
    }
  }`;
  const ENVIAR = `mutation Enviar($input: EnviarProjetoApontamentosInput!) {
    enviarProjetoApontamentos(input: $input) { id status versao acoes { podeEnviar podeRecolher } }
  }`;
  const MEUS = `query Meus($filtro: MeusProjetoApontamentosFiltroInput!) {
    meusProjetoApontamentos(filtro: $filtro) {
      total totalPaginas totalMinutos
      totaisPorDia { data minutos }
      totaisPorProjeto { chave minutos }
      items { id status }
      permissoes { podeIncluir }
    }
  }`;
  const lancamento = { projetoId: PROJETO_ID, data: '2026-09-15', minutos: 90, descricao: '  Reunião de alinhamento  ', faturavel: true };

  it('lança, envia e consulta as próprias horas pela borda GraphQL', async () => {
    acessos.set(membro.sub, new Set(TODAS_AS_ACOES));

    const salvo = await gql(memberToken, SALVAR, { input: lancamento }).expect(200);
    expect(salvo.body.errors).toBeUndefined();
    const apontamento = salvo.body.data.salvarProjetoApontamento;
    expect(apontamento).toMatchObject({
      status: 'RASCUNHO',
      dataTrabalho: '2026-09-15',
      competencia: '2026-09',
      minutos: 90,
      descricao: 'Reunião de alinhamento',
      faturavel: true,
      versao: 1,
      projeto: { chave: 'HRS', situacao: 'EM_ANDAMENTO' },
      acoes: { podeAlterar: true, podeExcluir: true, podeEnviar: true, podeRecolher: false, bloqueio: null }
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });

    const enviado = await gql(memberToken, ENVIAR, { input: { apontamentos: [{ id: apontamento.id, versao: 1 }] } }).expect(200);
    expect(enviado.body.errors).toBeUndefined();
    expect(enviado.body.data.enviarProjetoApontamentos).toEqual([{
      id: apontamento.id,
      status: 'ENVIADO',
      versao: 2,
      acoes: { podeEnviar: false, podeRecolher: true }
    }]);

    const meus = await gql(memberToken, MEUS, { filtro: { inicio: '2026-09-01', fim: '2026-09-30', pagina: 1, limite: 5 } }).expect(200);
    expect(meus.body.errors).toBeUndefined();
    expect(meus.body.data.meusProjetoApontamentos).toEqual({
      total: 1,
      totalPaginas: 1,
      totalMinutos: 90,
      totaisPorDia: [{ data: '2026-09-15', minutos: 90 }],
      totaisPorProjeto: [{ chave: 'HRS', minutos: 90 }],
      items: [{ id: apontamento.id, status: 'ENVIADO' }],
      permissoes: { podeIncluir: true }
    });
  });

  it('recolhe, descarta, exclui e lista projetos e itens pela borda GraphQL', async () => {
    acessos.set(membro.sub, new Set(TODAS_AS_ACOES));
    const salvar = async () => (await gql(memberToken, SALVAR, { input: lancamento }).expect(200)).body.data.salvarProjetoApontamento;
    const versionar = (operacao: string, campos = '') =>
      `mutation Versionar($input: VersionarProjetoApontamentoInput!) { ${operacao}(input: $input)${campos} }`;

    const consulta = await gql(memberToken, `query Selecao($projetoId: String!) {
      projetoApontamentoProjetos { id chave nome situacao arquivadoEm }
      projetoApontamentoItens(projetoId: $projetoId) { id chave titulo }
    }`, { projetoId: PROJETO_ID }).expect(200);
    expect(consulta.body.errors).toBeUndefined();
    expect(consulta.body.data).toEqual({
      projetoApontamentoProjetos: [{ id: PROJETO_ID, chave: 'HRS', nome: 'Projeto de horas', situacao: 'EM_ANDAMENTO', arquivadoEm: null }],
      projetoApontamentoItens: [{ id: '77777777-7777-4777-8777-777777777777', chave: 'HRS-1', titulo: 'Preparar a entrega' }]
    });

    const enviado = await salvar();
    await gql(memberToken, ENVIAR, { input: { apontamentos: [{ id: enviado.id, versao: 1 }] } }).expect(200);
    const recolhido = await gql(memberToken, versionar('recolherProjetoApontamento', ' { id status versao acoes { podeEnviar } }'), {
      input: { id: enviado.id, versao: 2 }
    }).expect(200);
    expect(recolhido.body.errors).toBeUndefined();
    expect(recolhido.body.data.recolherProjetoApontamento).toEqual({ id: enviado.id, status: 'RASCUNHO', versao: 3, acoes: { podeEnviar: true } });
    const excluido = await gql(memberToken, versionar('excluirProjetoApontamento'), { input: { id: enviado.id, versao: 3 } }).expect(200);
    expect(excluido.body).toEqual({ data: { excluirProjetoApontamento: true } });

    const rejeitado = await salvar();
    Object.assign(expectDefinido(apontamentos.find((apontamento) => apontamento.id === rejeitado.id)), { status: 'REJEITADO', versao: 2 });
    const descartado = await gql(memberToken, versionar('descartarProjetoApontamento'), { input: { id: rejeitado.id, versao: 2 } }).expect(200);
    expect(descartado.body).toEqual({ data: { descartarProjetoApontamento: true } });
    expect(apontamentos).toEqual([expect.objectContaining({ id: rejeitado.id, arquivadoPorId: membro.sub, versao: 3 })]);
  });

  it('nega a chamada direta sem a ação, ao observador, ao projeto de outra empresa e sem sessão', async () => {
    const semAcao = await gql(memberToken, SALVAR, { input: lancamento }).expect(200);
    expect(semAcao.body.errors?.[0]).toMatchObject({
      message: 'Usuario sem permissao para acessar esta funcionalidade.',
      extensions: { code: 'FORBIDDEN' }
    });
    expect(prisma.projeto.findFirst).not.toHaveBeenCalled();

    acessos.set(membro.sub, new Set(['visualizar', 'incluir']));
    acessos.set(observador.sub, new Set(TODAS_AS_ACOES));
    const doObservador = await gql(observerToken, SALVAR, { input: lancamento }).expect(200);
    expect(doObservador.body.errors?.[0]).toMatchObject({
      message: 'Somente o responsável e os membros do projeto lançam horas nele.',
      extensions: { code: 'FORBIDDEN' }
    });
    const deOutraEmpresa = await gql(memberToken, SALVAR, { input: { ...lancamento, projetoId: PROJETO_DE_OUTRA_EMPRESA_ID } }).expect(200);
    expect(deOutraEmpresa.body.errors?.[0]).toMatchObject({ message: 'Projeto nao encontrado.', extensions: { status: 404 } });
    const envioSemAlterar = await gql(memberToken, ENVIAR, { input: { apontamentos: [{ id: randomUUID(), versao: 1 }] } }).expect(200);
    expect(envioSemAlterar.body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    expect(prisma.projetoApontamento.create).not.toHaveBeenCalled();
    expect(prisma.projetoApontamento.updateMany).not.toHaveBeenCalled();

    const anonimo = await request(app.getHttpServer()).post('/graphql').send({ query: '{ projetoApontamentoProjetos { id } }' }).expect(200);
    expect(anonimo.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it.each([
    ['duração zero', { minutos: 0 }],
    ['duração negativa', { minutos: -30 }],
    ['duração acima de 24 horas', { minutos: 1441 }],
    ['data fora do formato', { data: '15/09/2026' }],
    ['descrição acima de 1.000 caracteres', { descricao: 'a'.repeat(1001) }],
    ['projeto sem identificador válido', { projetoId: 'projeto-1' }],
    ['item sem identificador válido', { itemId: 'item-1' }]
  ])('recusa %s antes de chegar ao serviço', async (_caso, dados) => {
    acessos.set(membro.sub, new Set(TODAS_AS_ACOES));

    const resposta = await gql(memberToken, SALVAR, { input: { ...lancamento, ...dados } }).expect(200);

    expect(resposta.body.errors?.[0]?.extensions?.code).toBe('BAD_REQUEST');
    expect(funcionalidadeAuthorization.assertFeatureAction).not.toHaveBeenCalled();
  });

  it('recusa duração fracionada e faturável ausente pelo próprio contrato GraphQL', async () => {
    const fracionada = await gql(memberToken, SALVAR, { input: { ...lancamento, minutos: 1.5 } });
    const semFaturavel = await gql(memberToken, SALVAR, {
      input: { projetoId: lancamento.projetoId, data: lancamento.data, minutos: lancamento.minutos, descricao: lancamento.descricao }
    });

    expect(fracionada.body.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
    expect(semFaturavel.body.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
    expect(funcionalidadeAuthorization.assertFeatureAction).not.toHaveBeenCalled();
  });

  it.each([
    ['nenhum apontamento', []],
    ['mais de 100 apontamentos', Array.from({ length: 101 }, () => ({ id: randomUUID(), versao: 1 }))],
    ['o mesmo apontamento duas vezes', [{ id: APONTAMENTO_REPETIDO_ID, versao: 1 }, { id: APONTAMENTO_REPETIDO_ID, versao: 2 }]],
    ['versão zero', [{ id: randomUUID(), versao: 0 }]]
  ])('recusa o envio com %s', async (_caso, lista) => {
    const resposta = await gql(memberToken, ENVIAR, { input: { apontamentos: lista } }).expect(200);

    expect(resposta.body.errors?.[0]?.extensions?.code).toBe('BAD_REQUEST');
    expect(funcionalidadeAuthorization.assertFeatureAction).not.toHaveBeenCalled();
  });

  it.each([
    ['página zero', { pagina: 0 }, 'BAD_REQUEST'],
    ['limite acima de 100', { limite: 101 }, 'BAD_REQUEST'],
    ['início fora do formato', { inicio: '2026-9-1' }, 'BAD_REQUEST'],
    ['situação desconhecida', { status: 'PAGO' }, 'BAD_USER_INPUT']
  ])('recusa o filtro de Meus apontamentos com %s', async (_caso, dados, codigo) => {
    const resposta = await gql(memberToken, MEUS, { filtro: { inicio: '2026-09-01', fim: '2026-09-30', ...dados } });

    expect(resposta.body.errors?.[0]?.extensions?.code).toBe(codigo);
    expect(funcionalidadeAuthorization.assertFeatureAction).not.toHaveBeenCalled();
  });
});
