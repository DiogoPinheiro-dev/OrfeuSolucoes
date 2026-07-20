import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ForbiddenException, INestApplication, ValidationPipe } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as request from 'supertest';
import { GqlAuthGuard } from '../src/modules/auth/guards/gql-auth.guard';
import { ProjetosResolver } from '../src/modules/projetos/projetos.resolver';
import { ProjetosService } from '../src/modules/projetos/projetos.service';

const admin = {
  sub: '11111111-1111-4111-8111-111111111111',
  login: 'admin',
  nome: 'Administrador',
  email: 'admin@orfeu.local',
  empresaId: 10
};
const member = {
  sub: '22222222-2222-4222-8222-222222222222',
  login: 'membro',
  nome: 'Membro',
  email: 'membro@orfeu.local',
  empresaId: 10
};

class ProjectTestJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: 'project-test-secret'
    });
  }

  validate(payload: Record<string, unknown>) {
    return payload;
  }
}

const userType = (user = admin) => ({
  id: user.sub,
  nome: user.nome,
  login: user.login,
  email: user.email,
  grupoId: 1,
  grupoNome: 'Administradores'
});

const buildProject = (overrides: Record<string, unknown> = {}) => ({
  id: '33333333-3333-4333-8333-333333333333',
  empresaId: 10,
  chave: 'ORFEU',
  nome: 'Projeto Orfeu',
  objetivo: 'Validar o cadastro',
  descricao: 'Fluxo E2E GraphQL',
  metodologia: 'KANBAN',
  situacao: 'RASCUNHO',
  saude: 'EM_DIA',
  inicioPrevistoEm: new Date('2026-07-20T00:00:00.000Z'),
  fimPrevistoEm: new Date('2026-08-20T00:00:00.000Z'),
  inicioRealEm: null,
  fimRealEm: null,
  responsavelId: admin.sub,
  responsavel: userType(),
  criadoPor: userType(),
  arquivadoEm: null,
  arquivadoPor: null,
  criadoEm: new Date('2026-07-20T10:00:00.000Z'),
  atualizadoEm: new Date('2026-07-20T10:00:00.000Z'),
  membros: [],
  meuPapel: 'RESPONSAVEL',
  permissoes: {
    podeVisualizar: true,
    podeAlterar: true,
    podeGerenciarMembros: true,
    podeAlterarStatus: true,
    podeArquivar: true,
    podeReativar: true
  },
  ...overrides
});

type ProjectFixture = Omit<ReturnType<typeof buildProject>, 'arquivadoEm' | 'arquivadoPor'> & {
  arquivadoEm: Date | null;
  arquivadoPor: ReturnType<typeof userType> | null;
};

