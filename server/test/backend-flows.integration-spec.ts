import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtPayload } from '../src/modules/auth/strategies/jwt-payload.type';
import { ChamadosService } from '../src/modules/chamados/chamados.service';
import { EmpresasService } from '../src/modules/empresas/empresas.service';
import { GruposUsuariosService } from '../src/modules/grupos-usuarios/grupos-usuarios.service';
import { ServicosService } from '../src/modules/servicos/servicos.service';
import { SolucoesService } from '../src/modules/solucoes/solucoes.service';
import { UsersService } from '../src/modules/users/users.service';
import { UserType } from '../src/modules/users/dto/user.type';
import { PrismaService } from '../src/prisma/prisma.service';

type AnyRecord = Record<string, any>;

type ModelName =
  | 'usuario'
  | 'grupoUsuario'
  | 'servico'
  | 'empresa'
  | 'solucao'
  | 'funcionalidade'
  | 'funcionalidadeAcao'
  | 'grupoSolucao'
  | 'empresaSolucao'
  | 'grupoFuncionalidade'
  | 'grupoFuncionalidadeAcao'
  | 'empresaFuncionalidade'
  | 'empresaUsuario'
  | 'chamado'
  | 'chamadoMensagem'
  | 'chamadoHistorico'
  | 'chamadoCategoria'
  | 'chamadoSequencia';

const MODELS: ModelName[] = [
  'usuario',
  'grupoUsuario',
  'servico',
  'empresa',
  'solucao',
  'funcionalidade',
  'funcionalidadeAcao',
  'grupoSolucao',
  'empresaSolucao',
  'grupoFuncionalidade',
  'grupoFuncionalidadeAcao',
  'empresaFuncionalidade',
  'empresaUsuario',
  'chamado',
  'chamadoMensagem',
  'chamadoHistorico',
  'chamadoCategoria',
  'chamadoSequencia'
];

const INTEGER_ID_MODELS = new Set<ModelName>([
  'grupoUsuario',
  'servico',
  'empresa',
  'solucao',
  'funcionalidade',
  'funcionalidadeAcao',
  'grupoSolucao',
  'empresaSolucao',
  'grupoFuncionalidade',
  'grupoFuncionalidadeAcao',
  'empresaFuncionalidade',
  'empresaUsuario',
  'chamadoCategoria',
  'chamadoSequencia'
]);

const COMPOSITE_KEYS: Record<string, string[]> = {
  solucaoId_slug: ['solucaoId', 'slug'],
  funcionalidadeId_chave: ['funcionalidadeId', 'chave'],
  grupoId_solucaoId: ['grupoId', 'solucaoId'],
  empresaId_solucaoId: ['empresaId', 'solucaoId'],
  grupoId_funcionalidadeId: ['grupoId', 'funcionalidadeId'],
  grupoId_funcionalidadeAcaoId: ['grupoId', 'funcionalidadeAcaoId'],
  empresaId_funcionalidadeId: ['empresaId', 'funcionalidadeId'],
  empresaId_usuarioId: ['empresaId', 'usuarioId'],
  empresaId_numero: ['empresaId', 'numero']
};

class InMemoryDelegate {
  constructor(
    private readonly db: InMemoryPrismaService,
    private readonly model: ModelName
  ) {}

  async count(args: AnyRecord = {}): Promise<number> {
    return this.db.filterRows(this.model, args.where).length;
  }

  async findMany(args: AnyRecord = {}): Promise<AnyRecord[]> {
    const filtered = this.db.filterRows(this.model, args.where);
    const ordered = this.db.orderRows(filtered, args.orderBy);
    const skipped = args.skip ? ordered.slice(args.skip) : ordered;
    const taken = args.take !== undefined ? skipped.slice(0, args.take) : skipped;

    return taken.map((row) => this.db.project(this.model, row, args));
  }

  async findFirst(args: AnyRecord = {}): Promise<AnyRecord | null> {
    const rows = await this.findMany({ ...args, take: 1 });

    return rows[0] ?? null;
  }

  async findUnique(args: AnyRecord): Promise<AnyRecord | null> {
    const row = this.db.filterRows(this.model, args.where)[0];

    return row ? this.db.project(this.model, row, args) : null;
  }

  async findUniqueOrThrow(args: AnyRecord): Promise<AnyRecord> {
    const row = await this.findUnique(args);

    if (!row) {
      throw new Error(`${this.model} not found`);
    }

    return row;
  }

  async create(args: AnyRecord): Promise<AnyRecord> {
    const row = this.db.createRow(this.model, args.data ?? {});

    return this.db.project(this.model, row, args);
  }

  async createMany(args: AnyRecord): Promise<{ count: number }> {
    const rows = Array.isArray(args.data) ? args.data : [];

    for (const row of rows) {
      this.db.createRow(this.model, row);
    }

    return { count: rows.length };
  }

  async update(args: AnyRecord): Promise<AnyRecord> {
    const row = this.db.filterRows(this.model, args.where)[0];

    if (!row) {
      throw new Error(`${this.model} not found`);
    }

    this.db.applyData(this.model, row, args.data ?? {});

    return this.db.project(this.model, row, args);
  }

