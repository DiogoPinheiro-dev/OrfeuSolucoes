import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request, Response } from 'express';
import * as request from 'supertest';
import { HealthResolver } from '../src/health.resolver';
import { GqlAuthGuard } from '../src/modules/auth/guards/gql-auth.guard';
import { ChamadosController } from '../src/modules/chamados/chamados.controller';
import { ChamadosResolver } from '../src/modules/chamados/chamados.resolver';
import { ChamadosService } from '../src/modules/chamados/chamados.service';

const testUser = {
  sub: '11111111-1111-4111-8111-111111111111',
  login: 'tester',
  nome: 'Usuaria Teste',
  email: 'teste@orfeu.local',
  empresaId: 10
};

class TestJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: 'test-secret'
    });
  }

  validate(payload: Record<string, unknown>) {
    return {
      ...testUser,
      ...payload
    };
  }
}

const buildChamado = (overrides: Record<string, unknown> = {}) => ({
  id: '22222222-2222-4222-8222-222222222222',
  numero: 1001,
  empresaId: 10,
  solicitanteId: testUser.sub,
  solicitanteNome: testUser.nome,
  responsavelId: null,
  responsavelNome: null,
  responsavelGrupoId: null,
  responsavelGrupoNome: null,
  liderAtendimentoId: null,
  liderAtendimentoNome: null,
  atendimentoAssumidoEm: null,
  categoriaId: null,
  categoriaNome: null,
  solucaoId: 77,
  solucaoNome: 'Controle de Chamados',
  funcionalidadeId: 88,
  funcionalidadeNome: 'Abrir chamado',
  titulo: 'Notebook sem rede',
  descricao: 'Chamado criado pela borda GraphQL.',
  tipoId: 1,
  tipoNome: 'Incidente',
  tipoCor: '#ff9900',
  prioridadeId: 2,
  prioridadeNome: 'Alta',
  prioridadeCor: '#ff3300',
  slaRegraId: null,
  status: 'ABERTO',
  criadoEm: new Date('2026-07-13T12:00:00.000Z'),
  atualizadoEm: new Date('2026-07-13T12:05:00.000Z'),
  primeiraRespostaEm: null,
  primeiraRespostaLimiteEm: null,
  resolvidoEm: null,
  resolucaoLimiteEm: null,
  slaPausadoEm: null,
  slaTempoPausadoMinutos: 0,
  slaStatus: 'SEM_SLA',
  encerradoEm: null,
  versao: 1,
  mensagens: [],
  anexos: [],
  acompanhantes: [],
  historico: [],
  ...overrides
});

const buildTipo = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  empresaId: 10,
  nome: 'Incidente',
  descricao: 'Incidente operacional',
  cor: '#ff9900',
  ordem: 1,
  ativo: true,
  criadoEm: new Date('2026-07-13T12:00:00.000Z'),
  atualizadoEm: new Date('2026-07-13T12:00:00.000Z'),
  ...overrides
});

const buildSlaRegra = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  empresaId: 10,
  prioridadeId: 2,
  prioridadeNome: 'Alta',
  primeiraRespostaPrazoMinutos: 120,
  resolucaoPrazoMinutos: 480,
  modoContagem: 'CORRIDO',
  ativo: true,
  criadoEm: new Date('2026-07-13T12:00:00.000Z'),
  atualizadoEm: new Date('2026-07-13T12:00:00.000Z'),
  ...overrides
});

const buildPrioridade = (overrides: Record<string, unknown> = {}) => ({
  id: 2,
  empresaId: 10,
  nome: 'Alta',
  descricao: 'Resposta rapida',
  cor: '#ff3300',
  ordem: 2,
  ativo: true,
  criadoEm: new Date('2026-07-13T12:00:00.000Z'),
  atualizadoEm: new Date('2026-07-13T12:00:00.000Z'),
  ...overrides
});

