import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { AuthCookieService } from '../src/modules/auth/auth-cookie.service';
import { AuthCredentialsService } from '../src/modules/auth/auth-credentials.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { AuthSessionService } from '../src/modules/auth/auth-session.service';
import { JwtPayload } from '../src/modules/auth/strategies/jwt-payload.type';
import { ChamadoAberturaService } from '../src/modules/chamados/chamado-abertura.service';
import { ChamadoAcompanhanteService } from '../src/modules/chamados/chamado-acompanhante.service';
import { ChamadoAnexoService } from '../src/modules/chamados/chamado-anexo.service';
import { ChamadoAtendimentoService } from '../src/modules/chamados/chamado-atendimento.service';
import { ChamadoAuthorizationService } from '../src/modules/chamados/chamado-authorization.service';
import { ChamadoCategoriaService } from '../src/modules/chamados/chamado-categoria.service';
import { ChamadoCategoriaConfigService } from '../src/modules/chamados/chamado-categoria-config.service';
import { ChamadoConfiguracaoService } from '../src/modules/chamados/chamado-configuracao.service';
import { ChamadoDashboardService } from '../src/modules/chamados/chamado-dashboard.service';
import { ChamadoHistoryService } from '../src/modules/chamados/chamado-history.service';
import { ChamadoGoogleEmailService } from '../src/modules/chamados/chamado-google-email.service';
import { ChamadoRelatorioService } from '../src/modules/chamados/chamado-relatorio.service';
import { ChamadoMensagemService } from '../src/modules/chamados/chamado-mensagem.service';
import { ChamadoNotificacaoService } from '../src/modules/chamados/chamado-notificacao.service';
import { ChamadoPrioridadeConfigService } from '../src/modules/chamados/chamado-prioridade-config.service';
import { ChamadoPrioridadeService } from '../src/modules/chamados/chamado-prioridade.service';
import { ChamadoResponsavelElegibilidadeService } from '../src/modules/chamados/chamado-responsavel-elegibilidade.service';
import { ChamadoResponsavelOptionsService } from '../src/modules/chamados/chamado-responsavel-options.service';
import { ChamadoResponsavelVinculoService } from '../src/modules/chamados/chamado-responsavel-vinculo.service';
import { ChamadoResponsavelService } from '../src/modules/chamados/chamado-responsavel.service';
import { ChamadoSlaConfigService } from '../src/modules/chamados/chamado-sla-config.service';
import { ChamadoSlaService } from '../src/modules/chamados/chamado-sla.service';
import { ChamadoStatusService } from '../src/modules/chamados/chamado-status.service';
import { ChamadoTipoConfigService } from '../src/modules/chamados/chamado-tipo-config.service';
import { ChamadosService } from '../src/modules/chamados/chamados.service';
import { ChamadoQueryService } from '../src/modules/chamados/queries/chamado-query.service';
import { EmpresaAcessoService } from '../src/modules/empresas/empresa-acesso.service';
import { EmpresaAdminService } from '../src/modules/empresas/empresa-admin.service';
import { EmpresaCatalogService } from '../src/modules/empresas/empresa-catalog.service';
import { EmpresasService } from '../src/modules/empresas/empresas.service';
import { GrupoUsuarioBootstrapService } from '../src/modules/grupos-usuarios/grupo-usuario-bootstrap.service';
import { GrupoUsuarioCatalogService } from '../src/modules/grupos-usuarios/grupo-usuario-catalog.service';
import { GrupoUsuarioPermissaoService } from '../src/modules/grupos-usuarios/grupo-usuario-permissao.service';
import { GruposUsuariosService } from '../src/modules/grupos-usuarios/grupos-usuarios.service';
import { ProjetoAuthorizationService } from '../src/modules/projetos/projeto-authorization.service';
import { ProjetoCatalogService } from '../src/modules/projetos/projeto-catalog.service';
import { ProjetoEquipeService } from '../src/modules/projetos/projeto-equipe.service';
import { ProjetoLifecycleService } from '../src/modules/projetos/projeto-lifecycle.service';
import { assertProjetoSituacaoTransition } from '../src/modules/projetos/policies/projeto-situacao.policy';
import { ProjetoPapel, ProjetoSituacao } from '../src/modules/projetos/types/projeto.types';
import { ProjetoKeyService } from '../src/modules/projetos/projeto-key.service';
import { ProjetoQueryService } from '../src/modules/projetos/projeto-query.service';
import { ProjetosService } from '../src/modules/projetos/projetos.service';
import { ServicoCatalogService } from '../src/modules/servicos/servico-catalog.service';
import { ServicosService } from '../src/modules/servicos/servicos.service';
import { FuncionalidadeAcaoService } from '../src/modules/solucoes/funcionalidade-acao.service';
import { FuncionalidadeAuthorizationService } from '../src/modules/solucoes/funcionalidade-authorization.service';
import { HubNavigationService } from '../src/modules/solucoes/hub-navigation.service';
import { SolucaoAcessoService } from '../src/modules/solucoes/solucao-acesso.service';
import { SolucaoBootstrapService } from '../src/modules/solucoes/solucao-bootstrap.service';
import { SolucaoChamadosBootstrapService } from '../src/modules/solucoes/solucao-chamados-bootstrap.service';
import { SolucaoProjetosBootstrapService } from '../src/modules/solucoes/solucao-projetos-bootstrap.service';
import { SolucaoCatalogService } from '../src/modules/solucoes/solucao-catalog.service';
import { SolucaoQueryService } from '../src/modules/solucoes/solucao-query.service';
import { SolucoesService } from '../src/modules/solucoes/solucoes.service';
import { UserCatalogService } from '../src/modules/users/user-catalog.service';
import { UserEmpresaService } from '../src/modules/users/user-empresa.service';
import { UserLookupService } from '../src/modules/users/user-lookup.service';
import { UserPasswordService } from '../src/modules/users/user-password.service';
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
  | 'chamadoTipo'
  | 'chamadoPrioridade'
  | 'chamadoNotificacao'
  | 'chamadoSlaRegra'
  | 'chamadoSequencia'
  | 'chamadoAcompanhante'
  | 'chamadoResponsavel'
  | 'chamadoResponsavelSolucao'
  | 'chamadoResponsavelFuncionalidade'
  | 'chamadoAnexo'
  | 'projeto'
  | 'projetoMembro';

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
  'chamadoTipo',
  'chamadoPrioridade',
  'chamadoNotificacao',
  'chamadoSlaRegra',
  'chamadoSequencia',
  'chamadoAcompanhante',
  'chamadoResponsavel',
  'chamadoResponsavelSolucao',
  'chamadoResponsavelFuncionalidade',
  'chamadoAnexo',
  'projeto',
  'projetoMembro'
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
  'chamadoTipo',
  'chamadoPrioridade',
  'chamadoNotificacao',
  'chamadoSlaRegra',
  'chamadoSequencia',
  'chamadoAcompanhante',
  'projetoMembro'
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
  empresaId_numero: ['empresaId', 'numero'],
  empresaId_chave: ['empresaId', 'chave'],
  empresaId_prioridadeId: ['empresaId', 'prioridadeId'],
  responsavelId_solucaoId: ['responsavelId', 'solucaoId'],
  responsavelSolucaoId_funcionalidadeId: ['responsavelSolucaoId', 'funcionalidadeId'],
  projetoId_usuarioId: ['projetoId', 'usuarioId']
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
  public chamadoTipo = new InMemoryDelegate(this, 'chamadoTipo');
  public chamadoPrioridade = new InMemoryDelegate(this, 'chamadoPrioridade');
  public chamadoNotificacao = new InMemoryDelegate(this, 'chamadoNotificacao');
  public chamadoSlaRegra = new InMemoryDelegate(this, 'chamadoSlaRegra');
  public chamadoSequencia = new InMemoryDelegate(this, 'chamadoSequencia');
  public chamadoAcompanhante = new InMemoryDelegate(this, 'chamadoAcompanhante');
  public chamadoResponsavel = new InMemoryDelegate(this, 'chamadoResponsavel');
  public chamadoResponsavelSolucao = new InMemoryDelegate(this, 'chamadoResponsavelSolucao');
  public chamadoResponsavelFuncionalidade = new InMemoryDelegate(this, 'chamadoResponsavelFuncionalidade');
  public chamadoAnexo = new InMemoryDelegate(this, 'chamadoAnexo');
  public projeto = new InMemoryDelegate(this, 'projeto');
  public projetoMembro = new InMemoryDelegate(this, 'projetoMembro');

  async $transaction<T>(callback: (tx: this) => Promise<T>): Promise<T> {
    const dataSnapshot = Object.fromEntries(
      MODELS.map((model) => [model, this.data[model].map((row) => ({ ...row }))])
    ) as Record<ModelName, AnyRecord[]>;
    const sequenceSnapshot = { ...this.sequences };

    try {
      return await callback(this);
    } catch (error) {
      this.data = dataSnapshot;
      this.sequences = sequenceSnapshot;
      throw error;
    }
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

      if (key === 'AND') {
        const clauses = Array.isArray(condition) ? condition : [condition];
        if (!clauses.every((clause) => this.matchesWhere(model, row, clause))) {
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
          const relCondition = condition as AnyRecord;

          if ('some' in relCondition || 'every' in relCondition || 'none' in relCondition) {
            if ('some' in relCondition && !relation.some((item) => this.matchesWhere(relationModel, item, relCondition.some))) {
              return false;
            }

            if ('every' in relCondition && !relation.every((item) => this.matchesWhere(relationModel, item, relCondition.every))) {
              return false;
            }

            if ('none' in relCondition && relation.some((item) => this.matchesWhere(relationModel, item, relCondition.none))) {
              return false;
            }

            continue;
          }

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

      if ('gt' in condition && !(value > condition.gt)) {
        return false;
      }

      if ('gte' in condition && !(value >= condition.gte)) {
        return false;
      }

      if ('lt' in condition && !(value < condition.lt)) {
        return false;
      }

      if ('lte' in condition && !(value <= condition.lte)) {
        return false;
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
    const nestedResponsavelSolucoes = model === 'chamadoResponsavel' ? data.solucoes?.create ?? [] : [];
    const nestedResponsavelFuncionalidades = model === 'chamadoResponsavelSolucao' ? data.funcionalidades?.create ?? [] : [];
    const nestedProjetoMembros = model === 'projeto' ? data.membros?.create ?? [] : [];
    const normalized = this.withDefaults(model, { ...data });
    delete normalized.empresas;
    delete normalized.solucoes;
    delete normalized.funcionalidades;
    delete normalized.membros;
    this.assertUnique(model, normalized);
    this.data[model].push(normalized);

    if (model === 'usuario') {
      for (const vinculo of nestedEmpresas) {
        this.createRow('empresaUsuario', {
          usuarioId: normalized.id,
          empresaId: vinculo.empresaId
        });
      }
    }

    if (model === 'chamadoResponsavel') {
      for (const solucao of nestedResponsavelSolucoes) {
        const funcionalidades = solucao.funcionalidades?.create ?? [];
        const responsavelSolucao = this.createRow('chamadoResponsavelSolucao', {
          ...solucao,
          responsavelId: normalized.id,
          funcionalidades: undefined
        });

        for (const funcionalidade of funcionalidades) {
          this.createRow('chamadoResponsavelFuncionalidade', {
            ...funcionalidade,
            responsavelSolucaoId: responsavelSolucao.id
          });
        }
      }
    }

    if (model === 'chamadoResponsavelSolucao') {
      for (const funcionalidade of nestedResponsavelFuncionalidades) {
        this.createRow('chamadoResponsavelFuncionalidade', {
          ...funcionalidade,
          responsavelSolucaoId: normalized.id
        });
      }
    }

    if (model === 'projeto') {
      for (const membro of nestedProjetoMembros) {
        this.createRow('projetoMembro', {
          ...membro,
          projetoId: normalized.id
        });
      }
    }

    return normalized;
  }

  private assertUnique(model: ModelName, candidate: AnyRecord, current?: AnyRecord): void {
    const duplicate = model === 'projeto'
      ? this.data.projeto.find((row) => row !== current && row.empresaId === candidate.empresaId && row.chave === candidate.chave)
      : model === 'projetoMembro'
        ? this.data.projetoMembro.find((row) => row !== current && row.projetoId === candidate.projetoId && row.usuarioId === candidate.usuarioId)
        : undefined;

    if (duplicate) {
      throw new Error(`Unique constraint failed on ${model}`);
    }
  }
  applyData(model: ModelName, row: AnyRecord, data: AnyRecord): void {
    const candidate = { ...row, ...data };
    this.assertUnique(model, candidate, row);

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

    if (['chamado', 'chamadoCategoria', 'chamadoTipo', 'chamadoPrioridade', 'chamadoSequencia', 'chamadoAcompanhante', 'chamadoResponsavel', 'chamadoResponsavelSolucao', 'chamadoResponsavelFuncionalidade', 'projeto'].includes(model)) {
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
      const filteredRelation = options.where
        ? relation.filter((item) => this.matchesWhere(relationModel, item, options.where))
        : relation;
      const ordered = this.orderRows(filteredRelation, options.orderBy);
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
      case 'grupoUsuario.usuarios':
        return this.data.usuario.filter((usuario) => usuario.grupoId === row.id);
      case 'grupoUsuario.solucoes':
        return this.data.grupoSolucao.filter((vinculo) => vinculo.grupoId === row.id);
      case 'grupoUsuario.funcionalidades':
        return this.data.grupoFuncionalidade.filter((vinculo) => vinculo.grupoId === row.id);
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
      case 'chamado.responsavelGrupo':
        return row.responsavelGrupoId ? this.data.grupoUsuario.find((grupo) => grupo.id === row.responsavelGrupoId) ?? null : null;
      case 'chamado.liderAtendimento':
        return row.liderAtendimentoId ? this.data.usuario.find((usuario) => usuario.id === row.liderAtendimentoId) ?? null : null;
      case 'chamado.solucao':
        return row.solucaoId ? this.data.solucao.find((solucao) => solucao.id === row.solucaoId) ?? null : null;
      case 'chamado.funcionalidade':
        return row.funcionalidadeId ? this.data.funcionalidade.find((funcionalidade) => funcionalidade.id === row.funcionalidadeId) ?? null : null;
      case 'chamado.categoria':
        return row.categoriaId ? this.data.chamadoCategoria.find((categoria) => categoria.id === row.categoriaId) ?? null : null;
      case 'chamado.tipoConfiguracao':
        return this.data.chamadoTipo.find((tipo) => tipo.id === row.tipoId) ?? null;
      case 'chamado.prioridadeConfiguracao':
        return this.data.chamadoPrioridade.find((prioridade) => prioridade.id === row.prioridadeId) ?? null;
      case 'chamado.slaRegra':
        return row.slaRegraId ? this.data.chamadoSlaRegra.find((regra) => regra.id === row.slaRegraId) ?? null : null;
      case 'chamadoNotificacao.chamado':
        return this.data.chamado.find((chamado) => chamado.id === row.chamadoId) ?? null;
      case 'chamadoSlaRegra.prioridade':
        return this.data.chamadoPrioridade.find((prioridade) => prioridade.id === row.prioridadeId) ?? null;
      case 'chamado.mensagens':
        return this.data.chamadoMensagem.filter((mensagem) => mensagem.chamadoId === row.id);
      case 'chamado.historico':
        return this.data.chamadoHistorico.filter((historico) => historico.chamadoId === row.id);
      case 'chamado.anexos':
        return this.data.chamadoAnexo.filter((anexo) => anexo.chamadoId === row.id);
      case 'chamado.acompanhantes':
        return this.data.chamadoAcompanhante.filter((acompanhante) => acompanhante.chamadoId === row.id);
      case 'chamadoMensagem.autor':
        return this.data.usuario.find((usuario) => usuario.id === row.autorId) ?? null;
      case 'chamadoMensagem.anexos':
        return this.data.chamadoAnexo.filter((anexo) => anexo.mensagemId === row.id);
      case 'chamadoAnexo.autor':
        return this.data.usuario.find((usuario) => usuario.id === row.autorId) ?? null;
      case 'chamadoAnexo.chamado':
        return this.data.chamado.find((chamado) => chamado.id === row.chamadoId) ?? null;
      case 'chamadoAnexo.mensagem':
        return row.mensagemId ? this.data.chamadoMensagem.find((mensagem) => mensagem.id === row.mensagemId) ?? null : null;
      case 'chamadoHistorico.usuario':
        return row.usuarioId ? this.data.usuario.find((usuario) => usuario.id === row.usuarioId) ?? null : null;
      case 'chamadoAcompanhante.usuario':
        return this.data.usuario.find((usuario) => usuario.id === row.usuarioId) ?? null;
      case 'chamadoAcompanhante.adicionadoPor':
        return row.adicionadoPorId ? this.data.usuario.find((usuario) => usuario.id === row.adicionadoPorId) ?? null : null;
      case 'chamadoAcompanhante.chamado':
        return this.data.chamado.find((chamado) => chamado.id === row.chamadoId) ?? null;
      case 'chamadoResponsavel.usuario':
        return row.usuarioId ? this.data.usuario.find((usuario) => usuario.id === row.usuarioId) ?? null : null;
      case 'chamadoResponsavel.grupo':
        return row.grupoId ? this.data.grupoUsuario.find((grupo) => grupo.id === row.grupoId) ?? null : null;
      case 'chamadoResponsavel.solucoes':
        return this.data.chamadoResponsavelSolucao.filter((solucao) => solucao.responsavelId === row.id);
      case 'chamadoResponsavelSolucao.responsavel':
        return this.data.chamadoResponsavel.find((responsavel) => responsavel.id === row.responsavelId) ?? null;
      case 'chamadoResponsavelSolucao.solucao':
        return this.data.solucao.find((solucao) => solucao.id === row.solucaoId) ?? null;
      case 'chamadoResponsavelSolucao.funcionalidades':
        return this.data.chamadoResponsavelFuncionalidade.filter((funcionalidade) => funcionalidade.responsavelSolucaoId === row.id);
      case 'chamadoResponsavelFuncionalidade.responsavelSolucao':
        return this.data.chamadoResponsavelSolucao.find((solucao) => solucao.id === row.responsavelSolucaoId) ?? null;
      case 'chamadoResponsavelFuncionalidade.funcionalidade':
        return this.data.funcionalidade.find((funcionalidade) => funcionalidade.id === row.funcionalidadeId) ?? null;
      case 'empresa.projetos':
        return this.data.projeto.filter((projeto) => projeto.empresaId === row.id);
      case 'usuario.projetosCriados':
        return this.data.projeto.filter((projeto) => projeto.criadoPorId === row.id);
      case 'usuario.projetosResponsavel':
        return this.data.projeto.filter((projeto) => projeto.responsavelId === row.id);
      case 'usuario.projetosArquivados':
        return this.data.projeto.filter((projeto) => projeto.arquivadoPorId === row.id);
      case 'usuario.projetosParticipacoes':
        return this.data.projetoMembro.filter((membro) => membro.usuarioId === row.id);
      case 'projeto.empresa':
        return this.data.empresa.find((empresa) => empresa.id === row.empresaId) ?? null;
      case 'projeto.responsavel':
        return this.data.usuario.find((usuario) => usuario.id === row.responsavelId) ?? null;
      case 'projeto.criadoPor':
        return this.data.usuario.find((usuario) => usuario.id === row.criadoPorId) ?? null;
      case 'projeto.arquivadoPor':
        return row.arquivadoPorId ? this.data.usuario.find((usuario) => usuario.id === row.arquivadoPorId) ?? null : null;
      case 'projeto.membros':
        return this.data.projetoMembro.filter((membro) => membro.projetoId === row.id);
      case 'projetoMembro.projeto':
        return this.data.projeto.find((projeto) => projeto.id === row.projetoId) ?? null;
      case 'projetoMembro.usuario':
        return this.data.usuario.find((usuario) => usuario.id === row.usuarioId) ?? null;
      default:
        return undefined;
    }
  }

  relationModel(model: ModelName, key: string): ModelName | null {
    const targets: Record<string, ModelName> = {
      'usuario.grupo': 'grupoUsuario',
      'usuario.empresas': 'empresaUsuario',
      'grupoUsuario.usuarios': 'usuario',
      'grupoUsuario.solucoes': 'grupoSolucao',
      'grupoUsuario.funcionalidades': 'grupoFuncionalidade',
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
      'chamado.responsavelGrupo': 'grupoUsuario',
      'chamado.liderAtendimento': 'usuario',
      'chamado.solucao': 'solucao',
      'chamado.funcionalidade': 'funcionalidade',
      'chamado.categoria': 'chamadoCategoria',
      'chamado.tipoConfiguracao': 'chamadoTipo',
      'chamado.prioridadeConfiguracao': 'chamadoPrioridade',
      'chamado.slaRegra': 'chamadoSlaRegra',
      'chamadoSlaRegra.prioridade': 'chamadoPrioridade',
      'chamadoNotificacao.chamado': 'chamado',
      'chamado.mensagens': 'chamadoMensagem',
      'chamado.historico': 'chamadoHistorico',
      'chamado.anexos': 'chamadoAnexo',
      'chamado.acompanhantes': 'chamadoAcompanhante',
      'chamadoMensagem.autor': 'usuario',
      'chamadoMensagem.anexos': 'chamadoAnexo',
      'chamadoAnexo.autor': 'usuario',
      'chamadoAnexo.chamado': 'chamado',
      'chamadoAnexo.mensagem': 'chamadoMensagem',
      'chamadoHistorico.usuario': 'usuario',
      'chamadoAcompanhante.usuario': 'usuario',
      'chamadoAcompanhante.adicionadoPor': 'usuario',
      'chamadoAcompanhante.chamado': 'chamado',
      'chamadoResponsavel.usuario': 'usuario',
      'chamadoResponsavel.grupo': 'grupoUsuario',
      'chamadoResponsavel.solucoes': 'chamadoResponsavelSolucao',
      'chamadoResponsavelSolucao.responsavel': 'chamadoResponsavel',
      'chamadoResponsavelSolucao.solucao': 'solucao',
      'chamadoResponsavelSolucao.funcionalidades': 'chamadoResponsavelFuncionalidade',
      'chamadoResponsavelFuncionalidade.responsavelSolucao': 'chamadoResponsavelSolucao',
      'chamadoResponsavelFuncionalidade.funcionalidade': 'funcionalidade',
      'empresa.projetos': 'projeto',
      'usuario.projetosCriados': 'projeto',
      'usuario.projetosResponsavel': 'projeto',
      'usuario.projetosArquivados': 'projeto',
      'usuario.projetosParticipacoes': 'projetoMembro',
      'projeto.empresa': 'empresa',
      'projeto.responsavel': 'usuario',
      'projeto.criadoPor': 'usuario',
      'projeto.arquivadoPor': 'usuario',
      'projeto.membros': 'projetoMembro',
      'projetoMembro.projeto': 'projeto',
      'projetoMembro.usuario': 'usuario'
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
        row.padraoSistema = row.padraoSistema ?? false;
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
        row.padraoSistema = row.padraoSistema ?? false;
        break;
      case 'empresa':
        row.nome = row.nome ?? null;
        row.acessoEcommerce = row.acessoEcommerce ?? false;
        row.acessoProjetos = row.acessoProjetos ?? false;
        row.acessoHoras = row.acessoHoras ?? false;
        row.padraoSistema = row.padraoSistema ?? false;
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
      case 'projeto':
        row.objetivo = row.objetivo ?? null;
        row.descricao = row.descricao ?? null;
        row.metodologia = row.metodologia ?? 'KANBAN';
        row.situacao = row.situacao ?? 'RASCUNHO';
        row.saude = row.saude ?? 'EM_DIA';
        row.inicioPrevistoEm = row.inicioPrevistoEm ?? null;
        row.fimPrevistoEm = row.fimPrevistoEm ?? null;
        row.inicioRealEm = row.inicioRealEm ?? null;
        row.fimRealEm = row.fimRealEm ?? null;
        row.arquivadoEm = row.arquivadoEm ?? null;
        row.arquivadoPorId = row.arquivadoPorId ?? null;
        row.criadoEm = row.criadoEm ?? now;
        row.atualizadoEm = row.atualizadoEm ?? now;
        break;
      case 'projetoMembro':
        row.papel = row.papel ?? 'MEMBRO';
        row.incluidoEm = row.incluidoEm ?? now;
        break;
      case 'chamado':
        row.status = row.status ?? 'ABERTO';
        row.tipo = row.tipo ?? 'SOLICITACAO';
        row.prioridade = row.prioridade ?? 'MEDIA';
        row.criadoEm = row.criadoEm ?? now;
        row.atualizadoEm = row.atualizadoEm ?? now;
        row.primeiraRespostaEm = row.primeiraRespostaEm ?? null;
        row.slaRegraId = row.slaRegraId ?? null;
        row.primeiraRespostaLimiteEm = row.primeiraRespostaLimiteEm ?? null;
        row.resolucaoLimiteEm = row.resolucaoLimiteEm ?? null;
        row.slaPausadoEm = row.slaPausadoEm ?? null;
        row.slaTempoPausadoMinutos = row.slaTempoPausadoMinutos ?? 0;
        row.slaStatus = row.slaStatus ?? 'SEM_SLA';
        row.resolvidoEm = row.resolvidoEm ?? null;
        row.encerradoEm = row.encerradoEm ?? null;
        row.responsavelId = row.responsavelId ?? null;
        row.responsavelGrupoId = row.responsavelGrupoId ?? null;
        row.liderAtendimentoId = row.liderAtendimentoId ?? null;
        row.atendimentoAssumidoEm = row.atendimentoAssumidoEm ?? null;
        row.solucaoId = row.solucaoId ?? null;
        row.funcionalidadeId = row.funcionalidadeId ?? null;
        row.categoriaId = row.categoriaId ?? null;
        row.versao = row.versao ?? 1;
        break;
      case 'chamadoMensagem':
      case 'chamadoHistorico':
        row.criadoEm = row.criadoEm ?? now;
        break;
      case 'chamadoAnexo':
        row.mensagemId = row.mensagemId ?? null;
        row.criadoEm = row.criadoEm ?? now;
        break;
      case 'chamadoAcompanhante':
        row.adicionadoPorId = row.adicionadoPorId ?? null;
        row.ativo = row.ativo ?? true;
        row.criadoEm = row.criadoEm ?? now;
        row.atualizadoEm = row.atualizadoEm ?? now;
        break;
      case 'chamadoResponsavel':
        row.tipo = row.tipo ?? 'USUARIO';
        row.usuarioId = row.usuarioId ?? null;
        row.grupoId = row.grupoId ?? null;
        row.ativo = row.ativo ?? true;
        row.criadoEm = row.criadoEm ?? now;
        row.atualizadoEm = row.atualizadoEm ?? now;
        break;
      case 'chamadoResponsavelSolucao':
        row.responsavelGeral = row.responsavelGeral ?? false;
        row.ativo = row.ativo ?? true;
        row.criadoEm = row.criadoEm ?? now;
        row.atualizadoEm = row.atualizadoEm ?? now;
        break;
      case 'chamadoResponsavelFuncionalidade':
        row.ativo = row.ativo ?? true;
        row.criadoEm = row.criadoEm ?? now;
        row.atualizadoEm = row.atualizadoEm ?? now;
        break;
      case 'chamadoCategoria':
      case 'chamadoTipo':
      case 'chamadoPrioridade':
        row.descricao = row.descricao ?? null;
        row.cor = row.cor ?? null;
        row.ordem = row.ordem ?? 0;
        row.ativo = row.ativo ?? true;
        row.criadoEm = row.criadoEm ?? now;
        row.atualizadoEm = row.atualizadoEm ?? now;
        break;
      case 'chamadoNotificacao':
        row.lidaEm = row.lidaEm ?? null;
        row.criadoEm = row.criadoEm ?? now;
        break;
      case 'chamadoSlaRegra':
        row.modoContagem = row.modoContagem ?? 'CORRIDO';
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
class TestChamadoAnexoStorage {
  private readonly root = mkdtempSync(join(tmpdir(), 'orfeu-chamados-'));

  async save(chamadoId: string, file: { originalname: string; buffer: Buffer; mimetype: string; size: number }) {
    const extension = extname(file.originalname || '').toLowerCase();
    const nomeArquivo = `${randomUUID()}${extension}`;
    const directory = join(this.root, chamadoId);
    const caminho = join(directory, nomeArquivo);

    mkdirSync(directory, { recursive: true });
    writeFileSync(caminho, file.buffer);

    return {
      nomeOriginal: file.originalname,
      nomeArquivo,
      caminho,
      mimeType: file.mimetype,
      tamanho: file.size
    };
  }

  resolve(caminho: string): string {
    return caminho;
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
  chamadoSlaService: ChamadoSlaService;
  projetosService: ProjetosService;
};

const asPrisma = (prisma: InMemoryPrismaService): PrismaService => prisma as unknown as PrismaService;

function createWorld(): TestWorld {
  const prisma = new InMemoryPrismaService();
  const prismaService = asPrisma(prisma);
  const funcionalidadeAcaoService = new FuncionalidadeAcaoService(prismaService);
  const solucaoAcessoService = new SolucaoAcessoService(prismaService, funcionalidadeAcaoService);
  const solucaoChamadosBootstrapService = new SolucaoChamadosBootstrapService(prismaService, funcionalidadeAcaoService, solucaoAcessoService);
  const solucaoProjetosBootstrapService = new SolucaoProjetosBootstrapService(prismaService, funcionalidadeAcaoService, solucaoAcessoService);
  const solucaoBootstrapService = new SolucaoBootstrapService(prismaService, funcionalidadeAcaoService, solucaoAcessoService, solucaoChamadosBootstrapService, solucaoProjetosBootstrapService);
  const solucaoQueryService = new SolucaoQueryService(prismaService);
  const solucaoCatalogService = new SolucaoCatalogService(prismaService, funcionalidadeAcaoService, solucaoAcessoService);
  const hubNavigationService = new HubNavigationService(solucaoAcessoService, solucaoQueryService);
  const solucoesService = new SolucoesService(solucaoAcessoService, solucaoBootstrapService, solucaoCatalogService, hubNavigationService, solucaoQueryService);
  const grupoUsuarioBootstrapService = new GrupoUsuarioBootstrapService(prismaService, solucoesService);
  const grupoUsuarioPermissaoService = new GrupoUsuarioPermissaoService();
  const grupoUsuarioCatalogService = new GrupoUsuarioCatalogService(prismaService, solucoesService, grupoUsuarioPermissaoService);
  const gruposService = new GruposUsuariosService(grupoUsuarioBootstrapService, grupoUsuarioCatalogService);
  const empresaAcessoService = new EmpresaAcessoService(prismaService, solucoesService);
  const empresaAdminService = new EmpresaAdminService(prismaService);
  const empresaCatalogService = new EmpresaCatalogService(prismaService, empresaAcessoService, empresaAdminService);
  const empresasService = new EmpresasService(empresaAcessoService, empresaCatalogService);
  const userEmpresaService = new UserEmpresaService(prismaService);
  const userPasswordService = new UserPasswordService(prismaService);
  const userLookupService = new UserLookupService(prismaService);
  const userCatalogService = new UserCatalogService(prismaService, userEmpresaService, userPasswordService);
  const usersService = new UsersService(userCatalogService, userLookupService, userPasswordService);
  const servicoCatalogService = new ServicoCatalogService(prismaService);
  const servicosService = new ServicosService(servicoCatalogService);
  const anexoStorage = new TestChamadoAnexoStorage();
  const chamadoQueryService = new ChamadoQueryService(prismaService);
  const funcionalidadeAuthorizationService = new FuncionalidadeAuthorizationService(solucoesService);
  const projetoAuthorizationService = new ProjetoAuthorizationService(funcionalidadeAuthorizationService);
  const projetoKeyService = new ProjetoKeyService(prismaService);
  const projetoQueryService = new ProjetoQueryService(prismaService, projetoAuthorizationService);
  const projetoCatalogService = new ProjetoCatalogService(prismaService, projetoAuthorizationService, projetoQueryService);
  const projetoEquipeService = new ProjetoEquipeService(prismaService, projetoAuthorizationService, projetoQueryService);
  const projetoLifecycleService = new ProjetoLifecycleService(prismaService, projetoAuthorizationService, projetoQueryService);
  const projetosService = new ProjetosService(projetoAuthorizationService, projetoCatalogService, projetoEquipeService, projetoLifecycleService, projetoKeyService, projetoQueryService);
  const chamadoAuthorizationService = new ChamadoAuthorizationService(prismaService, funcionalidadeAuthorizationService);
  const chamadoRelatorioService = new ChamadoRelatorioService(prismaService, chamadoAuthorizationService);
  const chamadoDashboardService = new ChamadoDashboardService(prismaService, chamadoAuthorizationService);
  const chamadoCategoriaConfigService = new ChamadoCategoriaConfigService(prismaService, chamadoAuthorizationService);
  const chamadoTipoConfigService = new ChamadoTipoConfigService(prismaService, chamadoAuthorizationService);
  const chamadoPrioridadeConfigService = new ChamadoPrioridadeConfigService(prismaService, chamadoAuthorizationService);
  const chamadoConfiguracaoService = new ChamadoConfiguracaoService(solucoesService, chamadoCategoriaConfigService, chamadoTipoConfigService, chamadoPrioridadeConfigService);
  const chamadoSlaConfigService = new ChamadoSlaConfigService(prismaService, chamadoAuthorizationService);
  const chamadoGoogleEmailService = { sendChamadoUpdate: async () => undefined } as unknown as ChamadoGoogleEmailService;
  const chamadoNotificacaoService = new ChamadoNotificacaoService(prismaService, chamadoAuthorizationService, chamadoGoogleEmailService);
  const chamadoSlaService = new ChamadoSlaService(prismaService, chamadoSlaConfigService, chamadoNotificacaoService);
  const chamadoResponsavelElegibilidadeService = new ChamadoResponsavelElegibilidadeService(prismaService, chamadoAuthorizationService);
  const chamadoResponsavelOptionsService = new ChamadoResponsavelOptionsService(prismaService, chamadoAuthorizationService, chamadoResponsavelElegibilidadeService);
  const chamadoResponsavelVinculoService = new ChamadoResponsavelVinculoService(prismaService);
  const chamadoResponsavelService = new ChamadoResponsavelService(prismaService, chamadoAuthorizationService, chamadoResponsavelElegibilidadeService, chamadoResponsavelOptionsService, chamadoResponsavelVinculoService);
  const chamadoAcompanhanteService = new ChamadoAcompanhanteService(prismaService, chamadoAuthorizationService, chamadoQueryService, chamadoResponsavelService);
  const chamadoAnexoService = new ChamadoAnexoService(prismaService, anexoStorage as any, chamadoQueryService, chamadoAuthorizationService);
  const chamadoHistoryService = new ChamadoHistoryService(prismaService, chamadoNotificacaoService);
  const chamadoCategoriaService = new ChamadoCategoriaService(chamadoAuthorizationService, chamadoQueryService, chamadoConfiguracaoService, chamadoHistoryService);
  const chamadoMensagemService = new ChamadoMensagemService(prismaService, chamadoQueryService, chamadoAuthorizationService, chamadoSlaService, chamadoNotificacaoService);
  const chamadoPrioridadeService = new ChamadoPrioridadeService(chamadoAuthorizationService, chamadoQueryService, chamadoConfiguracaoService, chamadoHistoryService, chamadoSlaService);
  const chamadoStatusService = new ChamadoStatusService(chamadoQueryService, chamadoAuthorizationService, chamadoHistoryService, chamadoSlaService);
  const chamadoAtendimentoService = new ChamadoAtendimentoService(chamadoQueryService, chamadoAuthorizationService, chamadoHistoryService, chamadoResponsavelService, chamadoAcompanhanteService);
  const chamadoAberturaService = new ChamadoAberturaService(prismaService, chamadoAuthorizationService, chamadoConfiguracaoService, chamadoResponsavelService, chamadoAcompanhanteService, chamadoSlaService, chamadoNotificacaoService);
  const chamadosService = new ChamadosService(chamadoAberturaService, chamadoDashboardService, chamadoRelatorioService, chamadoAnexoService, chamadoAtendimentoService, chamadoQueryService, chamadoAuthorizationService, chamadoConfiguracaoService, chamadoCategoriaService, chamadoMensagemService, chamadoPrioridadeService, chamadoResponsavelService, chamadoSlaConfigService, chamadoNotificacaoService, chamadoGoogleEmailService, chamadoStatusService, chamadoAcompanhanteService);
  const jwtService = new JwtService({ secret: 'integration-test-secret' });
  const configService = {
    get: (key: string) => ({ NODE_ENV: 'test', JWT_EXPIRES_IN: 3600 } as Record<string, unknown>)[key]
  } as ConfigService;
  const authCookieService = new AuthCookieService(configService);
  const authCredentialsService = new AuthCredentialsService(usersService);
  const authSessionService = new AuthSessionService(usersService, empresasService, solucoesService, jwtService);
  const authService = new AuthService(usersService, empresasService, authCookieService, authCredentialsService, authSessionService);

  return {
    prisma,
    solucoesService,
    gruposService,
    empresasService,
    usersService,
    authService,
    servicosService,
    chamadosService,
    chamadoSlaService,
    projetosService
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
async function seedChamadoConfiguracoes(world: TestWorld, empresaId: number) {
  await world.solucoesService.ensureDefaultChamadoConfiguracoesForEmpresa(empresaId);

  const tipos = {
    SOLICITACAO: expectDefined(await world.prisma.chamadoTipo.findFirst({ where: { empresaId, nome: 'Solicitacao' } })),
    INCIDENTE: expectDefined(await world.prisma.chamadoTipo.findFirst({ where: { empresaId, nome: 'Incidente' } })),
    DUVIDA: expectDefined(await world.prisma.chamadoTipo.findFirst({ where: { empresaId, nome: 'Duvida' } })),
    MELHORIA: expectDefined(await world.prisma.chamadoTipo.findFirst({ where: { empresaId, nome: 'Melhoria' } }))
  };
  const prioridades = {
    BAIXA: expectDefined(await world.prisma.chamadoPrioridade.findFirst({ where: { empresaId, nome: 'Baixa' } })),
    MEDIA: expectDefined(await world.prisma.chamadoPrioridade.findFirst({ where: { empresaId, nome: 'Media' } })),
    ALTA: expectDefined(await world.prisma.chamadoPrioridade.findFirst({ where: { empresaId, nome: 'Alta' } })),
    URGENTE: expectDefined(await world.prisma.chamadoPrioridade.findFirst({ where: { empresaId, nome: 'Urgente' } }))
  };

  return { tipos, prioridades };
}
describe('Fluxos integrados do backend', () => {
  it('representa projetos, participantes, relacoes e unicidade no Prisma em memoria', async () => {
    const { world, admin, empresaInicialId } = await bootstrapBaseWorld();
    const membro = await world.prisma.usuario.create({
      data: {
        nome: 'Membro Projeto',
        login: 'membro.projeto',
        email: 'membro.projeto@teste.com',
        senhaHash: 'hash'
      }
    });
    const projeto = await world.prisma.projeto.create({
      data: {
        empresaId: empresaInicialId,
        chave: 'ORF',
        nome: 'Orfeu Projetos',
        responsavelId: admin.sub,
        criadoPorId: admin.sub,
        membros: {
          create: [{ usuarioId: membro.id, papel: 'MEMBRO' }]
        }
      },
      include: {
        empresa: true,
        responsavel: true,
        criadoPor: true,
        membros: { include: { usuario: true } }
      }
    });

    expect(projeto.id).toEqual(expect.any(String));
    expect(projeto.metodologia).toBe('KANBAN');
    expect(projeto.situacao).toBe('RASCUNHO');
    expect(projeto.saude).toBe('EM_DIA');
    expect(projeto.empresa.id).toBe(empresaInicialId);
    expect(projeto.responsavel.id).toBe(admin.sub);
    expect(projeto.criadoPor.id).toBe(admin.sub);
    expect(projeto.membros).toHaveLength(1);
    expect(projeto.membros[0].usuario.id).toBe(membro.id);
    expect(await world.prisma.projeto.findUnique({
      where: { empresaId_chave: { empresaId: empresaInicialId, chave: 'ORF' } }
    })).toBeDefined();

    await expect(world.prisma.projeto.create({
      data: {
        empresaId: empresaInicialId,
        chave: 'ORF',
        nome: 'Chave repetida',
        responsavelId: admin.sub,
        criadoPorId: admin.sub
      }
    })).rejects.toThrow('Unique constraint failed on projeto');

    await expect(world.prisma.projetoMembro.create({
      data: { projetoId: projeto.id, usuarioId: membro.id, papel: 'OBSERVADOR' }
    })).rejects.toThrow('Unique constraint failed on projetoMembro');
  });
  it('consulta projetos com identidade, filtros, papeis, privacidade e participantes elegiveis', async () => {
    const { world, admin, empresaInicialId } = await bootstrapBaseWorld();
    const solucoes = await world.solucoesService.findAll();
    const projetosSolucao = expectDefined(solucoes.find((item) => item.slug === 'projetos'));
    const cadastroProjetos = expectDefined(projetosSolucao.funcionalidades.find((item) => item.slug === 'cadastro-de-projetos'));
    await world.solucoesService.syncCompanyAccess(
      empresaInicialId,
      [projetosSolucao.id],
      [cadastroProjetos.id]
    );
    const grupoProjetos = await world.prisma.grupoUsuario.create({
      data: { nome: 'Equipe Projetos', descricao: 'Acesso ao cadastro de projetos' }
    });
    await world.solucoesService.syncGroupAccess(
      grupoProjetos.id,
      [projetosSolucao.id],
      [cadastroProjetos.id],
      [buildPermissionForFeature(cadastroProjetos)]
    );

    const criarUsuario = async (login: string, nome: string, grupoId: number) => {
      const usuario = await world.prisma.usuario.create({
        data: { nome, login, email: `${login}@teste.com`, senhaHash: 'hash', grupoId }
      });
      await world.prisma.empresaUsuario.create({ data: { empresaId: empresaInicialId, usuarioId: usuario.id } });
      return {
        usuario,
        payload: {
          sub: usuario.id,
          nome,
          login,
          email: usuario.email,
          empresaId: empresaInicialId,
          grupo: {
            id: grupoProjetos.id,
            nome: grupoProjetos.nome,
            acessoEcommerce: false,
            acessoProjetos: false,
            acessoHoras: false,
            acessoConfigurador: false
          }
        } as JwtPayload
      };
    };
    const responsavel = await criarUsuario('responsavel.projeto', 'Responsavel Projeto', grupoProjetos.id);
    const membro = await criarUsuario('membro.consulta', 'Membro Consulta', grupoProjetos.id);
    const observador = await criarUsuario('observador.consulta', 'Observador Consulta', grupoProjetos.id);
    const externo = await criarUsuario('externo.consulta', 'Externo Consulta', grupoProjetos.id);
    const grupoSemProjetos = await world.prisma.grupoUsuario.create({ data: { nome: 'Sem Projetos' } });
    const inelegivel = await world.prisma.usuario.create({
      data: { nome: 'Usuario Inelegivel', login: 'usuario.inelegivel', email: 'inelegivel@teste.com', senhaHash: 'hash', grupoId: grupoSemProjetos.id }
    });
    await world.prisma.empresaUsuario.create({ data: { empresaId: empresaInicialId, usuarioId: inelegivel.id } });

    expect(await world.projetosService.sugerirChave('Gestao Agil', admin)).toBe('GA');
    await world.prisma.projeto.create({
      data: {
        empresaId: empresaInicialId,
        chave: 'GA',
        nome: 'Gestao Agil',
        metodologia: 'KANBAN',
        situacao: 'EM_ANDAMENTO',
        saude: 'EM_DIA',
        responsavelId: responsavel.usuario.id,
        criadoPorId: admin.sub,
        membros: {
          create: [
            { usuarioId: membro.usuario.id, papel: 'MEMBRO' },
            { usuarioId: observador.usuario.id, papel: 'OBSERVADOR' }
          ]
        }
      }
    });
    expect(await world.projetosService.sugerirChave('Gestao Agil', admin)).toBe('GA2');
    expect(await world.projetosService.sugerirChave('Árvore', admin)).toBe('ARVORE');
    expect(await world.projetosService.sugerirChave('123', admin)).toBe('P123');
    expect(await world.projetosService.sugerirChave('---', admin)).toBe('PRJ');

    const arquivado = await world.prisma.projeto.create({
      data: {
        empresaId: empresaInicialId,
        chave: 'SCRUM',
        nome: 'Projeto Scrum Arquivado',
        metodologia: 'SCRUM',
        situacao: 'PLANEJADO',
        saude: 'EM_RISCO',
        responsavelId: responsavel.usuario.id,
        criadoPorId: admin.sub,
        arquivadoEm: new Date(),
        arquivadoPorId: admin.sub
      }
    });
    const empresaExterna = await world.prisma.empresa.create({ data: { nome: 'Empresa Externa Projetos' } });
    await world.prisma.projeto.create({
      data: {
        empresaId: empresaExterna.id,
        chave: 'OUTRA',
        nome: 'Projeto de outra empresa',
        responsavelId: admin.sub,
        criadoPorId: admin.sub
      }
    });

    const paginaAdmin = await world.projetosService.projetos(admin, { limite: 1 });
    expect(paginaAdmin.total).toBe(1);
    expect(paginaAdmin.items).toHaveLength(1);
    expect(paginaAdmin.totalPaginas).toBe(1);
    const projetoAdmin = expectDefined(paginaAdmin.items[0]);
    expect(projetoAdmin.nome).toBe('Gestao Agil');
    expect(projetoAdmin.permissoes.podeGerenciarMembros).toBe(true);

    const filtrados = await world.projetosService.projetos(admin, {
      termo: 'Scrum',
      metodologia: 'SCRUM' as any,
      situacao: 'PLANEJADO' as any,
      saude: 'EM_RISCO' as any,
      incluirArquivados: true
    });
    expect(filtrados.items.map((item) => item.id)).toEqual([arquivado.id]);

    const paginaResponsavel = await world.projetosService.projetos(responsavel.payload);
    const paginaMembro = await world.projetosService.projetos(membro.payload);
    const paginaObservador = await world.projetosService.projetos(observador.payload);
    const paginaExterno = await world.projetosService.projetos(externo.payload);
    const projetoResponsavel = expectDefined(paginaResponsavel.items[0]);
    const projetoMembro = expectDefined(paginaMembro.items[0]);
    const projetoObservador = expectDefined(paginaObservador.items[0]);
    expect(projetoResponsavel.meuPapel).toBe('RESPONSAVEL');
    expect(projetoMembro.meuPapel).toBe('MEMBRO');
    expect(projetoMembro.permissoes.podeAlterar).toBe(true);
    expect(projetoObservador.meuPapel).toBe('OBSERVADOR');
    expect(projetoObservador.permissoes.podeAlterar).toBe(false);
    expect(paginaExterno.total).toBe(0);
    await expect(world.projetosService.projeto(projetoAdmin.id, externo.payload)).rejects.toThrow('Projeto nao encontrado.');
    await expect(world.projetosService.projeto(projetoAdmin.id, { ...admin, empresaId: empresaExterna.id })).rejects.toThrow('Projeto nao encontrado.');

    const participantes = await world.projetosService.participantesDisponiveis(admin);
    expect(participantes.map((item) => item.id)).toEqual(expect.arrayContaining([
      responsavel.usuario.id,
      membro.usuario.id,
      observador.usuario.id,
      externo.usuario.id
    ]));
    expect(participantes.map((item) => item.id)).not.toContain(inelegivel.id);
  });
  it('cria e edita projetos com transacao, equipe consistente, autorizacao e chave imutavel', async () => {
    const { world, admin, empresaInicialId } = await bootstrapBaseWorld();
    const solucoes = await world.solucoesService.findAll();
    const projetosSolucao = expectDefined(solucoes.find((item) => item.slug === 'projetos'));
    const cadastroProjetos = expectDefined(projetosSolucao.funcionalidades.find((item) => item.slug === 'cadastro-de-projetos'));
    await world.solucoesService.syncCompanyAccess(empresaInicialId, [projetosSolucao.id], [cadastroProjetos.id]);
    const grupoProjetos = await world.prisma.grupoUsuario.create({ data: { nome: 'Editores de Projetos' } });
    await world.solucoesService.syncGroupAccess(
      grupoProjetos.id,
      [projetosSolucao.id],
      [cadastroProjetos.id],
      [buildPermissionForFeature(cadastroProjetos)]
    );

    const criarUsuario = async (login: string, nome: string, vincularEmpresa = true) => {
      const usuario = await world.prisma.usuario.create({
        data: { nome, login, email: `${login}@projetos.com`, senhaHash: 'hash', grupoId: grupoProjetos.id }
      });

      if (vincularEmpresa) {
        await world.prisma.empresaUsuario.create({ data: { empresaId: empresaInicialId, usuarioId: usuario.id } });
      }

      return {
        usuario,
        payload: {
          sub: usuario.id,
          nome,
          login,
          email: usuario.email,
          empresaId: empresaInicialId,
          grupo: {
            id: grupoProjetos.id,
            nome: grupoProjetos.nome,
            acessoEcommerce: false,
            acessoProjetos: false,
            acessoHoras: false,
            acessoConfigurador: false
          }
        } as JwtPayload
      };
    };
    const responsavel = await criarUsuario('responsavel.edicao', 'Responsavel Edicao');
    const membro = await criarUsuario('membro.edicao', 'Membro Edicao');
    const observador = await criarUsuario('observador.edicao', 'Observador Edicao');
    const usuarioOutraEmpresa = await criarUsuario('outra.empresa', 'Usuario Outra Empresa', false);
    const grupoSemAcesso = await world.prisma.grupoUsuario.create({ data: { nome: 'Sem Acesso a Projetos' } });
    const usuarioSemAcesso = await world.prisma.usuario.create({
      data: { nome: 'Usuario Sem Acesso', login: 'sem.acesso.projetos', email: 'sem.acesso@projetos.com', senhaHash: 'hash', grupoId: grupoSemAcesso.id }
    });
    await world.prisma.empresaUsuario.create({ data: { empresaId: empresaInicialId, usuarioId: usuarioSemAcesso.id } });

    const projetoProprio = await world.projetosService.create({
      chave: 'ADM',
      nome: 'Projeto do administrador',
      metodologia: 'KANBAN' as any,
      responsavelId: admin.sub
    }, admin);
    expect(projetoProprio.responsavelId).toBe(admin.sub);
    expect(projetoProprio.situacao).toBe('RASCUNHO');
    expect(projetoProprio.saude).toBe('EM_DIA');

    const projetoEquipe = await world.projetosService.create({
      chave: 'EQP',
      nome: 'Projeto com equipe',
      objetivo: ' Objetivo inicial ',
      metodologia: 'SCRUM' as any,
      situacao: 'PLANEJADO' as any,
      responsavelId: responsavel.usuario.id,
      inicioPrevistoEm: '2026-08-01',
      fimPrevistoEm: '2026-12-15',
      participantes: [
        { usuarioId: membro.usuario.id, papel: 'MEMBRO' as any },
        { usuarioId: observador.usuario.id, papel: 'OBSERVADOR' as any }
      ]
    }, admin);
    expect(projetoEquipe.membros.map((item) => [item.usuarioId, item.papel])).toEqual(expect.arrayContaining([
      [admin.sub, 'MEMBRO'],
      [membro.usuario.id, 'MEMBRO'],
      [observador.usuario.id, 'OBSERVADOR']
    ]));
    expect(projetoEquipe.membros.some((item) => item.usuarioId === responsavel.usuario.id)).toBe(false);

    await expect(world.projetosService.create({
      chave: 'invalida!',
      nome: 'Chave invalida',
      metodologia: 'KANBAN' as any,
      responsavelId: admin.sub
    }, admin)).rejects.toThrow('A chave deve ter de 2 a 10 caracteres');
    await expect(world.projetosService.create({
      chave: 'EQP',
      nome: 'Chave duplicada',
      metodologia: 'KANBAN' as any,
      responsavelId: admin.sub
    }, admin)).rejects.toThrow('Ja existe um projeto com esta chave');
    await expect(world.projetosService.create({
      chave: 'DUP',
      nome: 'Responsavel duplicado',
      metodologia: 'KANBAN' as any,
      responsavelId: responsavel.usuario.id,
      participantes: [{ usuarioId: responsavel.usuario.id, papel: 'MEMBRO' as any }]
    }, admin)).rejects.toThrow('O responsavel nao pode ser duplicado');
    await expect(world.projetosService.create({
      chave: 'EXT',
      nome: 'Participante externo',
      metodologia: 'KANBAN' as any,
      responsavelId: responsavel.usuario.id,
      participantes: [{ usuarioId: usuarioOutraEmpresa.usuario.id, papel: 'MEMBRO' as any }]
    }, admin)).rejects.toThrow('devem pertencer a empresa');
    await expect(world.projetosService.create({
      chave: 'SEM',
      nome: 'Participante sem acesso',
      metodologia: 'KANBAN' as any,
      responsavelId: responsavel.usuario.id,
      participantes: [{ usuarioId: usuarioSemAcesso.id, papel: 'MEMBRO' as any }]
    }, admin)).rejects.toThrow('devem pertencer a empresa');    await expect(world.projetosService.create({
      chave: 'STS',
      nome: 'Situacao inicial invalida',
      metodologia: 'KANBAN' as any,
      situacao: 'EM_ANDAMENTO' as any,
      responsavelId: admin.sub
    }, admin)).rejects.toThrow('A situacao inicial deve ser');

    const originalCreateMany = world.prisma.projetoMembro.createMany.bind(world.prisma.projetoMembro);
    world.prisma.projetoMembro.createMany = async () => { throw new Error('falha simulada nos membros'); };
    await expect(world.projetosService.create({
      chave: 'RBK',
      nome: 'Projeto rollback',
      metodologia: 'KANBAN' as any,
      responsavelId: responsavel.usuario.id
    }, admin)).rejects.toThrow('falha simulada nos membros');
    world.prisma.projetoMembro.createMany = originalCreateMany;
    expect(await world.prisma.projeto.findUnique({
      where: { empresaId_chave: { empresaId: empresaInicialId, chave: 'RBK' } }
    })).toBeNull();

    const editadoResponsavel = await world.projetosService.update({
      id: projetoEquipe.id,
      nome: 'Projeto editado pelo responsavel',
      metodologia: 'HIBRIDA' as any
    }, responsavel.payload);
    expect(editadoResponsavel.nome).toBe('Projeto editado pelo responsavel');
    const editadoMembro = await world.projetosService.update({
      id: projetoEquipe.id,
      descricao: 'Editado pelo membro',
      fimPrevistoEm: '2027-01-15',
      chave: 'NOVA' as never
    } as any, membro.payload);
    expect(editadoMembro.descricao).toBe('Editado pelo membro');
    expect(editadoMembro.chave).toBe('EQP');
    await expect(world.projetosService.update({
      id: projetoEquipe.id,
      nome: 'Observador nao pode editar'
    }, observador.payload)).rejects.toThrow('Usuario sem permissao para alterar este projeto.');
    const editadoAdmin = await world.projetosService.update({
      id: projetoEquipe.id,
      objetivo: 'Editado pelo administrador'
    }, admin);
    expect(editadoAdmin.objetivo).toBe('Editado pelo administrador');
  });
  it('mantem equipe, ciclo de vida, arquivamento e matriz de autorizacao dos projetos', async () => {
    const { world, admin, empresaInicialId } = await bootstrapBaseWorld();
    const solucoes = await world.solucoesService.findAll();
    const projetosSolucao = expectDefined(solucoes.find((item) => item.slug === 'projetos'));
    const cadastroProjetos = expectDefined(projetosSolucao.funcionalidades.find((item) => item.slug === 'cadastro-de-projetos'));
    await world.solucoesService.syncCompanyAccess(empresaInicialId, [projetosSolucao.id], [cadastroProjetos.id]);
    const grupo = await world.prisma.grupoUsuario.create({ data: { nome: 'Governanca de Projetos' } });
    await world.solucoesService.syncGroupAccess(
      grupo.id,
      [projetosSolucao.id],
      [cadastroProjetos.id],
      [buildPermissionForFeature(cadastroProjetos)]
    );

    const criarUsuario = async (login: string, nome: string, grupoId = grupo.id) => {
      const usuario = await world.prisma.usuario.create({
        data: { nome, login, email: `${login}@governanca.com`, senhaHash: 'hash', grupoId }
      });
      await world.prisma.empresaUsuario.create({ data: { empresaId: empresaInicialId, usuarioId: usuario.id } });
      return {
        usuario,
        payload: {
          sub: usuario.id,
          nome,
          login,
          email: usuario.email,
          empresaId: empresaInicialId,
          grupo: {
            id: grupoId,
            nome: grupoId === grupo.id ? grupo.nome : 'Grupo restrito',
            acessoEcommerce: false,
            acessoProjetos: false,
            acessoHoras: false,
            acessoConfigurador: false
          }
        } as JwtPayload
      };
    };
    const responsavel = await criarUsuario('responsavel.ciclo', 'Responsavel Ciclo');
    const novoResponsavel = await criarUsuario('novo.responsavel', 'Novo Responsavel');
    const membro = await criarUsuario('membro.ciclo', 'Membro Ciclo');
    const observador = await criarUsuario('observador.ciclo', 'Observador Ciclo');
    const grupoRestrito = await world.prisma.grupoUsuario.create({ data: { nome: 'Projetos Sem Alterar Status' } });
    const permissaoRestrita = buildPermissionForFeature(cadastroProjetos);
    permissaoRestrita.acoes = permissaoRestrita.acoes.map((acao) => ({
      ...acao,
      permitido: acao.chave === 'visualizar'
    }));
    await world.solucoesService.syncGroupAccess(
      grupoRestrito.id,
      [projetosSolucao.id],
      [cadastroProjetos.id],
      [permissaoRestrita]
    );
    const membroRestrito = await criarUsuario('membro.restrito', 'Membro Restrito', grupoRestrito.id);

    const projeto = await world.projetosService.create({
      chave: 'CICLO',
      nome: 'Projeto Ciclo Completo',
      metodologia: 'KANBAN' as any,
      responsavelId: responsavel.usuario.id,
      participantes: [
        { usuarioId: membro.usuario.id, papel: 'MEMBRO' as any },
        { usuarioId: observador.usuario.id, papel: 'OBSERVADOR' as any },
        { usuarioId: membroRestrito.usuario.id, papel: 'MEMBRO' as any }
      ]
    }, admin);

    const equipeTransferida = await world.projetosService.updateEquipe({
      projetoId: projeto.id,
      responsavelId: novoResponsavel.usuario.id,
      participantes: [
        { usuarioId: novoResponsavel.usuario.id, papel: 'OBSERVADOR' as any },
        { usuarioId: membro.usuario.id, papel: 'MEMBRO' as any },
        { usuarioId: observador.usuario.id, papel: 'OBSERVADOR' as any },
        { usuarioId: membroRestrito.usuario.id, papel: 'MEMBRO' as any }
      ]
    }, responsavel.payload);
    expect(equipeTransferida.responsavelId).toBe(novoResponsavel.usuario.id);
    expect(equipeTransferida.membros.map((item) => [item.usuarioId, item.papel])).toEqual(expect.arrayContaining([
      [responsavel.usuario.id, 'MEMBRO'],
      [membro.usuario.id, 'MEMBRO'],
      [observador.usuario.id, 'OBSERVADOR']
    ]));
    expect(equipeTransferida.membros.some((item) => item.usuarioId === novoResponsavel.usuario.id)).toBe(false);
    const originalEquipeCreateMany = world.prisma.projetoMembro.createMany.bind(world.prisma.projetoMembro);
    world.prisma.projetoMembro.createMany = async () => { throw new Error('falha simulada na equipe'); };
    await expect(world.projetosService.updateEquipe({
      projetoId: projeto.id,
      responsavelId: responsavel.usuario.id,
      participantes: [{ usuarioId: membro.usuario.id, papel: 'MEMBRO' as any }]
    }, novoResponsavel.payload)).rejects.toThrow('falha simulada na equipe');
    world.prisma.projetoMembro.createMany = originalEquipeCreateMany;
    const equipeAposRollback = await world.projetosService.projeto(projeto.id, novoResponsavel.payload);
    expect(equipeAposRollback.responsavelId).toBe(novoResponsavel.usuario.id);
    expect(equipeAposRollback.membros.map((item) => item.usuarioId)).toEqual(
      expect.arrayContaining(equipeTransferida.membros.map((item) => item.usuarioId))
    );
    await expect(world.projetosService.updateEquipe({
      projetoId: projeto.id,
      responsavelId: novoResponsavel.usuario.id,
      participantes: []
    }, responsavel.payload)).rejects.toThrow('Usuario sem permissao para gerenciar a equipe');

    const allowedTransitions: Array<[ProjetoSituacao, ProjetoSituacao]> = [
      [ProjetoSituacao.RASCUNHO, ProjetoSituacao.PLANEJADO],
      [ProjetoSituacao.RASCUNHO, ProjetoSituacao.CANCELADO],
      [ProjetoSituacao.PLANEJADO, ProjetoSituacao.EM_ANDAMENTO],
      [ProjetoSituacao.PLANEJADO, ProjetoSituacao.PAUSADO],
      [ProjetoSituacao.PLANEJADO, ProjetoSituacao.CANCELADO],
      [ProjetoSituacao.EM_ANDAMENTO, ProjetoSituacao.PAUSADO],
      [ProjetoSituacao.EM_ANDAMENTO, ProjetoSituacao.CONCLUIDO],
      [ProjetoSituacao.EM_ANDAMENTO, ProjetoSituacao.CANCELADO],
      [ProjetoSituacao.PAUSADO, ProjetoSituacao.PLANEJADO],
      [ProjetoSituacao.PAUSADO, ProjetoSituacao.EM_ANDAMENTO],
      [ProjetoSituacao.PAUSADO, ProjetoSituacao.CANCELADO],
      [ProjetoSituacao.CONCLUIDO, ProjetoSituacao.PLANEJADO],
      [ProjetoSituacao.CANCELADO, ProjetoSituacao.PLANEJADO]
    ];
    for (const [atual, nova] of allowedTransitions) {
      expect(() => assertProjetoSituacaoTransition(atual, nova, ProjetoPapel.RESPONSAVEL, false)).not.toThrow();
    }
    expect(() => assertProjetoSituacaoTransition(
      ProjetoSituacao.RASCUNHO,
      ProjetoSituacao.CONCLUIDO,
      ProjetoPapel.RESPONSAVEL,
      false
    )).toThrow('nao permitida');
    expect(() => assertProjetoSituacaoTransition(
      ProjetoSituacao.CONCLUIDO,
      ProjetoSituacao.PLANEJADO,
      ProjetoPapel.MEMBRO,
      false
    )).toThrow('Apenas o responsavel');

    const planejado = await world.projetosService.atualizarCiclo({
      projetoId: projeto.id,
      situacao: 'PLANEJADO' as any,
      saude: 'EM_RISCO' as any
    }, membro.payload);
    expect(planejado.saude).toBe('EM_RISCO');
    const emAndamento = await world.projetosService.atualizarCiclo({
      projetoId: projeto.id,
      situacao: 'EM_ANDAMENTO' as any
    }, membro.payload);
    expect(emAndamento.inicioRealEm).toBeInstanceOf(Date);
    const primeiroInicio = emAndamento.inicioRealEm?.getTime();
    await world.projetosService.atualizarCiclo({ projetoId: projeto.id, situacao: 'PAUSADO' as any }, membro.payload);
    const retomado = await world.projetosService.atualizarCiclo({ projetoId: projeto.id, situacao: 'EM_ANDAMENTO' as any }, membro.payload);
    expect(retomado.inicioRealEm?.getTime()).toBe(primeiroInicio);
    const concluido = await world.projetosService.atualizarCiclo({ projetoId: projeto.id, situacao: 'CONCLUIDO' as any }, membro.payload);
    expect(concluido.fimRealEm).toBeInstanceOf(Date);
    await expect(world.projetosService.atualizarCiclo({
      projetoId: projeto.id,
      situacao: 'PLANEJADO' as any
    }, membro.payload)).rejects.toThrow('Apenas o responsavel');
    const reaberto = await world.projetosService.atualizarCiclo({
      projetoId: projeto.id,
      situacao: 'PLANEJADO' as any
    }, novoResponsavel.payload);
    expect(reaberto.fimRealEm).toBeNull();
    expect(reaberto.inicioRealEm?.getTime()).toBe(primeiroInicio);
    await expect(world.projetosService.atualizarCiclo({
      projetoId: projeto.id,
      saude: 'ATRASADO' as any
    }, observador.payload)).rejects.toThrow('Usuario sem permissao para alterar o ciclo de vida');
    await expect(world.projetosService.atualizarCiclo({
      projetoId: projeto.id,
      saude: 'ATRASADO' as any
    }, membroRestrito.payload)).rejects.toThrow('Usuario sem permissao para executar esta acao.');

    await expect(world.projetosService.arquivar(projeto.id, membro.payload)).rejects.toThrow('Usuario sem permissao para arquivar');
    const arquivado = await world.projetosService.arquivar(projeto.id, novoResponsavel.payload);
    expect(arquivado.arquivadoEm).toBeInstanceOf(Date);
    expect(arquivado.arquivadoPor?.id).toBe(novoResponsavel.usuario.id);
    expect(arquivado.situacao).toBe('PLANEJADO');
    expect(arquivado.membros).toHaveLength(equipeTransferida.membros.length);
    expect((await world.projetosService.projetos(novoResponsavel.payload)).items.map((item) => item.id)).not.toContain(projeto.id);
    expect((await world.projetosService.projetos(novoResponsavel.payload, { incluirArquivados: true })).items.map((item) => item.id)).toContain(projeto.id);
    await expect(world.projetosService.reativar(projeto.id, membro.payload)).rejects.toThrow('Usuario sem permissao para reativar');
    const reativado = await world.projetosService.reativar(projeto.id, novoResponsavel.payload);
    expect(reativado.arquivadoEm).toBeNull();
    expect(reativado.arquivadoPor).toBeNull();
    expect(reativado.situacao).toBe('PLANEJADO');

    const empresaExterna = await world.prisma.empresa.create({ data: { nome: 'Empresa Isolada Ciclo' } });
    await expect(world.projetosService.arquivar(projeto.id, { ...admin, empresaId: empresaExterna.id })).rejects.toThrow('Projeto nao encontrado.');
    const cicloAdmin = await world.projetosService.atualizarCiclo({
      projetoId: projeto.id,
      situacao: 'PAUSADO' as any
    }, admin);
    expect(cicloAdmin.situacao).toBe('PAUSADO');
  });
  it('cadastra grupo, usuario e empresa, vincula acesso a solucoes/funcionalidades e valida o hub', async () => {
    const { world, admin, empresaInicialId } = await bootstrapBaseWorld();
    const solucoes = await world.solucoesService.findAll();
    const controleChamados = expectDefined(solucoes.find((solucao) => solucao.slug === 'controle-de-chamados'));
    const funcionalidadesControle = controleChamados.funcionalidades;
    const projetos = expectDefined(solucoes.find((solucao) => solucao.slug === 'projetos'));
    const cadastroProjetos = expectDefined(projetos.funcionalidades.find((funcionalidade) => funcionalidade.slug === 'cadastro-de-projetos'));
    expect(projetos.funcionalidades.map((funcionalidade) => [funcionalidade.slug, funcionalidade.ordem])).toEqual([
      ['cadastro-de-projetos', 10],
      ['backlog-de-demandas', 20],
      ['marcos-e-entregas', 30],
      ['comunicacao-do-projeto', 40]
    ]);
    expect(cadastroProjetos.registryKey).toBe('projetos.cadastro-de-projetos');
    expect(cadastroProjetos.acoes.map((acao) => acao.chave)).toEqual(expect.arrayContaining([
      'visualizar',
      'incluir',
      'alterar',
      'excluir',
      'gerenciar_membros',
      'alterar_status',
      'reativar_projeto'
    ]));
    const projetosAntesDoSegundoBootstrap = projetos.funcionalidades.map((funcionalidade) => ({
      id: funcionalidade.id,
      slug: funcionalidade.slug,
      ordem: funcionalidade.ordem,
      registryKey: funcionalidade.registryKey,
      acoes: funcionalidade.acoes.map((acao) => acao.chave).sort()
    }));
    await world.solucoesService.ensureProjetosSolution();
    const solucoesAposSegundoBootstrap = await world.solucoesService.findAll();
    const projetosAposSegundoBootstrap = expectDefined(solucoesAposSegundoBootstrap.find((solucao) => solucao.slug === 'projetos'));
    expect(solucoesAposSegundoBootstrap.filter((solucao) => solucao.slug === 'projetos')).toHaveLength(1);
    expect(projetosAposSegundoBootstrap.funcionalidades.map((funcionalidade) => ({
      id: funcionalidade.id,
      slug: funcionalidade.slug,
      ordem: funcionalidade.ordem,
      registryKey: funcionalidade.registryKey,
      acoes: funcionalidade.acoes.map((acao) => acao.chave).sort()
    }))).toEqual(projetosAntesDoSegundoBootstrap);

    const empresaPadraoAlterada = await world.empresasService.update({
      id: empresaInicialId,
      nome: 'Empresa Padrao Alterada Integracao'
    }, admin);
    expect(empresaPadraoAlterada.nome).toBe('Empresa Padrao Alterada Integracao');
    expect(empresaPadraoAlterada.padraoSistema).toBe(true);
    await expect(world.empresasService.remove(empresaInicialId, admin)).rejects.toThrow('A empresa padrao do sistema nao pode ser excluida.');

    const grupoAdminInicial = expectDefined(await world.gruposService.findById(admin.grupo?.id));
    const grupoAdminAlterado = await world.gruposService.update({
      id: grupoAdminInicial.id,
      nome: 'Grupo Administradores Padrao Integracao'
    });
    expect(grupoAdminAlterado.nome).toBe('Grupo Administradores Padrao Integracao');
    expect(grupoAdminAlterado.padraoSistema).toBe(true);
    await expect(world.gruposService.remove(grupoAdminInicial.id)).rejects.toThrow('O grupo Administradores padrao do sistema nao pode ser excluido.');

    const usuarioAdminAlterado = await world.usersService.update({
      id: admin.sub,
      nome: 'Administrador Padrao Integracao'
    });
    expect(usuarioAdminAlterado.nome).toBe('Administrador Padrao Integracao');
    expect(usuarioAdminAlterado.padraoSistema).toBe(true);
    await expect(world.usersService.remove(admin.sub)).rejects.toThrow('O usuario administrador padrao do sistema nao pode ser excluido.');
    expect(funcionalidadesControle.map((funcionalidade) => funcionalidade.slug).sort()).toEqual([
      'abrir-chamado',
      'categorias',
      'chamados-arquivados',
      'dashboard',
      'emails-solucoes',
      'meus-chamados',
      'painel-atendimento',
      'prioridades',
      'relatorios',
      'responsaveis',
      'sla',
      'tipos'
    ]);

    expect(await world.prisma.chamadoTipo.count({ where: { empresaId: empresaInicialId } })).toBe(0);
    expect(await world.chamadosService.tiposChamado(admin)).toHaveLength(4);
    expect(await world.chamadosService.prioridadesChamado(admin)).toHaveLength(4);
    const empresaSemChamados = await world.empresasService.create({
      nome: 'Empresa Sem Chamados Integracao',
      solucaoIds: [],
      funcionalidadeIds: []
    }, admin);

    expect(await world.prisma.chamadoTipo.count({ where: { empresaId: empresaSemChamados.id } })).toBe(0);
    expect(await world.prisma.chamadoPrioridade.count({ where: { empresaId: empresaSemChamados.id } })).toBe(0);
    await world.empresasService.update({
      id: empresaSemChamados.id,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: funcionalidadesControle.map((funcionalidade) => funcionalidade.id)
    }, admin);

    expect(await world.prisma.chamadoTipo.count({ where: { empresaId: empresaSemChamados.id } })).toBe(4);
    expect(await world.prisma.chamadoPrioridade.count({ where: { empresaId: empresaSemChamados.id } })).toBe(4);
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

    expect(await world.prisma.chamadoTipo.count({ where: { empresaId: empresa.id } })).toBe(4);
    expect(await world.prisma.chamadoPrioridade.count({ where: { empresaId: empresa.id } })).toBe(4);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);

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
    expect(controleNoHub.funcionalidades).toHaveLength(12);
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
    const arquivados = expectDefined(features.find((feature) => feature.slug === 'chamados-arquivados'));
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
          podeExcluir: true,
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
      funcionalidadeIds: [painel.id, arquivados.id, categorias.id, meus.id],
      funcionalidadePermissoes: [painel, arquivados, categorias, meus].map(buildPermissionForFeature)
    });

    const empresa = await world.empresasService.create({
      nome: 'Empresa Chamados Integracao',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: features.map((feature) => feature.id)
    }, admin);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);
    const adminEmpresa = { ...admin, empresaId: empresa.id };
    const regraAlta = await world.chamadosService.createRegraSla({
      prioridadeId: chamadoConfigs.prioridades.ALTA.id,
      primeiraRespostaPrazoMinutos: 120,
      resolucaoPrazoMinutos: 480,
      modoContagem: 'CORRIDO',
      ativo: true
    }, adminEmpresa);
    const regraUrgente = await world.chamadosService.createRegraSla({
      prioridadeId: chamadoConfigs.prioridades.URGENTE.id,
      primeiraRespostaPrazoMinutos: 30,
      resolucaoPrazoMinutos: 120,
      modoContagem: 'CORRIDO',
      ativo: true
    }, adminEmpresa);

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
      tipoId: chamadoConfigs.tipos.INCIDENTE.id,
      prioridadeId: chamadoConfigs.prioridades.ALTA.id,
      categoriaId: categoria.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, solicitantePayload);

    expect(chamado.numero).toBe(1);
    expect(chamado.status).toBe('ABERTO');
    expect(chamado.solicitanteNome).toBe(solicitante.nome);
    expect(chamado.slaRegraId).toBe(regraAlta.id);
    expect(chamado.slaStatus).toBe('NO_PRAZO');

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

    const transferido = await world.chamadosService.transferirChamado({
      chamadoId: chamado.id,
      responsavelId: atendente.id
    }, atendentePayload);
    expect(transferido.responsavelNome).toBe(atendente.nome);
    expect(transferido.historico.find((item) => item.evento === 'TRANSFERENCIA')?.valorNovo).toBe(atendente.nome);
    const limiteAntesDaPausa = expectDefined(transferido.resolucaoLimiteEm);
    const pausado = await world.chamadosService.alterarStatusChamado({
      chamadoId: chamado.id,
      status: 'PENDENTE'
    }, atendentePayload);
    expect(pausado.slaStatus).toBe('PAUSADO');
    expect(pausado.slaPausadoEm).toBeInstanceOf(Date);

    const retomado = await world.chamadosService.alterarStatusChamado({
      chamadoId: chamado.id,
      status: 'EM_ATENDIMENTO'
    }, atendentePayload);
    expect(retomado.slaStatus).not.toBe('PAUSADO');
    expect(retomado.slaPausadoEm).toBeNull();
    expect(retomado.slaTempoPausadoMinutos).toBeGreaterThanOrEqual(0);
    expect(expectDefined(retomado.resolucaoLimiteEm).getTime()).toBeGreaterThanOrEqual(limiteAntesDaPausa.getTime());


    const respondido = await world.chamadosService.responderChamado({
      chamadoId: chamado.id,
      conteudo: 'Estamos analisando o incidente.'
    }, atendentePayload);
    expect(respondido.mensagens).toHaveLength(1);
    expect(respondido.primeiraRespostaEm).toBeInstanceOf(Date);
    expect(respondido.slaStatus).toMatch(/NO_PRAZO|PERTO_DO_VENCIMENTO/);

    const urgente = await world.chamadosService.alterarPrioridadeChamado({ chamadoId: chamado.id, prioridadeId: chamadoConfigs.prioridades.URGENTE.id }, atendentePayload);
    expect(urgente.prioridadeId).toBe(chamadoConfigs.prioridades.URGENTE.id);
    expect(urgente.slaRegraId).toBe(regraUrgente.id);
    expect(urgente.slaStatus).toMatch(/NO_PRAZO|PERTO_DO_VENCIMENTO/);

    const resolvido = await world.chamadosService.resolverChamado(chamado.id, atendentePayload, 'VPN restabelecida.');
    expect(resolvido.status).toBe('RESOLVIDO');
    expect(resolvido.resolvidoEm).toBeInstanceOf(Date);
    expect(resolvido.slaStatus).toMatch(/NO_PRAZO|ATRASADO/);

    const reaberto = await world.chamadosService.reabrirChamado(chamado.id, solicitantePayload, 'Problema voltou a ocorrer.');
    expect(reaberto.status).toBe('EM_ATENDIMENTO');

    await world.chamadosService.resolverChamado(chamado.id, atendentePayload, 'Ajuste definitivo aplicado.');
    const arquivado = await world.chamadosService.encerrarChamado(chamado.id, atendentePayload, 'Chamado arquivado apos confirmacao.');

    expect(arquivado.status).toBe('ARQUIVADO');
    expect(arquivado.historico.map((item) => item.evento)).toEqual(expect.arrayContaining([
      'ABERTURA',
      'ATRIBUICAO',
      'MENSAGEM',
      'TRANSFERENCIA',
      'ALTERACAO_PRIORIDADE',
      'RESOLUCAO',
      'REABERTURA',
      'ARQUIVAMENTO'
    ]));

        const notificacoesSolicitante = await world.chamadosService.notificacoesChamado(solicitantePayload);
    expect(notificacoesSolicitante.map((item) => item.tipo)).toEqual(expect.arrayContaining([
      'NOVA_RESPOSTA',
      'CHAMADO_RESOLVIDO'
    ]));
    expect(await world.chamadosService.notificacoesNaoLidas(solicitantePayload)).toBeGreaterThan(0);
    const notificacaoLida = expectDefined(notificacoesSolicitante[0]);
    await expect(world.chamadosService.marcarNotificacaoComoLida(notificacaoLida.id, solicitantePayload)).resolves.toBe(true);
    await expect(world.chamadosService.marcarTodasNotificacoesComoLidas(solicitantePayload)).resolves.toBeGreaterThanOrEqual(0);
    expect(await world.chamadosService.notificacoesNaoLidas(solicitantePayload)).toBe(0);
const filaAposEncerramento = await world.chamadosService.filaChamados(atendentePayload, { page: 1, pageSize: 10 });
    expect(filaAposEncerramento.items.map((item) => item.id)).not.toContain(chamado.id);

    const chamadoArquivadoDireto = await world.chamadosService.criarChamado({
      titulo: 'Solicitacao para arquivamento direto',
      descricao: 'Chamado arquivado pela acao rapida do Kanban.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      categoriaId: categoria.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, solicitantePayload);

    await expect(world.chamadosService.arquivarChamado(chamadoArquivadoDireto.id, atendentePayload, 'Tentativa sem responsabilidade.'))
      .rejects.toThrow('Apenas o responsavel atual pelo chamado pode arquivar.');

    await world.chamadosService.assumirChamado(chamadoArquivadoDireto.id, atendentePayload);
    const arquivadoDireto = await world.chamadosService.arquivarChamado(chamadoArquivadoDireto.id, atendentePayload, 'Chamado arquivado pelo Kanban.');
    expect(arquivadoDireto.status).toBe('ARQUIVADO');
    expect(arquivadoDireto.historico.map((item) => item.evento)).toContain('ARQUIVAMENTO');

    const filaAposArquivamentoDireto = await world.chamadosService.filaChamados(atendentePayload, { page: 1, pageSize: 10 });
    expect(filaAposArquivamentoDireto.items.map((item) => item.id)).not.toContain(chamadoArquivadoDireto.id);

    const chamadosArquivados = await world.chamadosService.chamadosArquivados(atendentePayload, { page: 1, pageSize: 10 });
    expect(chamadosArquivados.items.map((item) => item.id)).toContain(chamadoArquivadoDireto.id);

    await expect(world.chamadosService.reabrirChamado(chamadoArquivadoDireto.id, atendentePayload, 'Tentativa sem perfil administrador.'))
      .rejects.toThrow('Apenas administradores podem desarquivar chamados.');

    const adminEmpresaPayload = { ...admin, empresaId: empresa.id, empresaNome: empresa.nome };
    const desarquivadoPorAdmin = await world.chamadosService.reabrirChamado(chamadoArquivadoDireto.id, adminEmpresaPayload, 'Chamado desarquivado pelo administrador.');
    expect(desarquivadoPorAdmin.status).toBe('EM_ATENDIMENTO');

    const arquivadosAposDesarquivar = await world.chamadosService.chamadosArquivados(atendentePayload, { page: 1, pageSize: 10 });
    expect(arquivadosAposDesarquivar.items.map((item) => item.id)).not.toContain(chamadoArquivadoDireto.id);

    const chamadoArquivadoPeloSolicitante = await world.chamadosService.criarChamado({
      titulo: 'Solicitacao arquivada pelo solicitante',
      descricao: 'Chamado arquivado a partir dos Meus chamados.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      categoriaId: categoria.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, solicitantePayload);

    await expect(world.chamadosService.arquivarChamado(
      chamadoArquivadoPeloSolicitante.id,
      solicitantePayload,
      'Tentativa sem responsabilidade em Meus chamados.'
    )).rejects.toThrow('Apenas o responsavel atual pelo chamado pode arquivar.');

    await world.chamadosService.atribuirChamado({
      chamadoId: chamadoArquivadoPeloSolicitante.id,
      responsavelId: solicitante.id
    }, atendentePayload);

    const arquivadoPeloSolicitante = await world.chamadosService.arquivarChamado(
      chamadoArquivadoPeloSolicitante.id,
      solicitantePayload,
      'Chamado arquivado pelo solicitante em Meus chamados.'
    );
    expect(arquivadoPeloSolicitante.status).toBe('ARQUIVADO');

    const meusAposArquivamentoProprio = await world.chamadosService.meusChamados(solicitantePayload, { page: 1, pageSize: 10 });
    expect(meusAposArquivamentoProprio.items.map((item) => item.id)).not.toContain(chamadoArquivadoPeloSolicitante.id);
  });


  it('valida cadastro de responsaveis por usuario e grupo com lideranca temporaria no chamado', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const controleChamados = expectDefined((await world.solucoesService.findAll()).find((solucao) => solucao.slug === 'controle-de-chamados'));
    const features = controleChamados.funcionalidades;
    const abrir = expectDefined(features.find((feature) => feature.slug === 'abrir-chamado'));
    const meus = expectDefined(features.find((feature) => feature.slug === 'meus-chamados'));
    const painel = expectDefined(features.find((feature) => feature.slug === 'painel-atendimento'));
    const responsaveis = expectDefined(features.find((feature) => feature.slug === 'responsaveis'));

    const grupoSolicitante = await world.gruposService.create({
      nome: 'Solicitantes Responsaveis Integracao',
      descricao: 'Abre chamados com responsavel sugerido.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: false,
      podeExcluir: false,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [abrir.id, meus.id],
      funcionalidadePermissoes: [abrir, meus].map(buildPermissionForFeature)
    });

    const grupoAtendimento = await world.gruposService.create({
      nome: 'Grupo Atendimento Responsavel Integracao',
      descricao: 'Grupo elegivel como responsavel por chamados.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [painel.id, meus.id, responsaveis.id],
      funcionalidadePermissoes: [painel, meus, responsaveis].map(buildPermissionForFeature)
    });

    const empresa = await world.empresasService.create({
      nome: 'Empresa Responsaveis Integracao',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: features.map((feature) => feature.id)
    }, admin);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);
    const adminEmpresa = { ...admin, empresaId: empresa.id, empresaNome: empresa.nome };

    const solicitante = await world.usersService.create({
      nome: 'Solicitante Responsaveis',
      login: 'solicitante.responsaveis',
      email: 'solicitante.responsaveis@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoSolicitante.id,
      empresaIds: [empresa.id]
    });
    const liderPrincipal = await world.usersService.create({
      nome: 'Lider Principal',
      login: 'lider.principal',
      email: 'lider.principal@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoAtendimento.id,
      empresaIds: [empresa.id]
    });
    const liderBackup = await world.usersService.create({
      nome: 'Lider Backup',
      login: 'lider.backup',
      email: 'lider.backup@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoAtendimento.id,
      empresaIds: [empresa.id]
    });

    const solicitantePayload = toJwtPayload((await world.authService.login('solicitante.responsaveis', 'Senha@12345', empresa.id)).user, empresa.id);
    const liderPrincipalPayload = toJwtPayload((await world.authService.login('lider.principal', 'Senha@12345', empresa.id)).user, empresa.id);
    const liderBackupPayload = toJwtPayload((await world.authService.login('lider.backup', 'Senha@12345', empresa.id)).user, empresa.id);

    const responsavelUsuario = await world.chamadosService.createResponsavel({
      tipo: 'USUARIO',
      usuarioId: liderPrincipal.id,
      grupoId: null,
      ativo: true,
      solucoes: [{ solucaoId: controleChamados.id, responsavelGeral: true, funcionalidadeIds: [] }]
    }, adminEmpresa);
    const responsavelGrupo = await world.chamadosService.createResponsavel({
      tipo: 'GRUPO',
      usuarioId: null,
      grupoId: grupoAtendimento.id,
      ativo: true,
      solucoes: [{ solucaoId: controleChamados.id, responsavelGeral: false, funcionalidadeIds: [painel.id] }]
    }, adminEmpresa);

    expect(responsavelUsuario.responsavelNome).toBe('Lider Principal');
    expect(responsavelUsuario.solucoes).toHaveLength(1);
    const responsavelUsuarioSolucao = expectDefined(responsavelUsuario.solucoes[0]);
    const responsavelGrupoSolucao = expectDefined(responsavelGrupo.solucoes[0]);
    expect(responsavelUsuarioSolucao.responsavelGeral).toBe(true);
    expect(responsavelGrupo.tipo).toBe('GRUPO');
    expect(responsavelGrupo.grupoNome).toBe('Grupo Atendimento Responsavel Integracao');
    expect(responsavelGrupoSolucao.funcionalidades.map((item) => item.funcionalidadeId)).toEqual([painel.id]);

    const candidatosSemFuncionalidade = await world.chamadosService.responsaveisParaAberturaChamado(solicitantePayload, controleChamados.id, null);
    expect(candidatosSemFuncionalidade.map((item) => item.nome).sort()).toEqual(['Grupo Atendimento Responsavel Integracao', 'Lider Principal'].sort());

    const candidatosPainel = await world.chamadosService.responsaveisParaAberturaChamado(solicitantePayload, controleChamados.id, painel.id);
    expect(candidatosPainel.map((item) => item.nome).sort()).toEqual(['Grupo Atendimento Responsavel Integracao', 'Lider Principal'].sort());

    const chamado = await world.chamadosService.criarChamado({
      titulo: 'Erro em fila de atendimento',
      descricao: 'Fila precisa ser redistribuida para o grupo responsavel.',
      tipoId: chamadoConfigs.tipos.INCIDENTE.id,
      prioridadeId: chamadoConfigs.prioridades.ALTA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: painel.id,
      responsavelGrupoId: grupoAtendimento.id
    }, solicitantePayload);

    expect(chamado.responsavelId).toBeNull();
    expect(chamado.responsavelGrupoId).toBe(grupoAtendimento.id);
    expect(chamado.responsavelGrupoNome).toBe('Grupo Atendimento Responsavel Integracao');

    const assumido = await world.chamadosService.assumirChamado(chamado.id, liderPrincipalPayload);
    expect(assumido.status).toBe('EM_ATENDIMENTO');
    expect(assumido.responsavelGrupoId).toBe(grupoAtendimento.id);
    expect(assumido.responsavelId).toBeNull();
    expect(assumido.liderAtendimentoId).toBe(liderPrincipal.id);
    expect(assumido.liderAtendimentoNome).toBe('Lider Principal');
    expect(assumido.historico.map((item) => item.evento)).toContain('LIDERANCA_ATENDIMENTO');

    await expect(world.chamadosService.assumirChamado(chamado.id, liderBackupPayload)).rejects.toThrow('Este chamado ja esta em atendimento');

    const liberado = await world.chamadosService.liberarAtendimentoChamado(chamado.id, liderPrincipalPayload);
    expect(liberado.liderAtendimentoId).toBeNull();
    expect(liberado.responsavelGrupoId).toBe(grupoAtendimento.id);
    expect(liberado.historico.map((item) => item.evento)).toContain('LIBERACAO_ATENDIMENTO');

    const reassumido = await world.chamadosService.assumirChamado(chamado.id, liderBackupPayload);
    expect(reassumido.liderAtendimentoId).toBe(liderBackup.id);
    expect(reassumido.liderAtendimentoNome).toBe('Lider Backup');
  });
  it('permite que acompanhantes visualizem, respondam e anexem sem assumir responsabilidade', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const controleChamados = expectDefined((await world.solucoesService.findAll()).find((solucao) => solucao.slug === 'controle-de-chamados'));
    const features = controleChamados.funcionalidades;
    const abrir = expectDefined(features.find((feature) => feature.slug === 'abrir-chamado'));
    const meus = expectDefined(features.find((feature) => feature.slug === 'meus-chamados'));
    const painel = expectDefined(features.find((feature) => feature.slug === 'painel-atendimento'));

    const grupoSolicitante = await world.gruposService.create({
      nome: 'Solicitantes Acompanhantes Integracao',
      descricao: 'Abre chamados com acompanhantes.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: false,
      podeExcluir: false,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [abrir.id, meus.id],
      funcionalidadePermissoes: [abrir, meus].map(buildPermissionForFeature)
    });
    const grupoAcompanhante = await world.gruposService.create({
      nome: 'Acompanhantes Integracao',
      descricao: 'Acompanha chamados sem atuar como atendente.',
      podeVisualizar: true,
      podeIncluir: false,
      podeAlterar: false,
      podeExcluir: false,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [meus.id],
      funcionalidadePermissoes: [meus].map(buildPermissionForFeature)
    });
    const grupoAtendimento = await world.gruposService.create({
      nome: 'Atendentes Acompanhantes Integracao',
      descricao: 'Gerencia acompanhantes de chamados.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [painel.id, meus.id],
      funcionalidadePermissoes: [painel, meus].map(buildPermissionForFeature)
    });

    const empresa = await world.empresasService.create({
      nome: 'Empresa Acompanhantes Integracao',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: features.map((feature) => feature.id)
    }, admin);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);

    const solicitante = await world.usersService.create({
      nome: 'Solicitante Acompanhantes',
      login: 'solicitante.acompanhantes',
      email: 'solicitante.acompanhantes@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoSolicitante.id,
      empresaIds: [empresa.id]
    });
    const acompanhante = await world.usersService.create({
      nome: 'Acompanhante Chamado',
      login: 'acompanhante.chamado',
      email: 'acompanhante.chamado@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoAcompanhante.id,
      empresaIds: [empresa.id]
    });
    const atendente = await world.usersService.create({
      nome: 'Atendente Acompanhantes',
      login: 'atendente.acompanhantes',
      email: 'atendente.acompanhantes@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoAtendimento.id,
      empresaIds: [empresa.id]
    });

    const solicitantePayload = toJwtPayload((await world.authService.login('solicitante.acompanhantes', 'Senha@12345', empresa.id)).user, empresa.id);
    const acompanhantePayload = toJwtPayload((await world.authService.login('acompanhante.chamado', 'Senha@12345', empresa.id)).user, empresa.id);
    const atendentePayload = toJwtPayload((await world.authService.login('atendente.acompanhantes', 'Senha@12345', empresa.id)).user, empresa.id);

    const chamado = await world.chamadosService.criarChamado({
      titulo: 'Acompanhar homologacao',
      descricao: 'Usuario convidado acompanha a validacao do chamado.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id,
      acompanhanteIds: [acompanhante.id]
    }, solicitantePayload);

    const detalheAcompanhante = await world.chamadosService.chamado(chamado.id, acompanhantePayload);
    expect(detalheAcompanhante.acompanhantes.map((item) => item.usuarioNome)).toEqual(['Acompanhante Chamado']);

    const respondido = await world.chamadosService.responderChamado({
      chamadoId: chamado.id,
      conteudo: 'Estou acompanhando a validacao pelo time solicitante.'
    }, acompanhantePayload);
    expect(respondido.mensagens.map((mensagem) => mensagem.autorNome)).toContain('Acompanhante Chamado');
    expect(respondido.primeiraRespostaEm).toBeNull();

    const evidencia = Buffer.from('evidencia do acompanhante');
    const anexos = await world.chamadosService.adicionarAnexos(chamado.id, [{
      originalname: 'validacao.txt',
      buffer: evidencia,
      mimetype: 'text/plain',
      size: evidencia.length
    }], acompanhantePayload);
    expect(anexos[0]?.autorNome).toBe('Acompanhante Chamado');

    await expect(world.chamadosService.atualizarAcompanhantesChamado({ chamadoId: chamado.id, usuarioIds: [solicitante.id] }, atendentePayload))
      .rejects.toThrow('O solicitante do chamado nao pode ser acompanhante.');

    const atribuido = await world.chamadosService.atribuirChamado({ chamadoId: chamado.id, responsavelId: acompanhante.id }, atendentePayload);
    expect(atribuido.responsavelNome).toBe('Acompanhante Chamado');
    expect(atribuido.acompanhantes).toEqual([]);
  });

  it('salva anexos no chamado e na resposta mantendo metadados, historico e download autorizado', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const controleChamados = expectDefined((await world.solucoesService.findAll()).find((solucao) => solucao.slug === 'controle-de-chamados'));
    const features = controleChamados.funcionalidades;
    const abrir = expectDefined(features.find((feature) => feature.slug === 'abrir-chamado'));
    const meus = expectDefined(features.find((feature) => feature.slug === 'meus-chamados'));
    const painel = expectDefined(features.find((feature) => feature.slug === 'painel-atendimento'));

    const grupoSolicitante = await world.gruposService.create({
      nome: 'Solicitantes Anexos Integracao',
      descricao: 'Abre chamados com evidencias anexadas.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: false,
      podeExcluir: false,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [abrir.id, meus.id],
      funcionalidadePermissoes: [abrir, meus].map(buildPermissionForFeature)
    });
    const grupoAtendimento = await world.gruposService.create({
      nome: 'Atendentes Anexos Integracao',
      descricao: 'Responde chamados com anexos.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [painel.id, meus.id],
      funcionalidadePermissoes: [painel, meus].map(buildPermissionForFeature)
    });

    const empresa = await world.empresasService.create({
      nome: 'Empresa Anexos Integracao',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: features.map((feature) => feature.id)
    }, admin);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);

    const solicitante = await world.usersService.create({
      nome: 'Solicitante Anexos',
      login: 'solicitante.anexos',
      email: 'solicitante.anexos@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoSolicitante.id,
      empresaIds: [empresa.id]
    });
    const atendente = await world.usersService.create({
      nome: 'Atendente Anexos',
      login: 'atendente.anexos',
      email: 'atendente.anexos@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoAtendimento.id,
      empresaIds: [empresa.id]
    });

    const solicitantePayload = toJwtPayload((await world.authService.login('solicitante.anexos', 'Senha@12345', empresa.id)).user, empresa.id);
    const atendentePayload = toJwtPayload((await world.authService.login('atendente.anexos', 'Senha@12345', empresa.id)).user, empresa.id);

    const chamado = await world.chamadosService.criarChamado({
      titulo: 'Erro com evidencias',
      descricao: 'Chamado aberto com arquivo de evidencia.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, solicitantePayload);

    const evidencia = Buffer.from('log inicial do erro');
    const anexosChamado = await world.chamadosService.adicionarAnexos(chamado.id, [{
      originalname: 'evidencia.txt',
      buffer: evidencia,
      mimetype: 'text/plain',
      size: evidencia.length
    }], solicitantePayload);

    expect(anexosChamado).toHaveLength(1);
    const anexoChamado = expectDefined(anexosChamado[0]);
    expect(anexoChamado.nomeOriginal).toBe('evidencia.txt');
    expect(anexoChamado.downloadUrl).toContain('/chamados/' + chamado.id + '/anexos/');

    const respondido = await world.chamadosService.responderChamado({
      chamadoId: chamado.id,
      conteudo: 'Analise iniciada com documento tecnico.'
    }, atendentePayload);
    const mensagemId = expectDefined(respondido.mensagens[0]?.id);
    const parecer = Buffer.from('%PDF parecer tecnico');

    await world.chamadosService.adicionarAnexos(chamado.id, [{
      originalname: 'parecer.pdf',
      buffer: parecer,
      mimetype: 'application/pdf',
      size: parecer.length
    }], atendentePayload, mensagemId);

    const detalhe = await world.chamadosService.chamado(chamado.id, solicitantePayload);
    expect(detalhe.anexos.map((anexo) => anexo.nomeOriginal)).toEqual(['evidencia.txt']);
    const mensagemDetalhe = expectDefined(detalhe.mensagens[0]);
    const anexoDetalhe = expectDefined(detalhe.anexos[0]);
    expect(mensagemDetalhe.anexos.map((anexo) => anexo.nomeOriginal)).toEqual(['parecer.pdf']);
    expect(detalhe.historico.filter((item) => item.evento === 'ANEXO')).toHaveLength(2);

    const download = await world.chamadosService.prepararDownloadAnexo(chamado.id, anexoDetalhe.id, solicitantePayload);
    expect(download.nomeOriginal).toBe('evidencia.txt');
    expect(download.mimeType).toBe('text/plain');

    await expect(world.chamadosService.adicionarAnexos(chamado.id, [{
      originalname: 'script.exe',
      buffer: Buffer.from('binario'),
      mimetype: 'application/octet-stream',
      size: 7
    }], solicitantePayload)).rejects.toThrow('Tipo de arquivo nao permitido para anexo.');
  });

  it('gerencia tipos e prioridades configuraveis e usa apenas registros ativos nos chamados', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const controleChamados = expectDefined((await world.solucoesService.findAll()).find((solucao) => solucao.slug === 'controle-de-chamados'));
    const features = controleChamados.funcionalidades;
    const abrir = expectDefined(features.find((feature) => feature.slug === 'abrir-chamado'));
    const meus = expectDefined(features.find((feature) => feature.slug === 'meus-chamados'));
    const painel = expectDefined(features.find((feature) => feature.slug === 'painel-atendimento'));
    const tipos = expectDefined(features.find((feature) => feature.slug === 'tipos'));
    const prioridades = expectDefined(features.find((feature) => feature.slug === 'prioridades'));

    const grupo = await world.gruposService.create({
      nome: 'Configuradores Chamados Integracao',
      descricao: 'Gerencia configuracoes de chamados.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [abrir.id, meus.id, painel.id, tipos.id, prioridades.id],
      funcionalidadePermissoes: [abrir, meus, painel, tipos, prioridades].map(buildPermissionForFeature)
    });

    const empresa = await world.empresasService.create({
      nome: 'Empresa Configuracoes Chamados Integracao',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: features.map((feature) => feature.id)
    }, admin);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);

    const usuario = await world.usersService.create({
      nome: 'Gestor Configuracoes Chamados',
      login: 'gestor.configuracoes.chamados',
      email: 'gestor.configuracoes.chamados@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupo.id,
      empresaIds: [empresa.id]
    });
    const payload = toJwtPayload((await world.authService.login('gestor.configuracoes.chamados', 'Senha@12345', empresa.id)).user, empresa.id);

    const tiposIniciais = await world.chamadosService.tiposChamado(payload, true);
    const prioridadesIniciais = await world.chamadosService.prioridadesChamado(payload, true);
    expect(tiposIniciais.map((tipo) => tipo.nome)).toEqual(expect.arrayContaining(['Solicitacao', 'Incidente']));
    expect(prioridadesIniciais.map((prioridade) => prioridade.nome)).toEqual(expect.arrayContaining(['Media', 'Alta']));

    const tipoCustomizado = await world.chamadosService.createTipo({
      nome: 'Requisicao financeira',
      descricao: 'Pedidos enviados para o financeiro.',
      cor: '#2563eb',
      ordem: 30,
      ativo: true
    }, payload);
    const prioridadeCustomizada = await world.chamadosService.createPrioridade({
      nome: 'Critica operacional',
      descricao: 'Impacto operacional imediato.',
      cor: '#991b1b',
      ordem: 5,
      ativo: true
    }, payload);

    expect(tipoCustomizado.nome).toBe('Requisicao financeira');
    expect(prioridadeCustomizada.nome).toBe('Critica operacional');

    const tipoAtualizado = await world.chamadosService.updateTipo({
      id: tipoCustomizado.id,
      nome: 'Requisicao financeira urgente',
      descricao: 'Pedidos financeiros priorizados.',
      cor: '#1d4ed8',
      ordem: 10,
      ativo: true
    }, payload);
    const prioridadeAtualizada = await world.chamadosService.updatePrioridade({
      id: prioridadeCustomizada.id,
      nome: 'Critica operacional imediata',
      descricao: 'Impacto operacional imediato.',
      cor: '#7f1d1d',
      ordem: 1,
      ativo: true
    }, payload);

    expect(tipoAtualizado.nome).toBe('Requisicao financeira urgente');
    expect(prioridadeAtualizada.ordem).toBe(1);

    const chamado = await world.chamadosService.criarChamado({
      titulo: 'Pagamento bloqueado',
      descricao: 'Solicitacao precisa seguir para analise financeira.',
      tipoId: tipoCustomizado.id,
      prioridadeId: prioridadeCustomizada.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, payload);
    expect(chamado.tipoId).toBe(tipoCustomizado.id);
    expect(chamado.tipoNome).toBe('Requisicao financeira urgente');
    expect(chamado.prioridadeId).toBe(prioridadeCustomizada.id);
    expect(chamado.prioridadeNome).toBe('Critica operacional imediata');
    expect(chamado.solicitanteNome).toBe(usuario.nome);

    await expect(world.chamadosService.alterarPrioridadeChamado({ chamadoId: chamado.id, prioridadeId: chamadoConfigs.prioridades.BAIXA.id }, payload)
    ).resolves.toMatchObject({ prioridadeId: chamadoConfigs.prioridades.BAIXA.id });

    await expect(world.chamadosService.deleteTipo(tipoCustomizado.id, payload)).resolves.toBe(true);
    await expect(world.chamadosService.criarChamado({
      titulo: 'Tipo inativo',
      descricao: 'Nao deve aceitar configuracao inativa.',
      tipoId: tipoCustomizado.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, payload)).rejects.toThrow('Tipo de chamado invalido ou inativo.');

    await expect(world.chamadosService.deletePrioridade(prioridadeCustomizada.id, payload)).resolves.toBe(true);
    await expect(world.chamadosService.alterarPrioridadeChamado({ chamadoId: chamado.id, prioridadeId: prioridadeCustomizada.id }, payload)
    ).rejects.toThrow('Prioridade de chamado invalida ou inativa.');

    const todosTipos = await world.chamadosService.tiposChamado(payload, false);
    const todasPrioridades = await world.chamadosService.prioridadesChamado(payload, false);
    expect(todosTipos.find((tipo) => tipo.id === tipoCustomizado.id)?.ativo).toBe(false);
    expect(todasPrioridades.find((prioridade) => prioridade.id === prioridadeCustomizada.id)?.ativo).toBe(false);
  });

  it('filtra chamados por periodo, categoria, solicitante e responsaveis', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const controleChamados = expectDefined((await world.solucoesService.findAll()).find((solucao) => solucao.slug === 'controle-de-chamados'));
    const features = controleChamados.funcionalidades;
    const abrir = expectDefined(features.find((feature) => feature.slug === 'abrir-chamado'));
    const meus = expectDefined(features.find((feature) => feature.slug === 'meus-chamados'));
    const painel = expectDefined(features.find((feature) => feature.slug === 'painel-atendimento'));
    const categorias = expectDefined(features.find((feature) => feature.slug === 'categorias'));
    const responsaveis = expectDefined(features.find((feature) => feature.slug === 'responsaveis'));

    const grupoOperacional = await world.gruposService.create({
      nome: 'Operacao Filtros Chamados Integracao',
      descricao: 'Abre e atende chamados para validar filtros.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [abrir.id, meus.id, painel.id, categorias.id, responsaveis.id],
      funcionalidadePermissoes: [abrir, meus, painel, categorias, responsaveis].map(buildPermissionForFeature)
    });

    const empresa = await world.empresasService.create({
      nome: 'Empresa Filtros Chamados Integracao',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: features.map((feature) => feature.id)
    }, admin);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);
    const adminEmpresa = { ...admin, empresaId: empresa.id, empresaNome: empresa.nome };

    const solicitanteA = await world.usersService.create({
      nome: 'Solicitante Filtro A',
      login: 'solicitante.filtro.a',
      email: 'solicitante.filtro.a@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoOperacional.id,
      empresaIds: [empresa.id]
    });
    const solicitanteB = await world.usersService.create({
      nome: 'Solicitante Filtro B',
      login: 'solicitante.filtro.b',
      email: 'solicitante.filtro.b@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoOperacional.id,
      empresaIds: [empresa.id]
    });
    const atendente = await world.usersService.create({
      nome: 'Atendente Filtros',
      login: 'atendente.filtros',
      email: 'atendente.filtros@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoOperacional.id,
      empresaIds: [empresa.id]
    });

    const solicitanteAPayload = toJwtPayload((await world.authService.login('solicitante.filtro.a', 'Senha@12345', empresa.id)).user, empresa.id);
    const solicitanteBPayload = toJwtPayload((await world.authService.login('solicitante.filtro.b', 'Senha@12345', empresa.id)).user, empresa.id);
    const atendentePayload = toJwtPayload((await world.authService.login('atendente.filtros', 'Senha@12345', empresa.id)).user, empresa.id);

    await world.chamadosService.createResponsavel({
      tipo: 'USUARIO',
      usuarioId: atendente.id,
      grupoId: null,
      ativo: true,
      solucoes: [{ solucaoId: controleChamados.id, responsavelGeral: true, funcionalidadeIds: [] }]
    }, adminEmpresa);
    await world.chamadosService.createResponsavel({
      tipo: 'GRUPO',
      usuarioId: null,
      grupoId: grupoOperacional.id,
      ativo: true,
      solucoes: [{ solucaoId: controleChamados.id, responsavelGeral: true, funcionalidadeIds: [] }]
    }, adminEmpresa);

    const responsaveisFiltro = await world.chamadosService.responsaveisFiltroChamado(atendentePayload);
    expect(responsaveisFiltro.filter((responsavel) => responsavel.tipo === 'USUARIO').map((responsavel) => responsavel.usuarioId)).toEqual([atendente.id]);
    expect(responsaveisFiltro.filter((responsavel) => responsavel.tipo === 'GRUPO').map((responsavel) => responsavel.grupoId)).toEqual([grupoOperacional.id]);
    expect(responsaveisFiltro.map((responsavel) => responsavel.usuarioId)).not.toContain(solicitanteA.id);
    expect(responsaveisFiltro.map((responsavel) => responsavel.usuarioId)).not.toContain(solicitanteB.id);

    const categoriaInfra = await world.chamadosService.createCategoria({ nome: 'Infra filtros', descricao: null, ativo: true }, atendentePayload);
    const categoriaAcesso = await world.chamadosService.createCategoria({ nome: 'Acesso filtros', descricao: null, ativo: true }, atendentePayload);

    const chamadoJaneiro = await world.chamadosService.criarChamado({
      titulo: 'VPN lenta em janeiro',
      descricao: 'Validacao do filtro por periodo e responsavel usuario.',
      tipoId: chamadoConfigs.tipos.INCIDENTE.id,
      prioridadeId: chamadoConfigs.prioridades.ALTA.id,
      categoriaId: categoriaInfra.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, solicitanteAPayload);
    const chamadoFevereiro = await world.chamadosService.criarChamado({
      titulo: 'Acesso bloqueado em fevereiro',
      descricao: 'Validacao do filtro por categoria e grupo responsavel.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      categoriaId: categoriaAcesso.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, solicitanteBPayload);
    const chamadoMarco = await world.chamadosService.criarChamado({
      titulo: 'Monitoramento em marco',
      descricao: 'Chamado fora do periodo filtrado.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.BAIXA.id,
      categoriaId: categoriaInfra.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, solicitanteBPayload);

    await world.chamadosService.atribuirChamado({ chamadoId: chamadoJaneiro.id, responsavelId: atendente.id }, atendentePayload);
    await world.chamadosService.atribuirChamado({ chamadoId: chamadoFevereiro.id, responsavelGrupoId: grupoOperacional.id }, atendentePayload);

    await world.prisma.chamado.update({ where: { id: chamadoJaneiro.id }, data: { criadoEm: new Date('2026-01-10T12:00:00.000Z') } });
    await world.prisma.chamado.update({ where: { id: chamadoFevereiro.id }, data: { criadoEm: new Date('2026-02-15T12:00:00.000Z') } });
    await world.prisma.chamado.update({ where: { id: chamadoMarco.id }, data: { criadoEm: new Date('2026-03-20T12:00:00.000Z') } });

    const porPeriodo = await world.chamadosService.filaChamados(atendentePayload, { criadoDe: '2026-01-01', criadoAte: '2026-01-31', page: 1, pageSize: 10 });
    expect(porPeriodo.items.map((item) => item.id)).toEqual([chamadoJaneiro.id]);

    const porCategoria = await world.chamadosService.filaChamados(atendentePayload, { categoriaId: categoriaAcesso.id, page: 1, pageSize: 10 });
    expect(porCategoria.items.map((item) => item.id)).toEqual([chamadoFevereiro.id]);

    const porSolicitante = await world.chamadosService.filaChamados(atendentePayload, { solicitanteId: solicitanteB.id, page: 1, pageSize: 10 });
    expect(porSolicitante.items.map((item) => item.id).sort()).toEqual([chamadoFevereiro.id, chamadoMarco.id].sort());

    const porResponsavel = await world.chamadosService.filaChamados(atendentePayload, { responsavelId: atendente.id, page: 1, pageSize: 10 });
    expect(porResponsavel.items.map((item) => item.id)).toEqual([chamadoJaneiro.id]);

    const porGrupoResponsavel = await world.chamadosService.filaChamados(atendentePayload, { responsavelGrupoId: grupoOperacional.id, page: 1, pageSize: 10 });
    expect(porGrupoResponsavel.items.map((item) => item.id)).toEqual([chamadoFevereiro.id]);
  });

  it('valida categorias, abertura e transicoes invalidas de chamado', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const solucoes = await world.solucoesService.findAll();
    const controleChamados = expectDefined(solucoes.find((solucao) => solucao.slug === 'controle-de-chamados'));
    const configurador = expectDefined(solucoes.find((solucao) => solucao.slug === 'configurador'));
    const features = controleChamados.funcionalidades;
    const abrir = expectDefined(features.find((feature) => feature.slug === 'abrir-chamado'));
    const meus = expectDefined(features.find((feature) => feature.slug === 'meus-chamados'));
    const painel = expectDefined(features.find((feature) => feature.slug === 'painel-atendimento'));
    const categorias = expectDefined(features.find((feature) => feature.slug === 'categorias'));
    const funcionalidadeDeOutraSolucao = expectDefined(configurador.funcionalidades[0]);

    const grupoOperacional = await world.gruposService.create({
      nome: 'Operacao Categorias Chamados Integracao',
      descricao: 'Abre chamados e gerencia categorias para validacao negativa.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [abrir.id, meus.id, painel.id, categorias.id],
      funcionalidadePermissoes: [abrir, meus, painel, categorias].map(buildPermissionForFeature)
    });
    const grupoSemInclusao = await world.gruposService.create({
      nome: 'Leitores Abertura Chamados Integracao',
      descricao: 'Visualiza abertura, mas nao pode incluir chamados.',
      podeVisualizar: true,
      podeIncluir: false,
      podeAlterar: false,
      podeExcluir: false,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [abrir.id],
      funcionalidadePermissoes: [{
        funcionalidadeId: abrir.id,
        podeVisualizar: true,
        podeIncluir: false,
        podeAlterar: false,
        podeExcluir: false,
        acoes: abrir.acoes.map((acao) => ({ funcionalidadeId: abrir.id, acaoId: acao.id, chave: acao.chave, permitido: false }))
      }]
    });

    const empresa = await world.empresasService.create({
      nome: 'Empresa Categorias Chamados Integracao',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: features.map((feature) => feature.id)
    }, admin);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);

    const operador = await world.usersService.create({
      nome: 'Operador Categorias Chamados',
      login: 'operador.categorias.chamados',
      email: 'operador.categorias.chamados@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoOperacional.id,
      empresaIds: [empresa.id]
    });
    const leitor = await world.usersService.create({
      nome: 'Leitor Abertura Chamados',
      login: 'leitor.abertura.chamados',
      email: 'leitor.abertura.chamados@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoSemInclusao.id,
      empresaIds: [empresa.id]
    });

    const operadorPayload = toJwtPayload((await world.authService.login('operador.categorias.chamados', 'Senha@12345', empresa.id)).user, empresa.id);
    const leitorPayload = toJwtPayload((await world.authService.login('leitor.abertura.chamados', 'Senha@12345', empresa.id)).user, empresa.id);

    const categoria = await world.chamadosService.createCategoria({ nome: 'Financeiro interno', descricao: 'Assuntos financeiros internos.', ativo: true }, operadorPayload);
    const categoriaAtualizada = await world.chamadosService.updateCategoria({ id: categoria.id, nome: 'Financeiro confidencial', descricao: 'Tratativas financeiras confidenciais.', ativo: false }, operadorPayload);
    expect(categoriaAtualizada.ativo).toBe(false);
    expect((await world.chamadosService.categoriasChamado(operadorPayload, true)).map((item) => item.id)).not.toContain(categoria.id);
    expect((await world.chamadosService.categoriasChamado(operadorPayload, false)).find((item) => item.id === categoria.id)?.nome).toBe('Financeiro confidencial');

    await expect(world.chamadosService.criarChamado({
      titulo: 'Categoria inativa',
      descricao: 'Nao deve aceitar categoria desativada.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      categoriaId: categoria.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, operadorPayload)).rejects.toThrow('Categoria de chamado nao encontrada.');

    const categoriaAtiva = await world.chamadosService.createCategoria({ nome: 'Infraestrutura ativa', descricao: null, ativo: true }, operadorPayload);
    const chamado = await world.chamadosService.criarChamado({
      titulo: 'Falha de acesso interno',
      descricao: 'Validacao de abertura com categoria ativa.',
      tipoId: chamadoConfigs.tipos.INCIDENTE.id,
      prioridadeId: chamadoConfigs.prioridades.ALTA.id,
      categoriaId: categoriaAtiva.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, operadorPayload);
    expect(chamado.categoriaNome).toBe('Infraestrutura ativa');

    await expect(world.chamadosService.criarChamado({
      titulo: 'Sem tipo',
      descricao: 'Tipo deve ser obrigatorio.',
      tipoId: null as unknown as number,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, operadorPayload)).rejects.toThrow('Selecione o tipo de chamado.');
    await expect(world.chamadosService.criarChamado({
      titulo: 'Funcionalidade invalida',
      descricao: 'Funcionalidade deve pertencer a solucao.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: funcionalidadeDeOutraSolucao.id
    }, operadorPayload)).rejects.toThrow('Funcionalidade selecionada nao pertence a solucao informada ou esta inativa.');
    await expect(world.chamadosService.criarChamado({
      titulo: 'Sem permissao de inclusao',
      descricao: 'Usuario nao pode abrir chamado.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, leitorPayload)).rejects.toThrow('Usuario sem permissao para acessar esta funcionalidade.');

    await expect(world.chamadosService.alterarStatusChamado({ chamadoId: chamado.id, status: 'RESOLVIDO' }, operadorPayload))
      .rejects.toThrow('Use as acoes especificas para resolver, encerrar ou arquivar chamados.');
    await expect(world.chamadosService.alterarStatusChamado({ chamadoId: chamado.id, status: 'PENDENTE' }, operadorPayload))
      .rejects.toThrow('Transicao de status invalida: ABERTO -> PENDENTE.');
    await expect(world.chamadosService.reabrirChamado(chamado.id, operadorPayload))
      .rejects.toThrow('Apenas chamados resolvidos ou arquivados podem ser reabertos.');
  });

  it('configura regras de SLA por prioridade e aplica os prazos na abertura do chamado', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const controleChamados = expectDefined((await world.solucoesService.findAll()).find((solucao) => solucao.slug === 'controle-de-chamados'));
    const abrir = expectDefined(controleChamados.funcionalidades.find((feature) => feature.slug === 'abrir-chamado'));
    const sla = expectDefined(controleChamados.funcionalidades.find((feature) => feature.slug === 'sla'));
    const empresa = await world.empresasService.create({
      nome: 'Empresa Regras SLA Integracao',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: controleChamados.funcionalidades.map((feature) => feature.id)
    }, admin);
    const adminEmpresa = { ...admin, empresaId: empresa.id };
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);

    expect(sla.registryKey).toBe('controle-de-chamados.sla');

    const regra = await world.chamadosService.createRegraSla({
      prioridadeId: chamadoConfigs.prioridades.ALTA.id,
      primeiraRespostaPrazoMinutos: 120,
      resolucaoPrazoMinutos: 480,
      modoContagem: 'CORRIDO',
      ativo: true
    }, adminEmpresa);

    expect(regra.prioridadeNome).toBe('Alta');
    expect(regra.modoContagem).toBe('CORRIDO');

    await expect(world.chamadosService.createRegraSla({
      prioridadeId: chamadoConfigs.prioridades.ALTA.id,
      primeiraRespostaPrazoMinutos: 60,
      resolucaoPrazoMinutos: 240,
      modoContagem: 'CORRIDO',
      ativo: true
    }, adminEmpresa)).rejects.toThrow('Ja existe uma regra de SLA para esta prioridade na empresa ativa.');

    const chamadoComSla = await world.chamadosService.criarChamado({
      titulo: 'Incidente com SLA',
      descricao: 'Valida o calculo dos limites na abertura.',
      tipoId: chamadoConfigs.tipos.INCIDENTE.id,
      prioridadeId: chamadoConfigs.prioridades.ALTA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, adminEmpresa);

    expect(chamadoComSla.slaRegraId).toBe(regra.id);
    expect(chamadoComSla.slaStatus).toBe('NO_PRAZO');
    expect(chamadoComSla.primeiraRespostaLimiteEm).toBeInstanceOf(Date);
    expect(chamadoComSla.resolucaoLimiteEm).toBeInstanceOf(Date);
    expect(expectDefined(chamadoComSla.primeiraRespostaLimiteEm).getTime()).toBeGreaterThan(chamadoComSla.criadoEm.getTime());
    expect(expectDefined(chamadoComSla.resolucaoLimiteEm).getTime()).toBeGreaterThan(expectDefined(chamadoComSla.primeiraRespostaLimiteEm).getTime());
    await world.prisma.chamado.update({
      where: { id: chamadoComSla.id },
      data: { primeiraRespostaLimiteEm: new Date(Date.now() - 60_000), slaStatus: 'NO_PRAZO' }
    });
    await expect(world.chamadoSlaService.refreshOpenSlaStatuses()).resolves.toBe(1);
    expect((await world.chamadosService.chamado(chamadoComSla.id, adminEmpresa)).slaStatus).toBe('ATRASADO');
    const somenteAtrasados = await world.chamadosService.filaChamados(adminEmpresa, { somenteAtrasados: true, page: 1, pageSize: 20 });
    expect(somenteAtrasados.items.map((item) => item.id)).toEqual([chamadoComSla.id]);

    const chamadoSemSla = await world.chamadosService.criarChamado({
      titulo: 'Solicitacao sem SLA',
      descricao: 'Prioridade ainda nao configurada para SLA.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, adminEmpresa);

    expect(chamadoSemSla.slaRegraId).toBeNull();
    expect(chamadoSemSla.slaStatus).toBe('SEM_SLA');
    expect(chamadoSemSla.primeiraRespostaLimiteEm).toBeNull();
    expect(chamadoSemSla.resolucaoLimiteEm).toBeNull();

    const atualizada = await world.chamadosService.updateRegraSla({
      id: regra.id,
      primeiraRespostaPrazoMinutos: 90,
      resolucaoPrazoMinutos: 360,
      modoContagem: 'UTEIS'
    }, adminEmpresa);

    expect(atualizada.primeiraRespostaPrazoMinutos).toBe(90);
    expect(atualizada.resolucaoPrazoMinutos).toBe(360);
    expect(atualizada.modoContagem).toBe('UTEIS');
    expect((await world.chamadosService.regrasSlaChamado(adminEmpresa, true)).map((item) => item.id)).toEqual([regra.id]);

    await expect(world.chamadosService.deleteRegraSla(regra.id, adminEmpresa)).resolves.toBe(true);
    expect(await world.chamadosService.regrasSlaChamado(adminEmpresa, true)).toEqual([]);
    expect((await world.chamadosService.regrasSlaChamado(adminEmpresa, false))[0]?.ativo).toBe(false);
  });
  it('bloqueia alteracao de status, atribuicao e acesso entre empresas sem permissao', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const controleChamados = expectDefined((await world.solucoesService.findAll()).find((solucao) => solucao.slug === 'controle-de-chamados'));
    const features = controleChamados.funcionalidades;
    const abrir = expectDefined(features.find((feature) => feature.slug === 'abrir-chamado'));
    const meus = expectDefined(features.find((feature) => feature.slug === 'meus-chamados'));
    const painel = expectDefined(features.find((feature) => feature.slug === 'painel-atendimento'));

    const grupoSolicitante = await world.gruposService.create({
      nome: 'Solicitantes Permissoes Negativas Chamados',
      descricao: 'Abre chamados para validar isolamento e permissoes.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: false,
      podeExcluir: false,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [abrir.id, meus.id],
      funcionalidadePermissoes: [abrir, meus].map(buildPermissionForFeature)
    });
    const grupoRestrito = await world.gruposService.create({
      nome: 'Atendimento Restrito Chamados',
      descricao: 'Visualiza a fila, mas nao altera status nem atribui chamados.',
      podeVisualizar: true,
      podeIncluir: false,
      podeAlterar: false,
      podeExcluir: false,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [painel.id],
      funcionalidadePermissoes: [{
        funcionalidadeId: painel.id,
        podeVisualizar: true,
        podeIncluir: false,
        podeAlterar: false,
        podeExcluir: false,
        acoes: painel.acoes.map((acao) => ({
          funcionalidadeId: painel.id,
          acaoId: acao.id,
          chave: acao.chave,
          permitido: !['alterar_status', 'atribuir_chamado'].includes(acao.chave)
        }))
      }]
    });

    const empresaOrigem = await world.empresasService.create({
      nome: 'Empresa Origem Permissoes Chamados',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: features.map((feature) => feature.id)
    }, admin);
    const empresaExterna = await world.empresasService.create({
      nome: 'Empresa Externa Permissoes Chamados',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: features.map((feature) => feature.id)
    }, admin);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresaOrigem.id);

    const solicitante = await world.usersService.create({
      nome: 'Solicitante Permissoes Chamados',
      login: 'solicitante.permissoes.chamados',
      email: 'solicitante.permissoes.chamados@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoSolicitante.id,
      empresaIds: [empresaOrigem.id]
    });
    const operadorRestrito = await world.usersService.create({
      nome: 'Operador Restrito Chamados',
      login: 'operador.restrito.chamados',
      email: 'operador.restrito.chamados@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoRestrito.id,
      empresaIds: [empresaOrigem.id]
    });
    await world.usersService.create({
      nome: 'Usuario Empresa Externa Chamados',
      login: 'usuario.empresa.externa.chamados',
      email: 'usuario.empresa.externa.chamados@orfeu.test',
      senha: 'Senha@12345',
      grupoId: grupoRestrito.id,
      empresaIds: [empresaExterna.id]
    });

    const solicitantePayload = toJwtPayload(
      (await world.authService.login('solicitante.permissoes.chamados', 'Senha@12345', empresaOrigem.id)).user,
      empresaOrigem.id
    );
    const operadorRestritoPayload = toJwtPayload(
      (await world.authService.login('operador.restrito.chamados', 'Senha@12345', empresaOrigem.id)).user,
      empresaOrigem.id
    );
    const usuarioExternoPayload = toJwtPayload(
      (await world.authService.login('usuario.empresa.externa.chamados', 'Senha@12345', empresaExterna.id)).user,
      empresaExterna.id
    );

    const chamado = await world.chamadosService.criarChamado({
      titulo: 'Validacao de permissoes negativas',
      descricao: 'Chamado usado para validar status, atribuicao e isolamento por empresa.',
      tipoId: chamadoConfigs.tipos.INCIDENTE.id,
      prioridadeId: chamadoConfigs.prioridades.ALTA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id
    }, solicitantePayload);

    await expect(world.chamadosService.alterarStatusChamado({
      chamadoId: chamado.id,
      status: 'EM_TRIAGEM'
    }, operadorRestritoPayload)).rejects.toThrow('Usuario sem permissao para executar esta acao.');

    await expect(world.chamadosService.atribuirChamado({
      chamadoId: chamado.id,
      responsavelId: operadorRestrito.id
    }, operadorRestritoPayload)).rejects.toThrow('Usuario sem permissao para executar esta acao.');

    await expect(world.chamadosService.chamado(chamado.id, usuarioExternoPayload))
      .rejects.toThrow('Chamado nao encontrado.');
  });
  it('atualiza, desativa e bloqueia responsaveis invalidos na abertura', async () => {
    const { world, admin, empresaInicialId } = await bootstrapBaseWorld();
    const controleChamados = expectDefined((await world.solucoesService.findAll()).find((solucao) => solucao.slug === 'controle-de-chamados'));
    const features = controleChamados.funcionalidades;
    const abrir = expectDefined(features.find((feature) => feature.slug === 'abrir-chamado'));
    const meus = expectDefined(features.find((feature) => feature.slug === 'meus-chamados'));
    const painel = expectDefined(features.find((feature) => feature.slug === 'painel-atendimento'));
    const responsaveis = expectDefined(features.find((feature) => feature.slug === 'responsaveis'));

    const grupoSolicitante = await world.gruposService.create({
      nome: 'Solicitantes Responsaveis Invalidos Integracao',
      descricao: 'Abre chamados para validar responsaveis.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: false,
      podeExcluir: false,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [abrir.id, meus.id],
      funcionalidadePermissoes: [abrir, meus].map(buildPermissionForFeature)
    });
    const grupoAtendimento = await world.gruposService.create({
      nome: 'Atendentes Responsaveis Invalidos Integracao',
      descricao: 'Gerencia responsaveis de chamados.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [painel.id, meus.id, responsaveis.id],
      funcionalidadePermissoes: [painel, meus, responsaveis].map(buildPermissionForFeature)
    });

    const empresa = await world.empresasService.create({
      nome: 'Empresa Responsaveis Invalidos Integracao',
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: features.map((feature) => feature.id)
    }, admin);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);
    const adminEmpresa = { ...admin, empresaId: empresa.id, empresaNome: empresa.nome };

    const solicitante = await world.usersService.create({ nome: 'Solicitante Responsavel Invalido', login: 'solicitante.responsavel.invalido', email: 'solicitante.responsavel.invalido@orfeu.test', senha: 'Senha@12345', grupoId: grupoSolicitante.id, empresaIds: [empresa.id] });
    const liderPrincipal = await world.usersService.create({ nome: 'Lider Responsavel Principal', login: 'lider.responsavel.principal', email: 'lider.responsavel.principal@orfeu.test', senha: 'Senha@12345', grupoId: grupoAtendimento.id, empresaIds: [empresa.id] });
    const liderBackup = await world.usersService.create({ nome: 'Lider Responsavel Backup', login: 'lider.responsavel.backup', email: 'lider.responsavel.backup@orfeu.test', senha: 'Senha@12345', grupoId: grupoAtendimento.id, empresaIds: [empresa.id] });
    const usuarioForaEmpresa = await world.usersService.create({ nome: 'Usuario Fora Empresa Responsavel', login: 'usuario.fora.empresa.responsavel', email: 'usuario.fora.empresa.responsavel@orfeu.test', senha: 'Senha@12345', grupoId: grupoAtendimento.id, empresaIds: [empresaInicialId] });

    const solicitantePayload = toJwtPayload((await world.authService.login('solicitante.responsavel.invalido', 'Senha@12345', empresa.id)).user, empresa.id);

    const responsavel = await world.chamadosService.createResponsavel({
      tipo: 'USUARIO',
      usuarioId: liderPrincipal.id,
      grupoId: null,
      ativo: true,
      solucoes: [{ solucaoId: controleChamados.id, responsavelGeral: true, funcionalidadeIds: [] }]
    }, adminEmpresa);

    await expect(world.chamadosService.createResponsavel({
      tipo: 'USUARIO',
      usuarioId: liderPrincipal.id,
      grupoId: null,
      ativo: true,
      solucoes: [{ solucaoId: controleChamados.id, responsavelGeral: true, funcionalidadeIds: [] }]
    }, adminEmpresa)).rejects.toThrow('Este responsavel ja possui cadastro nesta empresa.');
    await expect(world.chamadosService.createResponsavel({
      tipo: 'USUARIO',
      usuarioId: usuarioForaEmpresa.id,
      grupoId: null,
      ativo: true,
      solucoes: [{ solucaoId: controleChamados.id, responsavelGeral: true, funcionalidadeIds: [] }]
    }, adminEmpresa)).rejects.toThrow('Usuario selecionado nao pertence a empresa ativa ou nao possui acesso ao Controle de Chamados.');

    const atualizado = await world.chamadosService.updateResponsavel({
      id: responsavel.id,
      tipo: 'USUARIO',
      usuarioId: liderBackup.id,
      grupoId: null,
      ativo: true,
      solucoes: [{ solucaoId: controleChamados.id, responsavelGeral: true, funcionalidadeIds: [] }]
    }, adminEmpresa);
    expect(atualizado.usuarioId).toBe(liderBackup.id);
    expect((await world.chamadosService.responsaveisParaAberturaChamado(solicitantePayload, controleChamados.id, abrir.id)).map((item) => item.usuarioId)).toEqual([liderBackup.id]);

    await expect(world.chamadosService.deleteResponsavel(responsavel.id, adminEmpresa)).resolves.toBe(true);
    expect((await world.chamadosService.responsaveisParaAberturaChamado(solicitantePayload, controleChamados.id, abrir.id)).map((item) => item.usuarioId)).not.toContain(liderBackup.id);
    await expect(world.chamadosService.criarChamado({
      titulo: 'Responsavel desativado',
      descricao: 'Nao deve aceitar responsavel removido na abertura.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id,
      responsavelId: liderBackup.id
    }, solicitantePayload)).rejects.toThrow('Responsavel selecionado nao esta cadastrado para a solucao ou funcionalidade do chamado.');
  });

  it('bloqueia casos negativos de acompanhantes e anexos', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const controleChamados = expectDefined((await world.solucoesService.findAll()).find((solucao) => solucao.slug === 'controle-de-chamados'));
    const features = controleChamados.funcionalidades;
    const abrir = expectDefined(features.find((feature) => feature.slug === 'abrir-chamado'));
    const meus = expectDefined(features.find((feature) => feature.slug === 'meus-chamados'));
    const painel = expectDefined(features.find((feature) => feature.slug === 'painel-atendimento'));
    const arquivados = expectDefined(features.find((feature) => feature.slug === 'chamados-arquivados'));

    const grupoSolicitante = await world.gruposService.create({ nome: 'Solicitantes Negativos Chamados Integracao', descricao: 'Abre chamados com acompanhantes.', podeVisualizar: true, podeIncluir: true, podeAlterar: false, podeExcluir: false, solucaoIds: [controleChamados.id], funcionalidadeIds: [abrir.id, meus.id], funcionalidadePermissoes: [abrir, meus].map(buildPermissionForFeature) });
    const grupoAcompanhante = await world.gruposService.create({ nome: 'Acompanhantes Negativos Integracao', descricao: 'Acompanha chamados.', podeVisualizar: true, podeIncluir: false, podeAlterar: false, podeExcluir: false, solucaoIds: [controleChamados.id], funcionalidadeIds: [meus.id], funcionalidadePermissoes: [meus].map(buildPermissionForFeature) });
    const grupoAtendimento = await world.gruposService.create({ nome: 'Atendentes Negativos Chamados Integracao', descricao: 'Atende chamados e gerencia anexos.', podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true, solucaoIds: [controleChamados.id], funcionalidadeIds: [painel.id, meus.id, arquivados.id], funcionalidadePermissoes: [painel, meus, arquivados].map(buildPermissionForFeature) });

    const empresa = await world.empresasService.create({ nome: 'Empresa Negativos Chamados Integracao', solucaoIds: [controleChamados.id], funcionalidadeIds: features.map((feature) => feature.id) }, admin);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);

    const solicitante = await world.usersService.create({ nome: 'Solicitante Negativos Chamados', login: 'solicitante.negativos.chamados', email: 'solicitante.negativos.chamados@orfeu.test', senha: 'Senha@12345', grupoId: grupoSolicitante.id, empresaIds: [empresa.id] });
    const acompanhante = await world.usersService.create({ nome: 'Acompanhante Negativos Chamados', login: 'acompanhante.negativos.chamados', email: 'acompanhante.negativos.chamados@orfeu.test', senha: 'Senha@12345', grupoId: grupoAcompanhante.id, empresaIds: [empresa.id] });
    const observador = await world.usersService.create({ nome: 'Observador Negativos Chamados', login: 'observador.negativos.chamados', email: 'observador.negativos.chamados@orfeu.test', senha: 'Senha@12345', grupoId: grupoAcompanhante.id, empresaIds: [empresa.id] });
    const intruso = await world.usersService.create({ nome: 'Intruso Negativos Chamados', login: 'intruso.negativos.chamados', email: 'intruso.negativos.chamados@orfeu.test', senha: 'Senha@12345', grupoId: grupoAcompanhante.id, empresaIds: [empresa.id] });
    const atendente = await world.usersService.create({ nome: 'Atendente Negativos Chamados', login: 'atendente.negativos.chamados', email: 'atendente.negativos.chamados@orfeu.test', senha: 'Senha@12345', grupoId: grupoAtendimento.id, empresaIds: [empresa.id] });

    const solicitantePayload = toJwtPayload((await world.authService.login('solicitante.negativos.chamados', 'Senha@12345', empresa.id)).user, empresa.id);
    const acompanhantePayload = toJwtPayload((await world.authService.login('acompanhante.negativos.chamados', 'Senha@12345', empresa.id)).user, empresa.id);
    const observadorPayload = toJwtPayload((await world.authService.login('observador.negativos.chamados', 'Senha@12345', empresa.id)).user, empresa.id);
    const intrusoPayload = toJwtPayload((await world.authService.login('intruso.negativos.chamados', 'Senha@12345', empresa.id)).user, empresa.id);
    const atendentePayload = toJwtPayload((await world.authService.login('atendente.negativos.chamados', 'Senha@12345', empresa.id)).user, empresa.id);

    const elegiveisAbertura = await world.chamadosService.acompanhantesElegiveisChamado(solicitantePayload);
    expect(elegiveisAbertura.map((item) => item.id)).toContain(acompanhante.id);
    expect(elegiveisAbertura.map((item) => item.id)).not.toContain(solicitante.id);

    const chamado = await world.chamadosService.criarChamado({
      titulo: 'Validar acompanhantes e anexos',
      descricao: 'Chamado usado para casos negativos de anexos e acompanhantes.',
      tipoId: chamadoConfigs.tipos.SOLICITACAO.id,
      prioridadeId: chamadoConfigs.prioridades.MEDIA.id,
      solucaoId: controleChamados.id,
      funcionalidadeId: abrir.id,
      acompanhanteIds: [acompanhante.id, acompanhante.id]
    }, solicitantePayload);
    expect(chamado.acompanhantes.map((item) => item.usuarioId)).toEqual([acompanhante.id]);

    await expect(world.chamadosService.atualizarAcompanhantesChamado({ chamadoId: chamado.id, usuarioIds: [acompanhante.id] }, observadorPayload))
      .rejects.toThrow('Usuario sem permissao para gerenciar acompanhantes deste chamado.');
    await expect(world.chamadosService.atualizarAcompanhantesChamado({ chamadoId: chamado.id, usuarioIds: [observador.id] }, acompanhantePayload))
      .rejects.toThrow('Usuario sem permissao para gerenciar acompanhantes deste chamado.');

    const semAcompanhantes = await world.chamadosService.atualizarAcompanhantesChamado({ chamadoId: chamado.id, usuarioIds: [] }, solicitantePayload);
    expect(semAcompanhantes.acompanhantes).toEqual([]);
    const comObservador = await world.chamadosService.atualizarAcompanhantesChamado({ chamadoId: chamado.id, usuarioIds: [observador.id] }, solicitantePayload);
    expect(comObservador.acompanhantes.map((item) => item.usuarioId)).toEqual([observador.id]);

    await expect(world.chamadosService.adicionarAnexos(chamado.id, Array.from({ length: 6 }, (_, index) => ({
      originalname: `evidencia-${index}.txt`,
      buffer: Buffer.from('x'),
      mimetype: 'text/plain',
      size: 1
    })), solicitantePayload)).rejects.toThrow('Informe no maximo 5 anexos por envio.');
    const grande = Buffer.alloc(10 * 1024 * 1024 + 1, 'x');
    await expect(world.chamadosService.adicionarAnexos(chamado.id, [{ originalname: 'grande.txt', buffer: grande, mimetype: 'text/plain', size: grande.length }], solicitantePayload))
      .rejects.toThrow('Cada anexo deve ter no maximo 10 MB.');
    await expect(world.chamadosService.adicionarAnexos(chamado.id, [{ originalname: 'ok.txt', buffer: Buffer.from('ok'), mimetype: 'text/plain', size: 2 }], solicitantePayload, 'mensagem-inexistente'))
      .rejects.toThrow('Mensagem do chamado nao encontrada para vincular o anexo.');

    const [anexo] = await world.chamadosService.adicionarAnexos(chamado.id, [{ originalname: 'ok.txt', buffer: Buffer.from('ok'), mimetype: 'text/plain', size: 2 }], solicitantePayload);
    await expect(world.chamadosService.prepararDownloadAnexo(chamado.id, expectDefined(anexo).id, intrusoPayload))
      .rejects.toThrow('Usuario sem permissao para acessar esta funcionalidade.');

    await world.chamadosService.atribuirChamado({ chamadoId: chamado.id, responsavelId: atendente.id }, atendentePayload);
    await world.chamadosService.resolverChamado(chamado.id, atendentePayload, 'Resolvido para arquivamento.');
    await world.chamadosService.encerrarChamado(chamado.id, atendentePayload, 'Arquivado para validar bloqueio de acompanhantes.');
    await expect(world.chamadosService.atualizarAcompanhantesChamado({ chamadoId: chamado.id, usuarioIds: [acompanhante.id] }, solicitantePayload))
      .rejects.toThrow('Chamados arquivados precisam ser desarquivados antes de alterar acompanhantes.');
  });

  it('filtra meus chamados e arquivados por termo, status, prioridade e paginacao', async () => {
    const { world, admin } = await bootstrapBaseWorld();
    const controleChamados = expectDefined((await world.solucoesService.findAll()).find((solucao) => solucao.slug === 'controle-de-chamados'));
    const features = controleChamados.funcionalidades;
    const abrir = expectDefined(features.find((feature) => feature.slug === 'abrir-chamado'));
    const meus = expectDefined(features.find((feature) => feature.slug === 'meus-chamados'));
    const painel = expectDefined(features.find((feature) => feature.slug === 'painel-atendimento'));
    const arquivados = expectDefined(features.find((feature) => feature.slug === 'chamados-arquivados'));

    const grupoOperacional = await world.gruposService.create({
      nome: 'Operacao Filtros Avancados Chamados Integracao',
      descricao: 'Abre, atende e consulta filtros de chamados.',
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true,
      solucaoIds: [controleChamados.id],
      funcionalidadeIds: [abrir.id, meus.id, painel.id, arquivados.id],
      funcionalidadePermissoes: [abrir, meus, painel, arquivados].map(buildPermissionForFeature)
    });

    const empresa = await world.empresasService.create({ nome: 'Empresa Filtros Avancados Chamados Integracao', solucaoIds: [controleChamados.id], funcionalidadeIds: features.map((feature) => feature.id) }, admin);
    const chamadoConfigs = await seedChamadoConfiguracoes(world, empresa.id);
    const solicitanteA = await world.usersService.create({ nome: 'Solicitante Filtros Avancados A', login: 'solicitante.filtros.avancados.a', email: 'solicitante.filtros.avancados.a@orfeu.test', senha: 'Senha@12345', grupoId: grupoOperacional.id, empresaIds: [empresa.id] });
    const solicitanteB = await world.usersService.create({ nome: 'Solicitante Filtros Avancados B', login: 'solicitante.filtros.avancados.b', email: 'solicitante.filtros.avancados.b@orfeu.test', senha: 'Senha@12345', grupoId: grupoOperacional.id, empresaIds: [empresa.id] });
    const atendente = await world.usersService.create({ nome: 'Atendente Filtros Avancados', login: 'atendente.filtros.avancados', email: 'atendente.filtros.avancados@orfeu.test', senha: 'Senha@12345', grupoId: grupoOperacional.id, empresaIds: [empresa.id] });

    const solicitanteAPayload = toJwtPayload((await world.authService.login('solicitante.filtros.avancados.a', 'Senha@12345', empresa.id)).user, empresa.id);
    const solicitanteBPayload = toJwtPayload((await world.authService.login('solicitante.filtros.avancados.b', 'Senha@12345', empresa.id)).user, empresa.id);
    const atendentePayload = toJwtPayload((await world.authService.login('atendente.filtros.avancados', 'Senha@12345', empresa.id)).user, empresa.id);

    const chamadoNotebook = await world.chamadosService.criarChamado({ titulo: 'Notebook sem rede', descricao: 'Termo notebook para filtro.', tipoId: chamadoConfigs.tipos.INCIDENTE.id, prioridadeId: chamadoConfigs.prioridades.ALTA.id, solucaoId: controleChamados.id, funcionalidadeId: abrir.id }, solicitanteAPayload);
    const chamadoMouse = await world.chamadosService.criarChamado({ titulo: 'Mouse sem clique', descricao: 'Termo mouse para arquivados.', tipoId: chamadoConfigs.tipos.SOLICITACAO.id, prioridadeId: chamadoConfigs.prioridades.MEDIA.id, solucaoId: controleChamados.id, funcionalidadeId: abrir.id }, solicitanteAPayload);
    const chamadoAcompanhado = await world.chamadosService.criarChamado({ titulo: 'Notebook para homologacao', descricao: 'Solicitante A acompanha chamado de outro usuario.', tipoId: chamadoConfigs.tipos.SOLICITACAO.id, prioridadeId: chamadoConfigs.prioridades.BAIXA.id, solucaoId: controleChamados.id, funcionalidadeId: abrir.id, acompanhanteIds: [solicitanteA.id] }, solicitanteBPayload);

    await world.chamadosService.alterarStatusChamado({ chamadoId: chamadoNotebook.id, status: 'EM_TRIAGEM' }, atendentePayload);
    const meusPorTermo = await world.chamadosService.meusChamados(solicitanteAPayload, { termo: 'Notebook', page: 1, pageSize: 1 });
    expect(meusPorTermo.total).toBe(2);
    expect(meusPorTermo.items).toHaveLength(1);
    expect([chamadoNotebook.id, chamadoAcompanhado.id]).toContain(meusPorTermo.items[0]?.id);

    const meusPorStatus = await world.chamadosService.meusChamados(solicitanteAPayload, { status: 'EM_TRIAGEM', page: 1, pageSize: 10 });
    expect(meusPorStatus.items.map((item) => item.id)).toEqual([chamadoNotebook.id]);
    const meusPorPrioridade = await world.chamadosService.meusChamados(solicitanteAPayload, { prioridadeId: chamadoConfigs.prioridades.BAIXA.id, page: 1, pageSize: 10 });
    expect(meusPorPrioridade.items.map((item) => item.id)).toEqual([chamadoAcompanhado.id]);

    await world.chamadosService.atribuirChamado({ chamadoId: chamadoMouse.id, responsavelId: atendente.id }, atendentePayload);
    await world.chamadosService.resolverChamado(chamadoMouse.id, atendentePayload, 'Resolvido para consulta em arquivados.');
    await world.chamadosService.encerrarChamado(chamadoMouse.id, atendentePayload, 'Arquivado para consulta filtrada.');

    const arquivadosFiltrados = await world.chamadosService.chamadosArquivados(atendentePayload, { termo: 'Mouse', status: 'ABERTO', prioridadeId: chamadoConfigs.prioridades.MEDIA.id, page: 1, pageSize: 10 });
    expect(arquivadosFiltrados.total).toBe(1);
    expect(arquivadosFiltrados.items.map((item) => item.id)).toEqual([chamadoMouse.id]);
    expect((await world.chamadosService.meusChamados(solicitanteAPayload, { termo: 'Mouse', page: 1, pageSize: 10 })).items).toEqual([]);
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