  async updateMany(args: AnyRecord): Promise<{ count: number }> {
    const rows = this.db.filterRows(this.model, args.where);

    for (const row of rows) {
      this.db.applyData(this.model, row, args.data ?? {});
    }

    return { count: rows.length };
  }

  async delete(args: AnyRecord): Promise<AnyRecord> {
    const rows = this.db.data[this.model];
    const index = rows.findIndex((row) => this.db.matchesWhere(this.model, row, args.where));

    if (index < 0) {
      throw new Error(`${this.model} not found`);
    }

    const row = rows[index] as AnyRecord;
    rows.splice(index, 1);

    return this.db.project(this.model, row, args);
  }

  async deleteMany(args: AnyRecord = {}): Promise<{ count: number }> {
    const rows = this.db.data[this.model];
    const remaining: AnyRecord[] = [];
    let count = 0;

    for (const row of rows) {
      if (this.db.matchesWhere(this.model, row, args.where)) {
        count += 1;
      } else {
        remaining.push(row);
      }
    }

    this.db.data[this.model] = remaining;

    return { count };
  }

  async upsert(args: AnyRecord): Promise<AnyRecord> {
    const row = this.db.filterRows(this.model, args.where)[0];

    if (row) {
      this.db.applyData(this.model, row, args.update ?? {});
      return this.db.project(this.model, row, args);
    }

    const created = this.db.createRow(this.model, args.create ?? {});

    return this.db.project(this.model, created, args);
  }
}

class InMemoryPrismaService {
  public data: Record<ModelName, AnyRecord[]> = MODELS.reduce(
    (acc, model) => ({ ...acc, [model]: [] }),
    {} as Record<ModelName, AnyRecord[]>
  );

  private sequences: Record<ModelName, number> = MODELS.reduce(
    (acc, model) => ({ ...acc, [model]: 1 }),
    {} as Record<ModelName, number>
  );

  public usuario = new InMemoryDelegate(this, 'usuario');
  public grupoUsuario = new InMemoryDelegate(this, 'grupoUsuario');
  public servico = new InMemoryDelegate(this, 'servico');
  public empresa = new InMemoryDelegate(this, 'empresa');
  public solucao = new InMemoryDelegate(this, 'solucao');
  public funcionalidade = new InMemoryDelegate(this, 'funcionalidade');
  public funcionalidadeAcao = new InMemoryDelegate(this, 'funcionalidadeAcao');
  public grupoSolucao = new InMemoryDelegate(this, 'grupoSolucao');
  public empresaSolucao = new InMemoryDelegate(this, 'empresaSolucao');
  public grupoFuncionalidade = new InMemoryDelegate(this, 'grupoFuncionalidade');
  public grupoFuncionalidadeAcao = new InMemoryDelegate(this, 'grupoFuncionalidadeAcao');
  public empresaFuncionalidade = new InMemoryDelegate(this, 'empresaFuncionalidade');
  public empresaUsuario = new InMemoryDelegate(this, 'empresaUsuario');
  public chamado = new InMemoryDelegate(this, 'chamado');
  public chamadoMensagem = new InMemoryDelegate(this, 'chamadoMensagem');
  public chamadoHistorico = new InMemoryDelegate(this, 'chamadoHistorico');
  public chamadoCategoria = new InMemoryDelegate(this, 'chamadoCategoria');
  public chamadoSequencia = new InMemoryDelegate(this, 'chamadoSequencia');

  async $transaction<T>(callback: (tx: this) => Promise<T>): Promise<T> {
    return callback(this);
  }

  filterRows(model: ModelName, where?: AnyRecord): AnyRecord[] {
    return this.data[model].filter((row) => this.matchesWhere(model, row, where));
  }

  matchesWhere(model: ModelName, row: AnyRecord, where?: AnyRecord): boolean {
    if (!where || !Object.keys(where).length) {
      return true;
    }

    for (const [key, condition] of Object.entries(where)) {
      if (key === 'OR') {
        const clauses = Array.isArray(condition) ? condition : [];
        if (!clauses.some((clause) => this.matchesWhere(model, row, clause))) {
          return false;
        }
        continue;
      }

      if (key === 'NOT') {
        const clauses = Array.isArray(condition) ? condition : [condition];
        if (clauses.some((clause) => this.matchesWhere(model, row, clause))) {
          return false;
        }
        continue;
      }

      const composite = COMPOSITE_KEYS[key];
      if (composite) {
        const values = condition as AnyRecord;
        if (!composite.every((field) => this.matchesValue(row[field], values[field]))) {
          return false;
        }
        continue;
      }

      const relation = this.resolveRelation(model, row, key);
      if (relation !== undefined && this.isPlainObject(condition) && !this.isOperatorObject(condition)) {
        const relationModel = this.relationModel(model, key);

        if (!relationModel) {
          return false;
        }

        if (Array.isArray(relation)) {
          if (!relation.some((item) => this.matchesWhere(relationModel, item, condition))) {
            return false;
          }
        } else if (!relation || !this.matchesWhere(relationModel, relation, condition)) {
          return false;
        }
        continue;
      }

      if (!this.matchesValue(row[key], condition)) {
        return false;
      }
    }

    return true;
  }

