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
import { ProjetoApontamentoAprovacaoService } from '../src/modules/projetos/projeto-apontamento-aprovacao.service';
import { ProjetoApontamentoAuthorizationService } from '../src/modules/projetos/projeto-apontamento-authorization.service';
import { ProjetoApontamentoCustoService } from '../src/modules/projetos/projeto-apontamento-custo.service';
import { ProjetoApontamentoPeriodoService } from '../src/modules/projetos/projeto-apontamento-periodo.service';
import { ProjetoApontamentoResolver } from '../src/modules/projetos/projeto-apontamento.resolver';
import { ProjetoAuditoriaService } from '../src/modules/projetos/projeto-auditoria.service';
import { ProjetoAuthorizationService } from '../src/modules/projetos/projeto-authorization.service';
import { ProjetoHorasQueryService } from '../src/modules/projetos/projeto-horas-query.service';
import { ProjetoIdempotenciaService } from '../src/modules/projetos/projeto-idempotencia.service';
import { ProjetoOrcamentoAuthorizationService } from '../src/modules/projetos/projeto-orcamento-authorization.service';
import { ProjetoPeriodoService } from '../src/modules/projetos/projeto-periodo.service';
import { ProjetoRecursoAuthorizationService } from '../src/modules/projetos/projeto-recurso-authorization.service';
import { ProjetoRecursoHierarquiaService } from '../src/modules/projetos/projeto-recurso-hierarquia.service';
import { ProjetosService } from '../src/modules/projetos/projetos.service';

type Registro = Record<string, any>;

const pessoa = (sub: string, login: string) => ({ sub, login, nome: login, email: `${login}@orfeu.local`, padraoSistema: false, empresaId: 10 });
const gestora = pessoa('11111111-1111-4111-8111-111111111111', 'gestora');
const analista = pessoa('22222222-2222-4222-8222-222222222222', 'analista');
const PROJETO_ID = '44444444-4444-4444-8444-444444444444';
const PROJETO_DE_OUTRA_EMPRESA_ID = '55555555-5555-4555-8555-555555555555';
const APONTAMENTO_REPETIDO_ID = '66666666-6666-4666-8666-666666666666';
const HORAS = 'horas-do-projeto';
const ORCAMENTO = 'orcamento-do-projeto';

class HorasTestJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: true, secretOrKey: 'horas-test-secret' });
  }

  validate(payload: Record<string, unknown>) {
    return payload;
  }
}

/**
 * Persistência mínima para a borda GraphQL: igualdade, `in`, faixas, `AND`, `OR` e `some`, chaves compostas e
 * `increment`. As regras completas são provadas na integração com o Prisma em memória.
 */
