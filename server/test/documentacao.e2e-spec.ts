import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as request from 'supertest';
import { GqlAuthGuard } from '../src/modules/auth/guards/gql-auth.guard';
import { DocumentacaoResolver } from '../src/modules/documentacao/documentacao.resolver';
import { DocumentacaoService } from '../src/modules/documentacao/documentacao.service';

const testUser = {
  sub: '77777777-7777-4777-8777-777777777777',
  login: 'leitor.docs',
  email: 'leitor.docs@orfeu.test',
  empresaId: 10
};

class TestJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: true, secretOrKey: 'docs-test-secret' });
  }
  validate(payload: Record<string, unknown>) {
    return { ...testUser, ...payload };
  }
}

const metadata = {
  id: 'solucoes.projetos.backlog-visao-geral',
  slug: 'backlog-visao-geral',
  titulo: 'Backlog de demandas',
  resumo: 'Como trabalhar com demandas.',
  categoria: 'solucao',
  audiencia: 'usuario',
  ordem: 20,
  validadoEm: '2026-08-10',
  palavrasChave: ['backlog', 'demanda'],
  solucao: 'projetos',
  funcionalidade: 'backlog-de-demandas',
  registryKey: 'projetos.backlog-de-demandas'
};

describe('Documentacao GraphQL e2e', () => {
  let app: INestApplication;
  let authToken: string;
  const serviceMock = {
    indice: jest.fn(),
    artigo: jest.fn(),
    buscar: jest.fn()
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          context: ({ req, res }: { req: Request; res: Response }) => ({ req, res })
        })
      ],
      providers: [
        DocumentacaoResolver,
        GqlAuthGuard,
        TestJwtStrategy,
        { provide: DocumentacaoService, useValue: serviceMock }
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    authToken = new JwtService({ secret: 'docs-test-secret' }).sign(testUser);
  });

  afterAll(async () => app.close());

  beforeEach(() => {
    jest.clearAllMocks();
    serviceMock.indice.mockResolvedValue([metadata]);
    serviceMock.artigo.mockResolvedValue({ ...metadata, conteudo: '# Backlog de demandas' });
    serviceMock.buscar.mockResolvedValue([{ ...metadata, trecho: 'Organize a prioridade das demandas.' }]);
  });

  it('exige autenticacao em todas as consultas de documentacao', async () => {
    const response = await request(app.getHttpServer()).post('/graphql').send({ query: '{ documentacaoIndice { slug } }' });
    expect(response.body.data).toBeNull();
    expect(response.body.errors?.[0]?.message).toContain('Unauthorized');
    expect(serviceMock.indice).not.toHaveBeenCalled();
  });

  it('expõe indice, artigo e busca pela borda GraphQL autenticada', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `query Docs($slug: String!, $termo: String!) {
          documentacaoIndice(filtro: { solucao: "projetos" }) { slug registryKey }
          documentacaoArtigo(slug: $slug) { slug conteudo }
          buscarDocumentacao(termo: $termo) { slug trecho }
        }`,
        variables: { slug: 'backlog-visao-geral', termo: 'prioridade' }
      });

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toEqual({
      documentacaoIndice: [{ slug: 'backlog-visao-geral', registryKey: 'projetos.backlog-de-demandas' }],
      documentacaoArtigo: { slug: 'backlog-visao-geral', conteudo: '# Backlog de demandas' },
      buscarDocumentacao: [{ slug: 'backlog-visao-geral', trecho: 'Organize a prioridade das demandas.' }]
    });
    expect(serviceMock.indice).toHaveBeenCalledWith(expect.objectContaining({ login: 'leitor.docs' }), { solucao: 'projetos' });
    expect(serviceMock.artigo).toHaveBeenCalledWith('backlog-visao-geral', expect.objectContaining({ empresaId: 10 }));
    expect(serviceMock.buscar).toHaveBeenCalledWith('prioridade', expect.objectContaining({ empresaId: 10 }), undefined);
  });
});