  matchesValue(value: any, condition: any): boolean {
    if (this.isPlainObject(condition) && this.isOperatorObject(condition)) {
      if ('equals' in condition && value !== condition.equals) {
        return false;
      }

      if ('in' in condition && !condition.in.includes(value)) {
        return false;
      }

      if ('not' in condition) {
        const notValue = condition.not;
        if (this.isPlainObject(notValue) ? this.matchesValue(value, notValue) : value === notValue) {
          return false;
        }
      }

      if ('contains' in condition) {
        const left = String(value ?? '');
        const right = String(condition.contains ?? '');
        const insensitive = condition.mode === 'insensitive';

        if (insensitive ? !left.toLowerCase().includes(right.toLowerCase()) : !left.includes(right)) {
          return false;
        }
      }

      return true;
    }

    return value === condition;
  }
  createRow(model: ModelName, data: AnyRecord): AnyRecord {
    const nestedEmpresas = model === 'usuario' ? data.empresas?.create ?? [] : [];
    const normalized = this.withDefaults(model, { ...data });
    delete normalized.empresas;
    this.data[model].push(normalized);

    if (model === 'usuario') {
      for (const vinculo of nestedEmpresas) {
        this.createRow('empresaUsuario', {
          usuarioId: normalized.id,
          empresaId: vinculo.empresaId
        });
      }
    }

    return normalized;
  }

  applyData(model: ModelName, row: AnyRecord, data: AnyRecord): void {
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        continue;
      }

      if (this.isPlainObject(value) && 'increment' in value) {
        row[key] = Number(row[key] ?? 0) + Number(value.increment);
        continue;
      }