function criarPersistencia() {
  const usuarios = new Map([gestora, analista].map((dono) => [dono.sub, { id: dono.sub, nome: dono.nome, login: dono.login, email: dono.email }]));
  const linha = {
    id: 'linha-analista', recursoId: 'vinculo-analista', itemId: null, descricao: 'Análise', quantidadeMinutos: 600,
    taxaHora: '120.0000', valorPlanejado: '1200.00', taxas: [], item: null,
    recurso: { cadastro: { usuario: usuarios.get(analista.sub) } }
  };
  const dados = {
    projetos: [
      {
        id: PROJETO_ID, empresaId: 10, chave: 'HRS', nome: 'Projeto de horas', situacao: 'EM_ANDAMENTO', arquivadoEm: null,
        responsavelId: gestora.sub,
        membros: [{ usuarioId: analista.sub, papel: 'MEMBRO', usuario: usuarios.get(analista.sub) }]
      },
      { id: PROJETO_DE_OUTRA_EMPRESA_ID, empresaId: 20, chave: 'EXT', nome: 'Projeto externo', situacao: 'EM_ANDAMENTO', arquivadoEm: null, responsavelId: gestora.sub, membros: [] }
    ] as Registro[],
    apontamentos: [] as Registro[],
    periodos: [] as Registro[],
    operacoes: [] as Registro[],
    eventos: [] as Registro[],
    recursos: [{ id: 'recurso-analista', empresaId: 10, usuarioId: analista.sub, ativo: true, capacitacao: null }] as Registro[],
    vinculos: [{ id: 'vinculo-analista', projetoId: PROJETO_ID, recursoId: 'recurso-analista' }] as Registro[],
    custos: [{ ...linha, projetoId: PROJETO_ID, orcamentoId: 'orcamento-1', tipo: 'RECURSO' }] as Registro[],
    orcamentos: [{ id: 'orcamento-1', projetoId: PROJETO_ID, moeda: 'BRL', custos: [linha] }] as Registro[]
  };
  const atende = (registro: Registro, where: Registro = {}): boolean => Object.entries(where).every(([campo, condicao]) => {
    if (campo === 'AND') return (condicao as Registro[]).every((parte) => atende(registro, parte));
    if (campo === 'OR') return (condicao as Registro[]).some((parte) => atende(registro, parte));
    const valor = registro[campo];
    if (condicao instanceof Date) return valor instanceof Date && valor.getTime() === condicao.getTime();
    if (condicao === null || typeof condicao !== 'object') return valor === condicao;
    if ('some' in condicao) return Array.isArray(valor) && valor.some((item) => atende(item, condicao.some));
    if ('in' in condicao) return condicao.in.includes(valor);
    if (!('gte' in condicao) && !('lte' in condicao) && !('lt' in condicao)) {
      throw new Error(`Filtro não suportado pela persistência do teste: ${campo}`);
    }
    return (!('gte' in condicao) || valor >= condicao.gte) && (!('lte' in condicao) || valor <= condicao.lte) && (!('lt' in condicao) || valor < condicao.lt);
  });
  const aplicar = (registro: Registro, alteracoes: Registro) => {
    for (const [campo, valor] of Object.entries(alteracoes)) {
      registro[campo] = valor !== null && typeof valor === 'object' && 'increment' in valor ? registro[campo] + valor.increment : valor;
    }
    registro.atualizadoEm = new Date();
  };
  const tabela = (registros: Registro[], comRelacoes: (registro: Registro) => Registro = (registro) => registro) => ({
    findFirst: jest.fn(async ({ where }: Registro = {}) => {
      const registro = registros.find((candidato) => atende(candidato, where));
      return registro ? comRelacoes(registro) : null;
    }),
    findUnique: jest.fn(async ({ where }: Registro) => {
      const registro = registros.find((candidato) => atende(candidato, where));
      return registro ? comRelacoes(registro) : null;
    }),
    findMany: jest.fn(async ({ where, skip = 0, take }: Registro = {}) => registros
      .filter((candidato) => atende(candidato, where))
      .slice(skip, take === undefined ? undefined : skip + take)
      .map(comRelacoes)),
    count: jest.fn(async ({ where }: Registro = {}) => registros.filter((candidato) => atende(candidato, where)).length),
    create: jest.fn(async ({ data }: Registro) => {
      const criado = { id: randomUUID(), versao: 1, criadoEm: new Date(), atualizadoEm: new Date(), ...data };
      registros.push(criado);
      return comRelacoes(criado);
    }),
    update: jest.fn(async ({ where, data }: Registro) => {
      const registro = registros.find((candidato) => atende(candidato, where)) as Registro;
      aplicar(registro, data);
      return registro;
    }),
    updateMany: jest.fn(async ({ where, data }: Registro) => {
      const alvos = registros.filter((candidato) => atende(candidato, where));
      alvos.forEach((registro) => aplicar(registro, data));
      return { count: alvos.length };
    })
  });
  // Chaves compostas do Prisma viram igualdade simples sobre os campos delas.
  const semChaveComposta = (delegate: ReturnType<typeof tabela>) => {
    const findUnique = delegate.findUnique;
    delegate.findUnique = jest.fn(async ({ where, ...resto }: Registro) => findUnique({
      ...resto,
      where: Object.assign({}, ...Object.entries(where).map(([chave, valor]) => (chave.includes('_') ? valor : { [chave]: valor })))
    }));
    return delegate;
  };

  const prisma = {
    projeto: tabela(dados.projetos),
    projetoApontamento: tabela(dados.apontamentos, (registro) => ({
      ...registro,
      usuario: usuarios.get(registro.usuarioId),
      item: null,
      decididoPor: registro.decididoPorId ? usuarios.get(registro.decididoPorId) : null
    })),
    projetoApontamentoPeriodo: semChaveComposta(tabela(dados.periodos, (registro) => ({
      ...registro,
      fechadoPor: usuarios.get(registro.fechadoPorId) ?? null,
      reabertoPor: registro.reabertoPorId ? usuarios.get(registro.reabertoPorId) ?? null : null
    }))),
    projetoOperacaoIdempotente: semChaveComposta(tabela(dados.operacoes)),
    projetoEvento: tabela(dados.eventos),
    recurso: semChaveComposta(tabela(dados.recursos)),
    projetoRecurso: tabela(dados.vinculos),
    projetoCusto: tabela(dados.custos),
    projetoOrcamento: tabela(dados.orcamentos),
    $transaction: jest.fn((operacao: (tx: unknown) => Promise<unknown>): Promise<unknown> => operacao(prisma))
  };

  return { prisma, dados };
}