describe('Chamados GraphQL e HTTP e2e', () => {
  let app: INestApplication;
  let authToken: string;
  let downloadDir: string;
  let downloadPath: string;

  const chamadosServiceMock = {
    tiposChamado: jest.fn(),
    prioridadesChamado: jest.fn(),
    criarChamado: jest.fn(),
    createTipo: jest.fn(),
    updateTipo: jest.fn(),
    createPrioridade: jest.fn(),
    updatePrioridade: jest.fn(),
    regrasSlaChamado: jest.fn(),
    createRegraSla: jest.fn(),
    updateRegraSla: jest.fn(),
    deleteRegraSla: jest.fn(),
    filaChamados: jest.fn(),
    notificacoesChamado: jest.fn(),
    notificacoesNaoLidas: jest.fn(),
    marcarNotificacaoComoLida: jest.fn(),
    marcarTodasNotificacoesComoLidas: jest.fn(),
    adicionarAnexos: jest.fn(),
    prepararDownloadAnexo: jest.fn()
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    downloadDir = join(tmpdir(), 'orfeu-chamados-e2e');
    mkdirSync(downloadDir, { recursive: true });
    downloadPath = join(downloadDir, 'evidencia.txt');
    writeFileSync(downloadPath, 'conteudo do anexo');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          context: ({ req, res }: { req: Request; res: Response }) => ({ req, res })
        })
      ],
      controllers: [ChamadosController],
      providers: [
        HealthResolver,
        ChamadosResolver,
        GqlAuthGuard,
        TestJwtStrategy,
        {
          provide: ChamadosService,
          useValue: chamadosServiceMock
        }
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );
    await app.init();

    authToken = new JwtService({ secret: 'test-secret' }).sign(testUser);
  });

  afterAll(async () => {
    await app.close();
    rmSync(downloadDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    chamadosServiceMock.tiposChamado.mockResolvedValue([buildTipo()]);
    chamadosServiceMock.prioridadesChamado.mockResolvedValue([buildPrioridade()]);
    chamadosServiceMock.criarChamado.mockResolvedValue(buildChamado());
    chamadosServiceMock.createTipo.mockImplementation(async (input: Record<string, unknown>) => buildTipo({ id: 5, ...input }));
    chamadosServiceMock.updateTipo.mockImplementation(async (input: Record<string, unknown>) => buildTipo(input));
    chamadosServiceMock.createPrioridade.mockImplementation(async (input: Record<string, unknown>) => buildPrioridade({ id: 6, ...input }));
    chamadosServiceMock.updatePrioridade.mockImplementation(async (input: Record<string, unknown>) => buildPrioridade(input));
    chamadosServiceMock.regrasSlaChamado.mockResolvedValue([buildSlaRegra()]);
    chamadosServiceMock.createRegraSla.mockImplementation(async (input: Record<string, unknown>) => buildSlaRegra(input));
    chamadosServiceMock.updateRegraSla.mockImplementation(async (input: Record<string, unknown>) => buildSlaRegra(input));
    chamadosServiceMock.deleteRegraSla.mockResolvedValue(true);
    chamadosServiceMock.notificacoesChamado.mockResolvedValue([{
      id: '66666666-6666-4666-8666-666666666666',
      chamadoId: '22222222-2222-4222-8222-222222222222',
      chamadoNumero: 1001,
      chamadoTitulo: 'Notebook sem rede',
      tipo: 'NOVA_RESPOSTA',
      titulo: 'Nova resposta no chamado #1001',
      mensagem: 'Notebook sem rede',
      lidaEm: null,
      criadoEm: new Date('2026-07-13T12:15:00.000Z')
    }]);
    chamadosServiceMock.notificacoesNaoLidas.mockResolvedValue(1);
    chamadosServiceMock.marcarNotificacaoComoLida.mockResolvedValue(true);
    chamadosServiceMock.marcarTodasNotificacoesComoLidas.mockResolvedValue(1);
    chamadosServiceMock.filaChamados.mockResolvedValue({
      items: [buildChamado()],
      total: 1,
      page: 1,
      pageSize: 20
    });
    chamadosServiceMock.adicionarAnexos.mockResolvedValue([
      {
        id: '33333333-3333-4333-8333-333333333333',
        chamadoId: '22222222-2222-4222-8222-222222222222',
        mensagemId: '44444444-4444-4444-8444-444444444444',
        autorId: testUser.sub,
        autorNome: testUser.nome,
        nomeOriginal: 'evidencia.txt',
        mimeType: 'text/plain',
        tamanho: 17,
        downloadUrl: '/chamados/222/anexos/333/download',
        criadoEm: new Date('2026-07-13T12:10:00.000Z')
      }
    ]);
    chamadosServiceMock.prepararDownloadAnexo.mockResolvedValue({
      caminhoAbsoluto: downloadPath,
      nomeOriginal: 'evidencia.txt',
      mimeType: 'text/plain'
    });
  });

  it('health query deve responder ok', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ health }' })
      .expect(200);

    expect(response.body.data.health).toBe('ok');
  });

  it('lista tipos e prioridades via GraphQL', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          query {
            tiposChamado { id nome ativo }
            prioridadesChamado { id nome ativo }
          }
        `
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.tiposChamado).toEqual([{ id: 1, nome: 'Incidente', ativo: true }]);
    expect(response.body.data.prioridadesChamado).toEqual([{ id: 2, nome: 'Alta', ativo: true }]);
  });

  it('abre chamado via mutation GraphQL', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation Abrir($input: CriarChamadoInput!) {
            criarChamado(input: $input) {
              id
              numero
              titulo
              status
            }
          }
        `,
        variables: {
          input: {
            titulo: 'Notebook sem rede',
            descricao: 'Chamado criado pela borda GraphQL.',
            tipoId: 1,
            prioridadeId: 2,
            solucaoId: 77,
            funcionalidadeId: 88
          }
        }
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.criarChamado).toMatchObject({
      id: '22222222-2222-4222-8222-222222222222',
      numero: 1001,
      titulo: 'Notebook sem rede',
      status: 'ABERTO'
    });
    expect(chamadosServiceMock.criarChamado).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: 'Notebook sem rede',
        prioridadeId: 2
      }),
      expect.objectContaining({ sub: testUser.sub, empresaId: testUser.empresaId })
    );
  });

  it('cria e edita tipo e prioridade via GraphQL', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation Configurar(
            $novoTipo: CreateChamadoTipoInput!
            $editarTipo: UpdateChamadoTipoInput!
            $novaPrioridade: CreateChamadoPrioridadeInput!
            $editarPrioridade: UpdateChamadoPrioridadeInput!
          ) {
            createChamadoTipo(input: $novoTipo) { id nome ativo }
            updateChamadoTipo(input: $editarTipo) { id nome ativo }
            createChamadoPrioridade(input: $novaPrioridade) { id nome ativo }
            updateChamadoPrioridade(input: $editarPrioridade) { id nome ativo }
          }
        `,
        variables: {
          novoTipo: { nome: 'Mudanca', descricao: 'Mudanca planejada', cor: '#0055aa', ordem: 3, ativo: true },
          editarTipo: { id: 5, nome: 'Mudanca revisada', ativo: false },
          novaPrioridade: { nome: 'Urgente', descricao: 'Atendimento imediato', cor: '#aa0000', ordem: 4, ativo: true },
          editarPrioridade: { id: 6, nome: 'Urgente revisada', ativo: false }
        }
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createChamadoTipo).toEqual({ id: 5, nome: 'Mudanca', ativo: true });
    expect(response.body.data.updateChamadoTipo).toEqual({ id: 5, nome: 'Mudanca revisada', ativo: false });
    expect(response.body.data.createChamadoPrioridade).toEqual({ id: 6, nome: 'Urgente', ativo: true });
    expect(response.body.data.updateChamadoPrioridade).toEqual({ id: 6, nome: 'Urgente revisada', ativo: false });
  });

  it('lista, cria, edita e desativa regra de SLA via GraphQL', async () => {
    const listResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          query {
            regrasSlaChamado(ativas: false) {
              id
              prioridadeNome
              primeiraRespostaPrazoMinutos
              resolucaoPrazoMinutos
              modoContagem
              ativo
            }
          }
        `
      })
      .expect(200);

    expect(listResponse.body.errors).toBeUndefined();
    expect(listResponse.body.data.regrasSlaChamado).toEqual([{
      id: 7,
      prioridadeNome: 'Alta',
      primeiraRespostaPrazoMinutos: 120,
      resolucaoPrazoMinutos: 480,
      modoContagem: 'CORRIDO',
      ativo: true
    }]);

    const mutationResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation ConfigurarSla(
            $criar: CreateChamadoSlaRegraInput!
            $editar: UpdateChamadoSlaRegraInput!
            $id: Int!
          ) {
            createChamadoSlaRegra(input: $criar) { id prioridadeId modoContagem ativo }
            updateChamadoSlaRegra(input: $editar) { id primeiraRespostaPrazoMinutos resolucaoPrazoMinutos modoContagem }
            deleteChamadoSlaRegra(id: $id)
          }
        `,
        variables: {
          criar: {
            prioridadeId: 2,
            primeiraRespostaPrazoMinutos: 120,
            resolucaoPrazoMinutos: 480,
            modoContagem: 'CORRIDO',
            ativo: true
          },
          editar: {
            id: 7,
            primeiraRespostaPrazoMinutos: 90,
            resolucaoPrazoMinutos: 360,
            modoContagem: 'UTEIS'
          },
          id: 7
        }
      })
      .expect(200);

    expect(mutationResponse.body.errors).toBeUndefined();
    expect(mutationResponse.body.data.createChamadoSlaRegra).toEqual({
      id: 7,
      prioridadeId: 2,
      modoContagem: 'CORRIDO',
      ativo: true
    });
    expect(mutationResponse.body.data.updateChamadoSlaRegra).toEqual({
      id: 7,
      primeiraRespostaPrazoMinutos: 90,
      resolucaoPrazoMinutos: 360,
      modoContagem: 'UTEIS'
    });
    expect(mutationResponse.body.data.deleteChamadoSlaRegra).toBe(true);
  });
  it('aplica filtros do painel via GraphQL', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          query Fila($filtro: ChamadoFiltroInput) {
            filaChamados(filtro: $filtro) {
              total
              page
              pageSize
              items {
                id
                titulo
                status
              }
            }
          }
        `,
        variables: {
          filtro: {
            termo: 'Notebook',
            status: 'EM_TRIAGEM',
            prioridadeId: 2,
            categoriaId: 9,
            responsavelId: '55555555-5555-4555-8555-555555555555',
            responsavelGrupoId: 3,
            solicitanteId: testUser.sub,
            criadoDe: '2026-07-01',
            criadoAte: '2026-07-13',
            somenteAtrasados: true,
            page: 1,
            pageSize: 20
          }
        }
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.filaChamados.total).toBe(1);
    expect(chamadosServiceMock.filaChamados).toHaveBeenCalledWith(
      expect.objectContaining({ sub: testUser.sub, empresaId: testUser.empresaId }),
      expect.objectContaining({
        termo: 'Notebook',
        status: 'EM_TRIAGEM',
        prioridadeId: 2,
        responsavelGrupoId: 3,
        somenteAtrasados: true,
        page: 1,
        pageSize: 20
      })
    );
  });


  it('lista e marca notificacoes internas como lidas via GraphQL', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', 'Bearer ' + authToken)
      .send({
        query: 'query Notificacoes { notificacoesChamado(limite: 20) { id chamadoId tipo titulo lidaEm } notificacoesChamadoNaoLidas }'
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.notificacoesChamadoNaoLidas).toBe(1);
    expect(response.body.data.notificacoesChamado[0].tipo).toBe('NOVA_RESPOSTA');

    const mutationResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', 'Bearer ' + authToken)
      .send({
        query: 'mutation LerNotificacoes($id: String!) { marcarChamadoNotificacaoComoLida(id: $id) marcarTodasChamadoNotificacoesComoLidas }',
        variables: { id: '66666666-6666-4666-8666-666666666666' }
      })
      .expect(200);

    expect(mutationResponse.body.errors).toBeUndefined();
    expect(mutationResponse.body.data.marcarChamadoNotificacaoComoLida).toBe(true);
    expect(mutationResponse.body.data.marcarTodasChamadoNotificacoesComoLidas).toBe(1);
  });
  it('faz upload e download de anexos via HTTP', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/chamados/22222222-2222-4222-8222-222222222222/anexos')
      .set('Authorization', `Bearer ${authToken}`)
      .field('mensagemId', '44444444-4444-4444-8444-444444444444')
      .attach('files', Buffer.from('conteudo do anexo'), {
        filename: 'evidencia.txt',
        contentType: 'text/plain'
      })
      .expect(201);

    expect(uploadResponse.body).toHaveLength(1);
    expect(chamadosServiceMock.adicionarAnexos).toHaveBeenCalledTimes(1);
    expect(chamadosServiceMock.adicionarAnexos.mock.calls[0][0]).toBe('22222222-2222-4222-8222-222222222222');
    expect(chamadosServiceMock.adicionarAnexos.mock.calls[0][2]).toEqual(expect.objectContaining({ sub: testUser.sub }));
    expect(chamadosServiceMock.adicionarAnexos.mock.calls[0][3]).toBe('44444444-4444-4444-8444-444444444444');

    const uploadedFiles = chamadosServiceMock.adicionarAnexos.mock.calls[0][1] as Array<{ originalname: string; mimetype: string }>;
    expect(uploadedFiles[0]).toEqual(expect.objectContaining({ originalname: 'evidencia.txt', mimetype: 'text/plain' }));

    const downloadResponse = await request(app.getHttpServer())
      .get('/chamados/22222222-2222-4222-8222-222222222222/anexos/33333333-3333-4333-8333-333333333333/download')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(chamadosServiceMock.prepararDownloadAnexo).toHaveBeenCalledWith(
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
      expect.objectContaining({ sub: testUser.sub })
    );
    expect(downloadResponse.headers['content-type']).toContain('text/plain');
    expect(downloadResponse.headers['content-disposition']).toContain('attachment');
    expect(downloadResponse.text).toBe('conteudo do anexo');
  });
});