describe('Projetos GraphQL e2e', () => {
  let app: INestApplication;
  let adminToken: string;
  let memberToken: string;
  let project = buildProject() as ProjectFixture;

  const service = {
    sugerirChave: jest.fn(),
    participantesDisponiveis: jest.fn(),
    projetos: jest.fn(),
    projeto: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateEquipe: jest.fn(),
    atualizarCiclo: jest.fn(),
    arquivar: jest.fn(),
    reativar: jest.fn()
  };

  beforeAll(async () => {
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
        ProjetosResolver,
        GqlAuthGuard,
        ProjectTestJwtStrategy,
        { provide: ProjetosService, useValue: service }
      ]
    }).compile();

    app = fixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    const jwt = new JwtService({ secret: 'project-test-secret' });
    adminToken = jwt.sign(admin);
    memberToken = jwt.sign(member);
  });

  afterAll(async () => app.close());

  beforeEach(() => {
    jest.clearAllMocks();
    project = buildProject() as ProjectFixture;
    service.sugerirChave.mockResolvedValue('ORFEU');
    service.participantesDisponiveis.mockResolvedValue([userType(), userType(member)]);
    service.projetos.mockImplementation(async () => ({ items: [project], total: 1, pagina: 1, limite: 20, totalPaginas: 1 }));
    service.projeto.mockImplementation(async () => project);
    service.create.mockImplementation(async (input: Record<string, unknown>) => {
      project = buildProject(input) as ProjectFixture;
      return project;
    });
    service.update.mockImplementation(async (input: Record<string, unknown>) => {
      project = { ...project, ...input };
      return project;
    });
    service.updateEquipe.mockImplementation(async () => project);
    service.atualizarCiclo.mockImplementation(async (input: Record<string, unknown>) => {
      project = { ...project, situacao: String(input.situacao), saude: String(input.saude) };
      return project;
    });
    service.arquivar.mockImplementation(async (_id: string, user: typeof admin) => {
      project = { ...project, arquivadoEm: new Date(), arquivadoPor: userType(user) };
      return project;
    });
    service.reativar.mockImplementation(async () => {
      project = { ...project, arquivadoEm: null, arquivadoPor: null };
      return project;
    });
  });

  const gql = (token: string, query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/graphql').set('Authorization', `Bearer ${token}`).send({ query, variables });

  it('executa a jornada principal de leitura e escrita pela borda GraphQL', async () => {
    const initial = await gql(adminToken, `
      query Inicio($filtro: ProjetoFiltroInput) {
        sugerirChaveProjeto(nome: "Projeto Orfeu")
        projetoParticipantesDisponiveis { id email }
        projetos(filtro: $filtro) { total pagina items { id chave nome situacao saude } }
      }
    `, { filtro: { pagina: 1, limite: 20, incluirArquivados: false } }).expect(200);
    expect(initial.body.errors).toBeUndefined();
    expect(initial.body.data.sugerirChaveProjeto).toBe('ORFEU');
    expect(initial.body.data.projetoParticipantesDisponiveis).toHaveLength(2);

    const created = await gql(adminToken, `
      mutation Criar($input: CreateProjetoInput!) {
        createProjeto(input: $input) { id chave nome metodologia situacao saude }
      }
    `, { input: { chave: 'ORFEU', nome: 'Projeto Orfeu', metodologia: 'KANBAN', responsavelId: admin.sub, participantes: [] } }).expect(200);
    expect(created.body.errors).toBeUndefined();

    const maintained = await gql(adminToken, `
      mutation Manter($dados: UpdateProjetoInput!, $equipe: UpdateProjetoEquipeInput!, $ciclo: AtualizarCicloProjetoInput!) {
        updateProjeto(input: $dados) { nome }
        updateProjetoEquipe(input: $equipe) { responsavelId }
        atualizarSituacaoProjeto(input: $ciclo) { situacao saude }
      }
    `, {
      dados: { id: project.id, nome: 'Projeto revisado' },
      equipe: { projetoId: project.id, responsavelId: admin.sub, participantes: [{ usuarioId: member.sub, papel: 'MEMBRO' }] },
      ciclo: { projetoId: project.id, situacao: 'PLANEJADO', saude: 'EM_RISCO' }
    }).expect(200);
    expect(maintained.body.errors).toBeUndefined();
    expect(service.updateEquipe).toHaveBeenCalledWith(expect.objectContaining({ participantes: [{ usuarioId: member.sub, papel: 'MEMBRO' }] }), expect.objectContaining({ empresaId: 10 }));

    const archived = await gql(adminToken, `
      mutation Arquivar($id: String!) {
        arquivarProjeto(id: $id) { id arquivadoEm }
        reativarProjeto(id: $id) { id arquivadoEm }
      }
    `, { id: project.id }).expect(200);
    expect(archived.body.errors).toBeUndefined();
    expect(archived.body.data.arquivarProjeto.arquivadoEm).toBeTruthy();
    expect(archived.body.data.reativarProjeto.arquivadoEm).toBeNull();
  });

  it('rejeita acesso sem autenticação e preserva o contexto do usuário autenticado', async () => {
    const unauthenticated = await request(app.getHttpServer()).post('/graphql').send({ query: '{ projetos { total } }' }).expect(200);
    expect(unauthenticated.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');

    await gql(memberToken, '{ projetos { total } }').expect(200);
    expect(service.projetos).toHaveBeenCalledWith(expect.objectContaining({ sub: member.sub, empresaId: 10 }), {});
  });

  it('propaga negações de autorização e valida filtros na borda', async () => {
    service.projetos.mockRejectedValueOnce(new ForbiddenException('Usuario sem acesso a projetos.'));
    const forbidden = await gql(memberToken, '{ projetos { total } }').expect(200);
    expect(forbidden.body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    service.projetos.mockClear();

    const invalid = await gql(adminToken, 'query($filtro: ProjetoFiltroInput) { projetos(filtro: $filtro) { total } }', {
      filtro: { pagina: 0, limite: 101 }
    }).expect(200);
    expect(invalid.body.errors?.[0]?.extensions?.code).toBe('BAD_REQUEST');
    expect(service.projetos).not.toHaveBeenCalled();
  });
});