describe('Horas do projeto GraphQL e2e', () => {
  let app: INestApplication;
  let tokenDaGestora: string;
  let tokenDaAnalista: string;
  const acessos = new Map<string, Set<string>>();
  const permitir = (dono: { sub: string }, funcionalidade: string, acoes: string[]) =>
    acoes.forEach((acao) => acessos.set(dono.sub, (acessos.get(dono.sub) ?? new Set()).add(`${funcionalidade}:${acao}`)));
  const funcionalidadeAuthorization = {
    isSystemAdmin: (user?: { padraoSistema?: boolean | null } | null) => user?.padraoSistema === true,
    assertFeatureAction: jest.fn(async (user: { sub: string }, solucao: string, funcionalidade: string, acao: string) => {
      if (solucao !== 'projetos' || !acessos.get(user.sub)?.has(`${funcionalidade}:${acao}`)) {
        throw new ForbiddenException('Usuario sem permissao para executar esta acao.');
      }
    })
  };
  const { prisma, dados } = criarPersistencia();

  beforeAll(async () => {
    const persistencia = prisma as never;
    const projetoAuthorization = new ProjetoAuthorizationService(funcionalidadeAuthorization as never);
    const periodo = new ProjetoPeriodoService();
    const auditoria = new ProjetoAuditoriaService();
    const autorizacao = new ProjetoApontamentoAuthorizationService(
      persistencia,
      projetoAuthorization,
      new ProjetoRecursoHierarquiaService(persistencia, new ProjetoRecursoAuthorizationService(persistencia, projetoAuthorization)),
      new ProjetoOrcamentoAuthorizationService(persistencia, projetoAuthorization)
    );
    const periodos = new ProjetoApontamentoPeriodoService(persistencia, periodo, autorizacao, auditoria);
    const consultas = new ProjetoHorasQueryService(persistencia, autorizacao, periodo, periodos);
    const custos = new ProjetoApontamentoCustoService(persistencia, autorizacao, periodo, auditoria);
    const aprovacao = new ProjetoApontamentoAprovacaoService(
      persistencia, autorizacao, consultas, periodos, custos, new ProjetoIdempotenciaService(), auditoria
    );
    const naoUsado = {} as never;
    const projetosService = new ProjetosService(
      naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado,
      naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado, naoUsado,
      consultas, aprovacao, periodos, custos
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
      providers: [ProjetoApontamentoResolver, GqlAuthGuard, HorasTestJwtStrategy, { provide: ProjetosService, useValue: projetosService }]
    }).compile();

    app = fixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    const jwt = new JwtService({ secret: 'horas-test-secret' });
    tokenDaGestora = jwt.sign(gestora);
    tokenDaAnalista = jwt.sign(analista);
  });

  afterAll(async () => app.close());

  beforeEach(() => {
    jest.clearAllMocks();
    acessos.clear();
    for (const tabela of [dados.apontamentos, dados.periodos, dados.operacoes, dados.eventos]) tabela.length = 0;
  });

  const gql = (token: string, query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/graphql').set('Authorization', `Bearer ${token}`).send({ query, variables });
  const enviado = (autor: { sub: string }, dadosDoApontamento: Registro = {}) => {
    const apontamento = {
      id: randomUUID(), empresaId: 10, projetoId: PROJETO_ID, usuarioId: autor.sub, itemId: null,
      dataTrabalho: new Date('2026-09-15T00:00:00.000Z'), minutos: 90, descricao: 'Desenvolvimento da entrega', faturavel: true,
      status: 'ENVIADO', enviadoEm: new Date(), decididoPorId: null, decididoEm: null, motivo: null,
      custoId: null, taxaHistoricoId: null, taxaHoraAplicada: null, valorCusto: null, moeda: null, custoSituacao: 'NAO_APLICAVEL',
      arquivadoEm: null, arquivadoPorId: null, versao: 2, criadoEm: new Date(), atualizadoEm: new Date(),
      ...dadosDoApontamento
    };
    dados.apontamentos.push(apontamento);
    return apontamento;
  };
  const APROVAR = `mutation Aprovar($input: AprovarProjetoApontamentosInput!) {
    aprovarProjetoApontamentos(input: $input) {
      id status versao usuario { id } decididoPor { id }
      acoes { podeAprovar podeRejeitar podeReabrir bloqueio }
      custo { situacao custoId taxaHoraAplicada valorCusto moeda }
    }
  }`;
  const REJEITAR = `mutation Rejeitar($input: RejeitarProjetoApontamentosInput!) {
    rejeitarProjetoApontamentos(input: $input) { id status motivo }
  }`;
  const HORAS_DO_PROJETO = `query Horas($filtro: ProjetoHorasFiltroInput!) {
    projetoHoras(filtro: $filtro) {
      total totalMinutos
      items { id status usuario { id } custo { situacao valorCusto } }
      totaisPorUsuario { usuario { id } minutos }
      competencias { competencia fechada enviadosPendentes podeFechar podeReabrir bloqueio }
      permissoes { podeAprovar podeReabrir podeFecharPeriodo podeVisualizarFinanceiro podeGerenciarFinanceiro }
      financeiro { moeda totalCusto apontamentosSemCusto linhas { custoId minutosAprovados valorRealizadoHoras } }
    }
  }`;
  const COMPETENCIA = `mutation Competencia($input: FecharProjetoApontamentoPeriodoInput!) {
    fecharProjetoApontamentoPeriodo(input: $input) { competencia fechada situacao versao fechadoPor { id } podeReabrir }
  }`;
  const filtro = { projetoId: PROJETO_ID, inicio: '2026-09-01', fim: '2026-09-30' };
  const lote = (apontamentos: Array<{ id: string; versao: number }>, chaveIdempotencia: string = randomUUID()) =>
    ({ projetoId: PROJETO_ID, apontamentos, chaveIdempotencia });

  it('aprova em lote pela borda GraphQL e devolve o custo so para quem ve o financeiro', async () => {
    permitir(gestora, HORAS, ['visualizar', 'aprovar_horas']);
    permitir(gestora, ORCAMENTO, ['visualizar_financeiro']);
    permitir(analista, HORAS, ['visualizar']);
    const daAnalista = enviado(analista);

    const aprovado = await gql(tokenDaGestora, APROVAR, { input: lote([{ id: daAnalista.id, versao: 2 }]) }).expect(200);
    expect(aprovado.body.errors).toBeUndefined();
    expect(aprovado.body.data.aprovarProjetoApontamentos).toEqual([{
      id: daAnalista.id,
      status: 'APROVADO',
      versao: 3,
      usuario: { id: analista.sub },
      decididoPor: { id: gestora.sub },
      acoes: { podeAprovar: false, podeRejeitar: false, podeReabrir: false, bloqueio: null },
      custo: { situacao: 'CALCULADO', custoId: 'linha-analista', taxaHoraAplicada: '120.0000', valorCusto: '180.00', moeda: 'BRL' }
    }]);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });

    const daGestora = await gql(tokenDaGestora, HORAS_DO_PROJETO, { filtro }).expect(200);
    expect(daGestora.body.errors).toBeUndefined();
    expect(daGestora.body.data.projetoHoras).toMatchObject({
      total: 1,
      totalMinutos: 90,
      items: [{ id: daAnalista.id, status: 'APROVADO', custo: { situacao: 'CALCULADO', valorCusto: '180.00' } }],
      competencias: [{ competencia: '2026-09', fechada: false, enviadosPendentes: 0, podeFechar: false, podeReabrir: false, bloqueio: null }],
      permissoes: { podeAprovar: true, podeReabrir: false, podeFecharPeriodo: false, podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: false },
      financeiro: { moeda: 'BRL', totalCusto: '180.00', apontamentosSemCusto: 0, linhas: [{ custoId: 'linha-analista', minutosAprovados: 90, valorRealizadoHoras: '180.00' }] }
    });

    const daAnalistaSemFinanceiro = await gql(tokenDaAnalista, HORAS_DO_PROJETO, { filtro }).expect(200);
    expect(daAnalistaSemFinanceiro.body.errors).toBeUndefined();
    expect(daAnalistaSemFinanceiro.body.data.projetoHoras).toMatchObject({
      items: [{ id: daAnalista.id, usuario: { id: analista.sub }, custo: null }],
      permissoes: { podeAprovar: false, podeVisualizarFinanceiro: false },
      financeiro: null
    });
  });

  it('rejeita com motivo e fecha a competencia pela borda GraphQL', async () => {
    permitir(gestora, HORAS, ['visualizar', 'aprovar_horas', 'fechar_periodo']);
    const daAnalista = enviado(analista);

    const rejeitado = await gql(tokenDaGestora, REJEITAR, {
      input: { ...lote([{ id: daAnalista.id, versao: 2 }]), motivo: '  Descreva a entrega revisada.  ' }
    }).expect(200);
    expect(rejeitado.body.errors).toBeUndefined();
    expect(rejeitado.body.data.rejeitarProjetoApontamentos).toEqual([{ id: daAnalista.id, status: 'REJEITADO', motivo: 'Descreva a entrega revisada.' }]);

    const fechada = await gql(tokenDaGestora, COMPETENCIA, { input: { projetoId: PROJETO_ID, competencia: '2026-09' } }).expect(200);
    expect(fechada.body.errors).toBeUndefined();
    expect(fechada.body.data.fecharProjetoApontamentoPeriodo).toEqual({
      competencia: '2026-09', fechada: true, situacao: 'FECHADO', versao: 1, fechadoPor: { id: gestora.sub }, podeReabrir: true
    });
  });

  it('lista os projetos, reabre o aprovado e a competencia e recalcula os custos pela borda GraphQL', async () => {
    permitir(gestora, HORAS, ['visualizar', 'reabrir_horas', 'fechar_periodo']);
    permitir(gestora, ORCAMENTO, ['visualizar', 'gerenciar_financeiro']);
    const aprovado = enviado(analista, {
      status: 'APROVADO', versao: 3, custoSituacao: 'CALCULADO', custoId: 'linha-analista', taxaHoraAplicada: '120.0000', valorCusto: '180.00', moeda: 'BRL'
    });
    const semTaxa = enviado(analista, { status: 'APROVADO', versao: 3, custoSituacao: 'SEM_TAXA', dataTrabalho: new Date('2026-09-16T00:00:00.000Z') });

    const projetos = await gql(tokenDaGestora, 'query { projetoHorasProjetos(incluirArquivados: true) { id chave } }').expect(200);
    expect(projetos.body).toEqual({ data: { projetoHorasProjetos: [{ id: PROJETO_ID, chave: 'HRS' }] } });

    const reaberto = await gql(tokenDaGestora, `mutation Reabrir($input: ReabrirProjetoApontamentoInput!) {
      reabrirProjetoApontamento(input: $input) { id status versao motivo custo { situacao } }
    }`, { input: { projetoId: PROJETO_ID, id: aprovado.id, versao: 3, motivo: '  Data lançada errada.  ' } }).expect(200);
    expect(reaberto.body).toEqual({
      data: { reabrirProjetoApontamento: { id: aprovado.id, status: 'RASCUNHO', versao: 4, motivo: 'Data lançada errada.', custo: null } }
    });
    expect(aprovado).toMatchObject({ custoSituacao: 'NAO_APLICAVEL', custoId: null, taxaHoraAplicada: null, valorCusto: null, moeda: null });

    const recalculo = await gql(tokenDaGestora, `mutation Recalcular($input: RecalcularCustoProjetoApontamentosInput!) {
      recalcularCustoProjetoApontamentos(input: $input) { calculados pendentes }
    }`, { input: { projetoId: PROJETO_ID } }).expect(200);
    expect(recalculo.body).toEqual({ data: { recalcularCustoProjetoApontamentos: { calculados: 1, pendentes: 0 } } });
    expect(semTaxa).toMatchObject({ custoSituacao: 'CALCULADO', custoId: 'linha-analista', valorCusto: '180.00', moeda: 'BRL', versao: 4 });

    const fechada = await gql(tokenDaGestora, COMPETENCIA, { input: { projetoId: PROJETO_ID, competencia: '2026-09' } }).expect(200);
    expect(fechada.body.data.fecharProjetoApontamentoPeriodo).toMatchObject({ fechada: true, versao: 1 });
    const reaberta = await gql(tokenDaGestora, `mutation ReabrirCompetencia($input: ReabrirProjetoApontamentoPeriodoInput!) {
      reabrirProjetoApontamentoPeriodo(input: $input) { competencia fechada situacao versao reabertoPor { id } motivoReabertura podeFechar }
    }`, { input: { projetoId: PROJETO_ID, competencia: '2026-09', versao: 1, motivo: 'Ajuste das horas da equipe.' } }).expect(200);
    expect(reaberta.body).toEqual({
      data: {
        reabrirProjetoApontamentoPeriodo: {
          competencia: '2026-09',
          fechada: false,
          situacao: 'REABERTO',
          versao: 2,
          reabertoPor: { id: gestora.sub },
          motivoReabertura: 'Ajuste das horas da equipe.',
          podeFechar: true
        }
      }
    });
  });

  it('nega a autoaprovacao, o apontamento fora do escopo, a chamada sem a acao, outra empresa e sem sessao', async () => {
    const daGestora = enviado(gestora);
    const semAcao = await gql(tokenDaGestora, APROVAR, { input: lote([{ id: daGestora.id, versao: 2 }]) }).expect(200);
    expect(semAcao.body.errors?.[0]).toMatchObject({ message: 'Usuario sem permissao para executar esta acao.', extensions: { code: 'FORBIDDEN' } });
    expect(prisma.projeto.findFirst).not.toHaveBeenCalled();

    permitir(gestora, HORAS, ['visualizar', 'aprovar_horas']);
    permitir(analista, HORAS, ['visualizar', 'aprovar_horas']);
    const autoaprovacao = await gql(tokenDaGestora, APROVAR, { input: lote([{ id: daGestora.id, versao: 2 }]) }).expect(200);
    expect(autoaprovacao.body.errors?.[0]).toMatchObject({ message: 'Você não pode aprovar os próprios apontamentos.', extensions: { code: 'FORBIDDEN' } });
    const foraDoEscopo = await gql(tokenDaAnalista, APROVAR, { input: lote([{ id: daGestora.id, versao: 2 }]) }).expect(200);
    expect(foraDoEscopo.body.errors?.[0]).toMatchObject({ message: 'Apontamento não encontrado.', extensions: { status: 404 } });
    const deOutraEmpresa = await gql(tokenDaGestora, APROVAR, {
      input: { ...lote([{ id: daGestora.id, versao: 2 }]), projetoId: PROJETO_DE_OUTRA_EMPRESA_ID }
    }).expect(200);
    expect(deOutraEmpresa.body.errors?.[0]).toMatchObject({ message: 'Projeto nao encontrado.', extensions: { status: 404 } });
    expect(prisma.projetoApontamento.updateMany).not.toHaveBeenCalled();
    expect(dados.apontamentos[0]).toMatchObject({ status: 'ENVIADO', versao: 2 });

    const anonimo = await request(app.getHttpServer()).post('/graphql').send({ query: '{ projetoHorasProjetos { id } }' }).expect(200);
    expect(anonimo.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('recusa a rejeicao sem motivo pelo proprio contrato GraphQL', async () => {
    const resposta = await gql(tokenDaGestora, REJEITAR, { input: lote([{ id: randomUUID(), versao: 1 }]) });

    expect(resposta.body.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
    expect(funcionalidadeAuthorization.assertFeatureAction).not.toHaveBeenCalled();
  });

  it.each([
    ['motivo curto na rejeicao', REJEITAR, { input: { ...lote([{ id: randomUUID(), versao: 1 }]), motivo: 'abcd' } }, 'BAD_REQUEST'],
    ['motivo acima de 500 caracteres', REJEITAR, { input: { ...lote([{ id: randomUUID(), versao: 1 }]), motivo: 'a'.repeat(501) } }, 'BAD_REQUEST'],
    ['lote vazio', APROVAR, { input: lote([]) }, 'BAD_REQUEST'],
    ['lote acima de 100 apontamentos', APROVAR, { input: lote(Array.from({ length: 101 }, () => ({ id: randomUUID(), versao: 1 }))) }, 'BAD_REQUEST'],
    ['o mesmo apontamento duas vezes', APROVAR, {
      input: lote([{ id: APONTAMENTO_REPETIDO_ID, versao: 1 }, { id: APONTAMENTO_REPETIDO_ID, versao: 2 }])
    }, 'BAD_REQUEST'],
    ['versao zero', APROVAR, { input: lote([{ id: randomUUID(), versao: 0 }]) }, 'BAD_REQUEST'],
    ['chave de idempotencia vazia', APROVAR, { input: lote([{ id: randomUUID(), versao: 1 }], '') }, 'BAD_REQUEST'],
    ['chave de idempotencia acima de 100 caracteres', APROVAR, { input: lote([{ id: randomUUID(), versao: 1 }], 'k'.repeat(101)) }, 'BAD_REQUEST'],
    ['projeto sem identificador valido', APROVAR, { input: { ...lote([{ id: randomUUID(), versao: 1 }]), projetoId: 'projeto-1' } }, 'BAD_REQUEST'],
    ['competencia com mes invalido', COMPETENCIA, { input: { projetoId: PROJETO_ID, competencia: '2026-13' } }, 'BAD_REQUEST'],
    ['competencia fora do formato', COMPETENCIA, { input: { projetoId: PROJETO_ID, competencia: '09/2026' } }, 'BAD_REQUEST'],
    ['pagina zero', HORAS_DO_PROJETO, { filtro: { ...filtro, pagina: 0 } }, 'BAD_REQUEST'],
    ['limite acima de 100', HORAS_DO_PROJETO, { filtro: { ...filtro, limite: 101 } }, 'BAD_REQUEST'],
    ['pessoa sem identificador valido', HORAS_DO_PROJETO, { filtro: { ...filtro, usuarioId: 'pessoa-1' } }, 'BAD_REQUEST'],
    ['faturavel que nao e booleano', HORAS_DO_PROJETO, { filtro: { ...filtro, faturavel: 'sim' } }, 'BAD_USER_INPUT'],
    ['situacao desconhecida', HORAS_DO_PROJETO, { filtro: { ...filtro, status: 'PAGO' } }, 'BAD_USER_INPUT']
  ])('recusa %s antes de chegar ao servico', async (_caso, documento, variaveis, codigo) => {
    const resposta = await gql(tokenDaGestora, documento, variaveis);

    expect(resposta.body.errors?.[0]?.extensions?.code).toBe(codigo);
    expect(funcionalidadeAuthorization.assertFeatureAction).not.toHaveBeenCalled();
  });

  it.each([
    ['reabertura de apontamento sem motivo', `mutation { reabrirProjetoApontamento(input: { projetoId: "${PROJETO_ID}", id: "${APONTAMENTO_REPETIDO_ID}", versao: 1 }) { id } }`],
    ['reabertura de competencia sem versao', `mutation { reabrirProjetoApontamentoPeriodo(input: { projetoId: "${PROJETO_ID}", competencia: "2026-09", motivo: "Ajuste das horas." }) { competencia } }`],
    ['recalculo sem projeto', 'mutation { recalcularCustoProjetoApontamentos(input: {}) { calculados } }']
  ])('recusa %s pelo proprio contrato GraphQL', async (_caso, documento) => {
    const resposta = await gql(tokenDaGestora, documento);

    expect(resposta.body.errors?.[0]?.extensions?.code).toBe('GRAPHQL_VALIDATION_FAILED');
    expect(funcionalidadeAuthorization.assertFeatureAction).not.toHaveBeenCalled();
  });
});