      row[key] = value;
    }

    if (['chamado', 'chamadoCategoria', 'chamadoSequencia'].includes(model)) {
      row.atualizadoEm = new Date();
    }
  }

  project(model: ModelName, row: AnyRecord, args: AnyRecord = {}): AnyRecord {
    const include = args.include;
    const select = args.select;

    if (select) {
      const selected: AnyRecord = {};

      for (const [key, value] of Object.entries(select)) {
        if (value === true) {
          selected[key] = row[key];
          continue;
        }

        if (value && typeof value === 'object') {
          selected[key] = this.projectRelation(model, row, key, value as AnyRecord);
        }
      }

      return selected;
    }

    const result = { ...row };

    if (include) {
      for (const [key, value] of Object.entries(include)) {
        result[key] = value === true
          ? this.projectRelation(model, row, key, {})
          : this.projectRelation(model, row, key, value as AnyRecord);
      }
    }

    return result;
  }

  projectRelation(model: ModelName, row: AnyRecord, key: string, options: AnyRecord): AnyRecord | AnyRecord[] | null {
    const relation = this.resolveRelation(model, row, key);
    const relationModel = this.relationModel(model, key);

    if (!relationModel) {
      return Array.isArray(relation) ? relation.map((item) => ({ ...item })) : relation ? { ...relation } : null;
    }

    if (Array.isArray(relation)) {
      const ordered = this.orderRows(relation, options.orderBy);
      return ordered.map((item) => this.project(relationModel, item, options));
    }

    return relation ? this.project(relationModel, relation, options) : null;
  }

  orderRows(rows: AnyRecord[], orderBy?: AnyRecord | AnyRecord[]): AnyRecord[] {
    const orderRules = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];

    if (!orderRules.length) {
      return [...rows];
    }

    return [...rows].sort((a, b) => {
      for (const rule of orderRules) {
        const [field, direction] = Object.entries(rule)[0] ?? [];

        if (!field) {
          continue;
        }

        const modifier = direction === 'desc' ? -1 : 1;
        const left = a[field];
        const right = b[field];

        if (left === right) {
          continue;
        }

        if (left === null || left === undefined) {
          return -1 * modifier;
        }

        if (right === null || right === undefined) {
          return 1 * modifier;
        }

        if (typeof left === 'string' && typeof right === 'string') {
          return left.localeCompare(right) * modifier;
        }

        return (left > right ? 1 : -1) * modifier;
      }

      return 0;
    });
  }

  resolveRelation(model: ModelName, row: AnyRecord, key: string): AnyRecord | AnyRecord[] | null | undefined {
    switch (`${model}.${key}`) {
      case 'usuario.grupo':
        return this.data.grupoUsuario.find((grupo) => grupo.id === row.grupoId) ?? null;
      case 'usuario.empresas':
        return this.data.empresaUsuario.filter((vinculo) => vinculo.usuarioId === row.id);
      case 'empresaUsuario.empresa':
        return this.data.empresa.find((empresa) => empresa.id === row.empresaId) ?? null;
      case 'empresaUsuario.usuario':
        return this.data.usuario.find((usuario) => usuario.id === row.usuarioId) ?? null;
      case 'solucao.funcionalidades':
        return this.data.funcionalidade.filter((funcionalidade) => funcionalidade.solucaoId === row.id);
      case 'funcionalidade.acoes':
        return this.data.funcionalidadeAcao.filter((acao) => acao.funcionalidadeId === row.id);
      case 'funcionalidade.solucao':
        return this.data.solucao.find((solucao) => solucao.id === row.solucaoId) ?? null;
      case 'grupoSolucao.grupo':
        return this.data.grupoUsuario.find((grupo) => grupo.id === row.grupoId) ?? null;
      case 'grupoSolucao.solucao':
        return this.data.solucao.find((solucao) => solucao.id === row.solucaoId) ?? null;
      case 'empresaSolucao.empresa':
        return this.data.empresa.find((empresa) => empresa.id === row.empresaId) ?? null;
      case 'empresaSolucao.solucao':
        return this.data.solucao.find((solucao) => solucao.id === row.solucaoId) ?? null;
      case 'grupoFuncionalidade.funcionalidade':
        return this.data.funcionalidade.find((funcionalidade) => funcionalidade.id === row.funcionalidadeId) ?? null;
      case 'grupoFuncionalidade.grupo':
        return this.data.grupoUsuario.find((grupo) => grupo.id === row.grupoId) ?? null;
      case 'grupoFuncionalidadeAcao.funcionalidadeAcao':
        return this.data.funcionalidadeAcao.find((acao) => acao.id === row.funcionalidadeAcaoId) ?? null;
      case 'empresaFuncionalidade.funcionalidade':
        return this.data.funcionalidade.find((funcionalidade) => funcionalidade.id === row.funcionalidadeId) ?? null;
      case 'chamado.solicitante':
        return this.data.usuario.find((usuario) => usuario.id === row.solicitanteId) ?? null;
      case 'chamado.responsavel':
        return row.responsavelId ? this.data.usuario.find((usuario) => usuario.id === row.responsavelId) ?? null : null;
      case 'chamado.categoria':
        return row.categoriaId ? this.data.chamadoCategoria.find((categoria) => categoria.id === row.categoriaId) ?? null : null;
      case 'chamado.mensagens':
        return this.data.chamadoMensagem.filter((mensagem) => mensagem.chamadoId === row.id);
      case 'chamado.historico':
        return this.data.chamadoHistorico.filter((historico) => historico.chamadoId === row.id);
      case 'chamadoMensagem.autor':
        return this.data.usuario.find((usuario) => usuario.id === row.autorId) ?? null;
      case 'chamadoHistorico.usuario':
        return row.usuarioId ? this.data.usuario.find((usuario) => usuario.id === row.usuarioId) ?? null : null;
      default:
        return undefined;
    }
  }

  relationModel(model: ModelName, key: string): ModelName | null {
    const targets: Record<string, ModelName> = {
      'usuario.grupo': 'grupoUsuario',
      'usuario.empresas': 'empresaUsuario',
      'empresaUsuario.empresa': 'empresa',
      'empresaUsuario.usuario': 'usuario',
      'solucao.funcionalidades': 'funcionalidade',
      'funcionalidade.acoes': 'funcionalidadeAcao',
      'funcionalidade.solucao': 'solucao',
      'grupoSolucao.grupo': 'grupoUsuario',
      'grupoSolucao.solucao': 'solucao',
      'empresaSolucao.empresa': 'empresa',
      'empresaSolucao.solucao': 'solucao',
      'grupoFuncionalidade.funcionalidade': 'funcionalidade',
      'grupoFuncionalidade.grupo': 'grupoUsuario',
      'grupoFuncionalidadeAcao.funcionalidadeAcao': 'funcionalidadeAcao',
      'empresaFuncionalidade.funcionalidade': 'funcionalidade',
      'chamado.solicitante': 'usuario',
      'chamado.responsavel': 'usuario',
      'chamado.categoria': 'chamadoCategoria',
      'chamado.mensagens': 'chamadoMensagem',
      'chamado.historico': 'chamadoHistorico',
      'chamadoMensagem.autor': 'usuario',
      'chamadoHistorico.usuario': 'usuario'
    };

    return targets[`${model}.${key}`] ?? null;
  }

  private withDefaults(model: ModelName, data: AnyRecord): AnyRecord {
    const now = new Date();
    const row = { ...data };

    if (INTEGER_ID_MODELS.has(model) && row.id === undefined) {
      row.id = this.sequences[model]++;
    }

    if (!INTEGER_ID_MODELS.has(model) && row.id === undefined) {
      row.id = randomUUID();
    }

    switch (model) {
      case 'usuario':
        row.nome = row.nome ?? null;
        row.login = row.login ?? null;
        row.grupoId = row.grupoId ?? null;
        row.deveAlterarSenha = row.deveAlterarSenha ?? false;
        break;
      case 'grupoUsuario':
        row.descricao = row.descricao ?? null;
        row.acessoEcommerce = row.acessoEcommerce ?? false;
        row.acessoProjetos = row.acessoProjetos ?? false;
        row.acessoHoras = row.acessoHoras ?? false;
        row.acessoConfigurador = row.acessoConfigurador ?? false;
        row.podeVisualizar = row.podeVisualizar ?? true;
        row.podeIncluir = row.podeIncluir ?? false;
        row.podeAlterar = row.podeAlterar ?? false;
        row.podeExcluir = row.podeExcluir ?? false;
        break;
      case 'empresa':
        row.nome = row.nome ?? null;
        row.acessoEcommerce = row.acessoEcommerce ?? false;
        row.acessoProjetos = row.acessoProjetos ?? false;
        row.acessoHoras = row.acessoHoras ?? false;
        break;
      case 'solucao':
        row.descricao = row.descricao ?? null;
        row.eyebrow = row.eyebrow ?? null;
        row.ordem = row.ordem ?? 0;
        row.ativo = row.ativo ?? true;
        row.exibirNoHub = row.exibirNoHub ?? true;
        row.somenteAdminSistema = row.somenteAdminSistema ?? false;
        break;
      case 'funcionalidade':
        row.label = row.label ?? null;
        row.descricao = row.descricao ?? null;
        row.ordem = row.ordem ?? 0;
        row.ativo = row.ativo ?? true;
        row.registryKey = row.registryKey ?? null;
        row.somenteAdminSistema = row.somenteAdminSistema ?? false;
        break;
      case 'funcionalidadeAcao':
        row.descricao = row.descricao ?? null;
        row.ordem = row.ordem ?? 0;
        row.ativo = row.ativo ?? true;
        row.acaoPadrao = row.acaoPadrao ?? false;
        row.configuracao = row.configuracao ?? null;
        break;
      case 'servico':
        row.titulo = row.titulo ?? null;
        row.descricao = row.descricao ?? null;
        row.valor = row.valor ?? null;
        row.desconto = row.desconto ?? null;
        row.vendas = row.vendas ?? null;
        break;
      case 'chamado':
        row.status = row.status ?? 'ABERTO';
        row.tipo = row.tipo ?? 'SOLICITACAO';
        row.prioridade = row.prioridade ?? 'MEDIA';
        row.criadoEm = row.criadoEm ?? now;
        row.atualizadoEm = row.atualizadoEm ?? now;
        row.primeiraRespostaEm = row.primeiraRespostaEm ?? null;
        row.resolvidoEm = row.resolvidoEm ?? null;
        row.encerradoEm = row.encerradoEm ?? null;
        row.responsavelId = row.responsavelId ?? null;
        row.categoriaId = row.categoriaId ?? null;
        row.versao = row.versao ?? 1;
        break;
      case 'chamadoMensagem':
      case 'chamadoHistorico':
        row.criadoEm = row.criadoEm ?? now;
        break;
      case 'chamadoCategoria':
        row.descricao = row.descricao ?? null;
        row.ativo = row.ativo ?? true;
        row.criadoEm = row.criadoEm ?? now;
        row.atualizadoEm = row.atualizadoEm ?? now;
        break;
      case 'chamadoSequencia':
        row.proximoNumero = row.proximoNumero ?? 1;
        row.atualizadoEm = row.atualizadoEm ?? now;
        break;
    }

    return row;
  }

  private isPlainObject(value: unknown): value is AnyRecord {
    return !!value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
  }

  private isOperatorObject(value: AnyRecord): boolean {
    return ['equals', 'in', 'not', 'contains', 'gt', 'gte', 'lt', 'lte'].some((key) => key in value);
  }
}
type TestWorld = {
  prisma: InMemoryPrismaService;
  solucoesService: SolucoesService;
  gruposService: GruposUsuariosService;
  empresasService: EmpresasService;
  usersService: UsersService;
  authService: AuthService;
  servicosService: ServicosService;
  chamadosService: ChamadosService;
};

const asPrisma = (prisma: InMemoryPrismaService): PrismaService => prisma as unknown as PrismaService;

function createWorld(): TestWorld {
  const prisma = new InMemoryPrismaService();
  const prismaService = asPrisma(prisma);
  const solucoesService = new SolucoesService(prismaService);
  const gruposService = new GruposUsuariosService(prismaService, solucoesService);
  const empresasService = new EmpresasService(prismaService, solucoesService);
  const usersService = new UsersService(prismaService);
  const servicosService = new ServicosService(prismaService);
  const chamadosService = new ChamadosService(prismaService, solucoesService);
  const jwtService = new JwtService({ secret: 'integration-test-secret' });
  const configService = {
    get: (key: string) => ({ NODE_ENV: 'test', JWT_EXPIRES_IN: 3600 } as Record<string, unknown>)[key]
  } as ConfigService;
  const authService = new AuthService(usersService, empresasService, solucoesService, jwtService, configService);

  return {
    prisma,
    solucoesService,
    gruposService,
    empresasService,
    usersService,
    authService,
    servicosService,
    chamadosService
  };
}

function expectDefined<T>(value: T | null | undefined, message = 'Valor esperado nao encontrado'): T {
  expect(value).toBeDefined();
  expect(value).not.toBeNull();

  if (value === undefined || value === null) {
    throw new Error(message);
  }

  return value;
}

function toJwtPayload(user: UserType, empresaId?: number | null): JwtPayload {
  return {
    sub: user.id,
    email: user.email,
    login: user.login ?? null,
    nome: user.nome ?? null,
    grupo: user.grupo
      ? {
          id: user.grupo.id,
          nome: user.grupo.nome,
          descricao: user.grupo.descricao,
          acessoEcommerce: user.grupo.acessoEcommerce,
          acessoProjetos: user.grupo.acessoProjetos,
          acessoHoras: user.grupo.acessoHoras,
          acessoConfigurador: user.grupo.acessoConfigurador,
          podeVisualizar: user.grupo.podeVisualizar,
          podeIncluir: user.grupo.podeIncluir,
          podeAlterar: user.grupo.podeAlterar,
          podeExcluir: user.grupo.podeExcluir
        }
      : null,
    podeVisualizar: user.podeVisualizar,
    podeIncluir: user.podeIncluir,
    podeAlterar: user.podeAlterar,
    podeExcluir: user.podeExcluir,
    deveAlterarSenha: user.deveAlterarSenha,
    empresaId: empresaId ?? user.empresa?.id ?? null,
    empresaNome: user.empresa?.nome ?? null,
    availableSolutions: user.availableSolutions
  };
}

async function seedConfigurador(world: TestWorld): Promise<void> {
  const configurador = await world.solucoesService.create({
    slug: 'configurador',
    nome: 'Configurador',
    descricao: 'Administracao do hub e cadastros base.',
    eyebrow: 'Sistema',
    ordem: 1,
    ativo: true,
    exibirNoHub: true,
    somenteAdminSistema: true
  });

  const configuradorFeatures = [
    ['cadastro-de-usuarios', 'Cadastro de usuarios', 'Usuarios', 'configurador.cadastro-de-usuarios'],
    ['cadastro-de-grupos', 'Cadastro de grupos', 'Grupos', 'configurador.cadastro-de-grupos'],
    ['cadastro-de-empresas', 'Cadastro de empresas', 'Empresas', 'configurador.cadastro-de-empresas'],
    ['cadastro-de-funcionalidades', 'Cadastro de funcionalidades', 'Funcionalidades', 'configurador.cadastro-de-funcionalidades']
  ] as const;

  for (const [slug, titulo, label, registryKey] of configuradorFeatures) {
    await world.solucoesService.createFuncionalidade({
      solucaoId: configurador.id,
      slug,
      titulo,
      label,
      descricao: `Gerencia ${label.toLowerCase()} do sistema.`,
      ordem: configuradorFeatures.findIndex((feature) => feature[0] === slug) + 1,
      ativo: true,
      registryKey,
      somenteAdminSistema: true
    });
  }
}

async function bootstrapBaseWorld(): Promise<{
  world: TestWorld;
  admin: JwtPayload;
  empresaInicialId: number;
}> {
  const world = createWorld();
  await seedConfigurador(world);
  await world.gruposService.ensureInitialSetup();
  const empresaInicial = expectDefined(world.prisma.data.empresa[0]);
  const login = await world.authService.login('admin', 'admin123', empresaInicial.id);

  return {
    world,
    admin: toJwtPayload(login.user, empresaInicial.id),
    empresaInicialId: empresaInicial.id
  };
}

function buildPermissionForFeature(feature: { id: number; slug: string; acoes: Array<{ id: number; chave: string }> }) {
  return {
    funcionalidadeId: feature.id,
    podeVisualizar: true,
    podeIncluir: true,
    podeAlterar: true,
    podeExcluir: true,
    acoes: feature.acoes.map((acao) => ({
      funcionalidadeId: feature.id,
      acaoId: acao.id,
      chave: acao.chave,
      permitido: true
    }))
  };
}
describe('Fluxos integrados do backend', () => {
  it('cadastra grupo, usuario e empresa, vincula acesso a solucoes/funcionalidades e valida o hub', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const solucoes = await world.solucoesService.findAll();
    const controleChamados = expectDefined(solucoes.find((solucao) => solucao.slug === 'controle-de-chamados'));
    const funcionalidadesControle = controleChamados.funcionalidades;

    expect(funcionalidadesControle.map((funcionalidade) => funcionalidade.slug).sort()).toEqual([
      'abrir-chamado',
      'categorias',
      'meus-chamados',
      'painel-atendimento'
    ]);

    const grupo = await world.gruposService.create({
      nome: 'Equipe de Atendimento Integracao',
      descricao: 'Grupo criado por teste integrado.',
      acessoEcommerce: false,
      acessoProjetos: false,
      acessoHoras: false,
      acessoConfigurador: false,
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: funcionalidadesControle.map((funcionalidade) => funcionalidade.id),
      funcionalidadePermissoes: funcionalidadesControle.map(buildPermissionForFeature)
    });

    const empresa = await world.empresasService.create({
      nome: 'Empresa Integracao Fluxo Completo',
      acessoEcommerce: true,
      acessoProjetos: false,
      acessoHoras: false,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: funcionalidadesControle.map((funcionalidade) => funcionalidade.id)
    }, admin);

    const usuario = await world.usersService.create({
      nome: 'Usuario Fluxo Integrado',
      login: 'usuario.fluxo',
      email: 'usuario.fluxo@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupo.id,
      empresaIds: [empresa.id]
    });

    const login = await world.authService.login('usuario.fluxo', 'Senha@12345', empresa.id);
    const usuarioLogado = login.user;
    const payload = toJwtPayload(usuarioLogado, empresa.id);
    const navigation = await world.solucoesService.myHubNavigation(payload);
    const controleNoHub = expectDefined(navigation.find((solucao) => solucao.slug === 'controle-de-chamados'));
    const painel = expectDefined(controleNoHub.funcionalidades.find((funcionalidade) => funcionalidade.slug === 'painel-atendimento'));
    const atribuirChamado = expectDefined(painel.acoes.find((acao) => acao.chave === 'atribuir_chamado'));

    expect(usuario.grupo?.id).toBe(grupo.id);
    expect(usuario.empresas.map((item) => item.id)).toEqual([empresa.id]);
    expect(usuarioLogado.availableSolutions).toContain('controle-de-chamados');
    expect(controleNoHub.funcionalidades).toHaveLength(4);
    expect(atribuirChamado.permitido).toBe(true);

    const usuarios = await world.usersService.findAll(admin);
    const usuarioPersistido = expectDefined(usuarios.find((item) => item.id === usuario.id));
    expect(usuarioPersistido.grupo?.nome).toBe('Equipe de Atendimento Integracao');
    expect(usuarioPersistido.empresas.map((item) => item.nome)).toEqual(['Empresa Integracao Fluxo Completo']);

    const funcionalidadeExtra = await world.solucoesService.createFuncionalidade({
      solucaoId: controleChamados.id,
      slug: 'relatorios-atendimento',
      titulo: 'Relatorios de atendimento',
      label: 'Relatorios',
      descricao: 'Acompanha indicadores de chamados.',
      ordem: 99,
      ativo: true,
      registryKey: 'controle-de-chamados.relatorios-atendimento',
      acoes: [
        { chave: 'exportar_relatorio', nome: 'Exportar relatorio', ordem: 50, ativo: true, configuracao: 'exportar_relatorio' }
      ]
    });
    const acessoGrupo = await world.solucoesService.findGroupAccess(grupo.id);
    const acessoEmpresa = await world.solucoesService.findCompanyAccess(empresa.id);

    expect(acessoGrupo.funcionalidadeIds).toContain(funcionalidadeExtra.id);
    expect(acessoEmpresa.funcionalidadeIds).toContain(funcionalidadeExtra.id);
  });

  it('executa o ciclo do controle de chamados com permissao, historico, mensagens e mudancas de status', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const controleChamados = expectDefined((await world.solucoesService.findAll()).find((solucao) => solucao.slug === 'controle-de-chamados'));
    const features = controleChamados.funcionalidades;
    const abrir = expectDefined(features.find((feature) => feature.slug === 'abrir-chamado'));
    const meus = expectDefined(features.find((feature) => feature.slug === 'meus-chamados'));
    const painel = expectDefined(features.find((feature) => feature.slug === 'painel-atendimento'));
    const categorias = expectDefined(features.find((feature) => feature.slug === 'categorias'));

    const grupoSolicitante = await world.gruposService.create({
      nome: 'Solicitantes Integracao',
      descricao: 'Abre e acompanha chamados.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: false,
      podeExcluir: false,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [abrir.id, meus.id],
      funcionalidadePermissoes: [
        {
          funcionalidadeId: abrir.id,
          podeVisualizar: true,
          podeIncluir: true,
          podeAlterar: false,
          podeExcluir: false,
          acoes: abrir.acoes.map((acao) => ({ funcionalidadeId: abrir.id, acaoId: acao.id, chave: acao.chave, permitido: acao.chave !== 'excluir' }))
        },
        {
          funcionalidadeId: meus.id,
          podeVisualizar: true,
          podeIncluir: false,
          podeAlterar: false,
          podeExcluir: false,
          acoes: meus.acoes.map((acao) => ({ funcionalidadeId: meus.id, acaoId: acao.id, chave: acao.chave, permitido: true }))
        }
      ]
    });

    const grupoAtendimento = await world.gruposService.create({
      nome: 'Atendentes Integracao',
      descricao: 'Opera fila e categorias de chamados.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [painel.id, categorias.id, meus.id],
      funcionalidadePermissoes: [painel, categorias, meus].map(buildPermissionForFeature)
    });

    const empresa = await world.empresasService.create({
      nome: 'Empresa Chamados Integracao',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: features.map((feature) => feature.id)
    }, admin);

    const solicitante = await world.usersService.create({
      nome: 'Solicitante Integracao',
      login: 'solicitante.integracao',
      email: 'solicitante.integracao@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoSolicitante.id,
      empresaIds: [empresa.id]
    });
    const atendente = await world.usersService.create({
      nome: 'Atendente Integracao',
      login: 'atendente.integracao',
      email: 'atendente.integracao@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoAtendimento.id,
      empresaIds: [empresa.id]
    });
    const segundoAtendente = await world.usersService.create({
      nome: 'Atendente Backup',
      login: 'atendente.backup',
      email: 'atendente.backup@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoAtendimento.id,
      empresaIds: [empresa.id]
    });

    const solicitantePayload = toJwtPayload((await world.authService.login('solicitante.integracao', 'Senha@12345', empresa.id)).user, empresa.id);
    const atendentePayload = toJwtPayload((await world.authService.login('atendente.integracao', 'Senha@12345', empresa.id)).user, empresa.id);

    const categoria = await world.chamadosService.createCategoria({
      nome: 'Infraestrutura',
      descricao: 'Incidentes de infraestrutura.',
      ativo: true
    }, atendentePayload);
    const chamado = await world.chamadosService.criarChamado({
      titulo: 'VPN indisponivel',
      descricao: 'Usuario nao consegue conectar na VPN corporativa.',
      tipo: 'INCIDENTE',
      prioridade: 'ALTA',
      categoriaId: categoria.id
    }, solicitantePayload);

    expect(chamado.numero).toBe(1);
    expect(chamado.status).toBe('ABERTO');
    expect(chamado.solicitanteNome).toBe(solicitante.nome);

    const meusChamados = await world.chamadosService.meusChamados(solicitantePayload, { page: 1, pageSize: 10 });
    const fila = await world.chamadosService.filaChamados(atendentePayload, { page: 1, pageSize: 10 });

    expect(meusChamados.total).toBe(1);
    expect(fila.items.map((item) => item.id)).toContain(chamado.id);

    const assumido = await world.chamadosService.assumirChamado(chamado.id, atendentePayload);
    expect(assumido.status).toBe('EM_ATENDIMENTO');
    expect(assumido.responsavelNome).toBe(atendente.nome);
    expect(assumido.historico.find((item) => item.evento === 'ATRIBUICAO')?.valorNovo).toBe(atendente.nome);
    expect(assumido.historico.find((item) => item.evento === 'ATRIBUICAO')?.valorNovo).not.toBe(atendente.id);

    const atribuido = await world.chamadosService.atribuirChamado({
      chamadoId: chamado.id,
      responsavelId: segundoAtendente.id
    }, atendentePayload);
    expect(atribuido.responsavelNome).toBe(segundoAtendente.nome);
        const atribuicoes = atribuido.historico.filter((item) => item.evento === 'ATRIBUICAO');
    expect(atribuicoes[atribuicoes.length - 1]?.valorNovo).toBe(segundoAtendente.nome);

    const respondido = await world.chamadosService.responderChamado({
      chamadoId: chamado.id,
      conteudo: 'Estamos analisando o incidente.'
    }, atendentePayload);
    expect(respondido.mensagens).toHaveLength(1);
    expect(respondido.primeiraRespostaEm).toBeInstanceOf(Date);

    const urgente = await world.chamadosService.alterarPrioridadeChamado({ chamadoId: chamado.id, prioridade: 'URGENTE' }, atendentePayload);
    expect(urgente.prioridade).toBe('URGENTE');

    const resolvido = await world.chamadosService.resolverChamado(chamado.id, atendentePayload, 'VPN restabelecida.');
    expect(resolvido.status).toBe('RESOLVIDO');

    const reaberto = await world.chamadosService.reabrirChamado(chamado.id, solicitantePayload, 'Problema voltou a ocorrer.');
    expect(reaberto.status).toBe('EM_ATENDIMENTO');

    await world.chamadosService.resolverChamado(chamado.id, atendentePayload, 'Ajuste definitivo aplicado.');
    const encerrado = await world.chamadosService.encerrarChamado(chamado.id, atendentePayload, 'Chamado encerrado apos confirmacao.');

    expect(encerrado.status).toBe('ENCERRADO');
    expect(encerrado.historico.map((item) => item.evento)).toEqual(expect.arrayContaining([
      'ABERTURA',
      'ATRIBUICAO',
      'MENSAGEM',
      'ALTERACAO_PRIORIDADE',
      'RESOLUCAO',
      'REABERTURA',
      'ENCERRAMENTO'
    ]));
  });

  it('mantem o CRUD de servicos consistente no mesmo ciclo de persistencia em memoria', async () => {
    const { world } = await bootstrapBaseWorld();
    const criado = await world.servicosService.create({
      titulo: 'Implantacao assistida',
      descricao: 'Acompanhamento tecnico para implantacao.',
      valor: 1500,
      desconto: 150,
      vendas: 0
    });

    expect(criado.id).toBeGreaterThan(0);
    expect(await world.servicosService.findAll()).toHaveLength(1);

    const atualizado = await world.servicosService.update({
      id: criado.id,
      titulo: 'Implantacao assistida premium',
      descricao: 'Acompanhamento tecnico completo.',
      valor: 2200,
      desconto: 200,
      vendas: 3
    });

    expect(atualizado.titulo).toBe('Implantacao assistida premium');
    expect(atualizado.valor).toBe(2200);
    expect(atualizado.vendas).toBe(3);

    await expect(world.servicosService.remove(criado.id)).resolves.toBe(true);
    expect(await world.servicosService.findAll()).toEqual([]);
  });
});