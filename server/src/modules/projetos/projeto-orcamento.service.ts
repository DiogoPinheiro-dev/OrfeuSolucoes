import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { AprovarProjetoOrcamentoInput, ExcluirProjetoOrcamentoItemInput, SalvarProjetoCustoInput, SalvarProjetoOrcamentoCategoriaInput, SalvarProjetoOrcamentoInput } from './dto/projeto-orcamento.input';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoOrcamentoAuthorizationService, ProjetoOrcamentoContexto } from './projeto-orcamento-authorization.service';
import { ProjetoCustoTipo, ProjetoOrcamentoStatus } from './types/projeto-orcamento.types';

const USER_SELECT = { id: true, nome: true, login: true, email: true };
const RESOURCE_INCLUDE = { cadastro: { include: { usuario: { select: USER_SELECT } } } };
const TASK_SELECT = { id: true, funcionalidade: true, estimativaMinutos: true, valorHora: true, moeda: true, ativo: true, recursos: { select: { recursoId: true } } };
const FINANCE_INCLUDE = {
  categorias: { orderBy: { nome: 'asc' as const } },
  custos: { include: { recurso: { include: RESOURCE_INCLUDE }, tarefa: { select: TASK_SELECT }, taxas: { include: { criadoPor: { select: USER_SELECT } }, orderBy: { criadoEm: 'desc' as const } } }, orderBy: { descricao: 'asc' as const } }
};

@Injectable()
export class ProjetoOrcamentoService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ProjetoOrcamentoAuthorizationService, private readonly auditoria: ProjetoAuditoriaService) {}

  async projetos(user: JwtPayload) {
    const { where } = await this.authorization.projetos(user);
    return this.prisma.projeto.findMany({ where, select: { id: true, chave: true, nome: true, arquivadoEm: true }, orderBy: [{ arquivadoEm: 'asc' }, { nome: 'asc' }] });
  }

  async painel(projetoId: string, user: JwtPayload) {
    const contexto = await this.authorization.contexto(projetoId, user);
    const permissoes = await this.authorization.permissoes(contexto, user);
    const [recursos, tarefas, financeiro] = await Promise.all([
      this.prisma.projetoRecurso.findMany({ where: { projetoId }, include: RESOURCE_INCLUDE, orderBy: { criadoEm: 'asc' } }),
      permissoes.podeVisualizarFinanceiro ? this.prisma.projetoTarefa.findMany({ where: { empresaId: contexto.empresaId, recursos: { some: { recurso: { projetos: { some: { projetoId } } } } } }, select: TASK_SELECT, orderBy: [{ ativo: 'desc' }, { funcionalidade: 'asc' }] }) : Promise.resolve([]),
      permissoes.podeVisualizarFinanceiro ? this.prisma.projetoOrcamento.findUnique({ where: { projetoId }, include: FINANCE_INCLUDE }) : Promise.resolve(null)
    ]);
    return { recursos: recursos.map((item) => this.recurso(item)), tarefas: tarefas.map((item) => this.tarefa(item)), financeiro: financeiro ? this.financeiro(financeiro) : null, permissoes };
  }

  async salvarOrcamento(input: SalvarProjetoOrcamentoInput, user: JwtPayload) {
    const contexto = await this.authorization.contexto(input.projetoId, user); await this.authorization.gerenciarFinanceiro(contexto, user);
    const moeda = input.moeda.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(moeda)) throw new BadRequestException('Informe a moeda no formato ISO de tres letras.');
    const atual = await this.prisma.projetoOrcamento.findUnique({ where: { projetoId: input.projetoId } }); this.assertDraft(atual);
    if (atual && atual.moeda !== moeda) {
      const [categorias, custos] = await Promise.all([this.prisma.projetoOrcamentoCategoria.count({ where: { orcamentoId: atual.id } }), this.prisma.projetoCusto.count({ where: { orcamentoId: atual.id } })]);
      if (categorias + custos > 0) throw new BadRequestException('A moeda do orcamento nao pode ser alterada depois que categorias ou custos forem cadastrados.');
    }
    return this.prisma.$transaction(async (tx) => {
      const record = atual ? await this.updateVersioned(tx.projetoOrcamento, atual.id, input.versao, { moeda }, 'O orcamento', { projetoId: input.projetoId }) : await tx.projetoOrcamento.create({ data: { empresaId: contexto.empresaId, projetoId: input.projetoId, moeda } });
      await this.audit(tx, contexto, user, 'ORCAMENTO', record.id, atual ? 'ALTERADO' : 'CRIADO', { moeda }); return this.findFinanceiro(tx, input.projetoId);
    }).then((item) => this.financeiro(item));
  }

  async salvarCategoria(input: SalvarProjetoOrcamentoCategoriaInput, user: JwtPayload) {
    const contexto = await this.authorization.contexto(input.projetoId, user); await this.authorization.gerenciarFinanceiro(contexto, user);
    const orcamento = await this.orcamentoRascunho(input.projetoId);
    return this.prisma.$transaction(async (tx) => {
      const data = { nome: input.nome.trim(), valorPlanejado: this.money(input.valorPlanejado), valorComprometido: this.money(input.valorComprometido), valorRealizado: this.money(input.valorRealizado) };
      const record = input.id ? await this.updateVersioned(tx.projetoOrcamentoCategoria, input.id, input.versao, data, 'O cadastro da categoria', { orcamentoId: orcamento.id }) : await tx.projetoOrcamentoCategoria.create({ data: { ...data, empresaId: contexto.empresaId, projetoId: input.projetoId, orcamentoId: orcamento.id } });
      await this.audit(tx, contexto, user, 'ORCAMENTO_CATEGORIA', record.id, input.id ? 'ALTERADA' : 'CRIADA', data); return record;
    }).then((item) => this.categoria(item));
  }

  async salvarCusto(input: SalvarProjetoCustoInput, user: JwtPayload) {
    const contexto = await this.authorization.contexto(input.projetoId, user); await this.authorization.gerenciarFinanceiro(contexto, user);
    const orcamento = await this.orcamentoRascunho(input.projetoId); if (input.categoriaId) await this.assertCategoria(orcamento.id, input.categoriaId);
    if (input.tipo === ProjetoCustoTipo.FIXO && input.tarefaId) throw new BadRequestException('Custos fixos nao podem ser associados a tarefas.');
    if (input.tipo === ProjetoCustoTipo.RECURSO) {
      if (!input.recursoId || !input.quantidadeMinutos || !input.taxaHora) throw new BadRequestException('Custos de recurso exigem recurso, quantidade e taxa por hora.');
      await this.assertRecurso(input.projetoId, input.recursoId, input.id);
      if (input.tarefaId) await this.assertTarefa(contexto, orcamento.moeda, input.recursoId, input.tarefaId, input.id);
    }
    const taxa = input.tipo === ProjetoCustoTipo.RECURSO ? this.money(input.taxaHora!, 4) : null;
    const planejado = input.tipo === ProjetoCustoTipo.RECURSO ? new Prisma.Decimal(input.quantidadeMinutos!).div(60).mul(taxa!).toDecimalPlaces(2).toFixed(2) : this.money(input.valorPlanejado);
    return this.prisma.$transaction(async (tx) => {
      const data = { categoriaId: input.categoriaId || null, tipo: input.tipo, descricao: input.descricao.trim(), recursoId: input.tipo === ProjetoCustoTipo.RECURSO ? input.recursoId : null, tarefaId: input.tipo === ProjetoCustoTipo.RECURSO ? input.tarefaId || null : null, quantidadeMinutos: input.tipo === ProjetoCustoTipo.RECURSO ? input.quantidadeMinutos : null, taxaHora: taxa, valorPlanejado: planejado, valorComprometido: this.money(input.valorComprometido), valorRealizado: this.money(input.valorRealizado) };
      const anterior = input.id ? await tx.projetoCusto.findUnique({ where: { id: input.id } }) : null;
      const record = input.id ? await this.updateVersioned(tx.projetoCusto, input.id, input.versao, data, 'O custo', { orcamentoId: orcamento.id }) : await tx.projetoCusto.create({ data: { ...data, empresaId: contexto.empresaId, projetoId: input.projetoId, orcamentoId: orcamento.id, criadoPorId: user.sub } });
      if (taxa && (!anterior?.taxaHora || !new Prisma.Decimal(anterior.taxaHora).equals(taxa))) await tx.projetoCustoTaxaHistorico.create({ data: { custoId: record.id, taxaHora: taxa, criadoPorId: user.sub } });
      await this.audit(tx, contexto, user, 'CUSTO', record.id, input.id ? 'ALTERADO' : 'CRIADO', { ...data, taxaHora: taxa });
      return tx.projetoCusto.findUnique({ where: { id: record.id }, include: FINANCE_INCLUDE.custos.include });
    }).then((item) => this.custo(item));
  }

  async excluirCategoria(input: ExcluirProjetoOrcamentoItemInput, user: JwtPayload) {
    const contexto = await this.authorization.contexto(input.projetoId, user); await this.authorization.gerenciarFinanceiro(contexto, user);
    const orcamento = await this.orcamentoRascunho(input.projetoId); const custos = await this.prisma.projetoCusto.count({ where: { orcamentoId: orcamento.id, categoriaId: input.id } });
    if (custos > 0) throw new BadRequestException(`A categoria possui ${custos} custo(s) vinculado(s). Remova ou reclassifique esses custos antes de exclui-la.`);
    return this.prisma.$transaction(async (tx) => { const atual = await tx.projetoOrcamentoCategoria.findFirst({ where: { id: input.id, orcamentoId: orcamento.id } }); await this.deleteVersioned(tx.projetoOrcamentoCategoria, input.id, input.versao, 'A categoria', { orcamentoId: orcamento.id }); await this.audit(tx, contexto, user, 'ORCAMENTO_CATEGORIA', input.id, 'EXCLUIDA', { nome: atual?.nome ?? null }); return true; });
  }

  async excluirCusto(input: ExcluirProjetoOrcamentoItemInput, user: JwtPayload) {
    const contexto = await this.authorization.contexto(input.projetoId, user); await this.authorization.gerenciarFinanceiro(contexto, user); const orcamento = await this.orcamentoRascunho(input.projetoId);
    return this.prisma.$transaction(async (tx) => { const atual = await tx.projetoCusto.findFirst({ where: { id: input.id, orcamentoId: orcamento.id } }); await this.deleteVersioned(tx.projetoCusto, input.id, input.versao, 'O custo', { orcamentoId: orcamento.id }); await this.audit(tx, contexto, user, 'CUSTO', input.id, 'EXCLUIDO', { descricao: atual?.descricao ?? null, categoriaId: atual?.categoriaId ?? null }); return true; });
  }

  async aprovar(input: AprovarProjetoOrcamentoInput, user: JwtPayload) {
    const contexto = await this.authorization.contexto(input.projetoId, user); await this.authorization.aprovarOrcamento(contexto, user);
    return this.prisma.$transaction(async (tx) => { const record = await this.updateVersioned(tx.projetoOrcamento, input.id, input.versao, { status: ProjetoOrcamentoStatus.APROVADO, aprovadoEm: new Date(), aprovadoPorId: user.sub }, 'O orcamento', { projetoId: input.projetoId }); await this.audit(tx, contexto, user, 'ORCAMENTO', record.id, 'APROVADO', {}); return this.findFinanceiro(tx, input.projetoId); }).then((item) => this.financeiro(item));
  }

  async reabrir(input: AprovarProjetoOrcamentoInput, user: JwtPayload) {
    const contexto = await this.authorization.contexto(input.projetoId, user); await this.authorization.aprovarOrcamento(contexto, user);
    const atual = await this.prisma.projetoOrcamento.findFirst({ where: { id: input.id, projetoId: input.projetoId } }); if (!atual || atual.status !== ProjetoOrcamentoStatus.APROVADO) throw new BadRequestException('Somente um orcamento aprovado pode ser reaberto.');
    return this.prisma.$transaction(async (tx) => { const record = await this.updateVersioned(tx.projetoOrcamento, input.id, input.versao, { status: ProjetoOrcamentoStatus.RASCUNHO, aprovadoEm: null, aprovadoPorId: null }, 'O orcamento', { projetoId: input.projetoId }); await this.audit(tx, contexto, user, 'ORCAMENTO', record.id, 'REABERTO', { statusAnterior: ProjetoOrcamentoStatus.APROVADO }); return this.findFinanceiro(tx, input.projetoId); }).then((item) => this.financeiro(item));
  }

  private async assertRecurso(projetoId: string, id: string, custoId?: string | null) {
    const recurso = await this.prisma.projetoRecurso.findFirst({ where: { id, projetoId }, include: RESOURCE_INCLUDE });
    if (!recurso) throw new BadRequestException('Selecione um recurso cadastrado no projeto.');
    if (!recurso.ativo || !recurso.cadastro.ativo) {
      const custoAtual = custoId ? await this.prisma.projetoCusto.findFirst({ where: { id: custoId, projetoId, recursoId: id } }) : null;
      if (!custoAtual) throw new BadRequestException('Selecione um recurso ativo cadastrado no projeto.');
    }
  }
  private async assertTarefa(contexto: ProjetoOrcamentoContexto, moeda: string, recursoId: string, id: string, custoId?: string | null) {
    const tarefa = await this.prisma.projetoTarefa.findFirst({ where: { id, empresaId: contexto.empresaId, recursos: { some: { recurso: { projetos: { some: { id: recursoId, projetoId: contexto.projeto.id } } } } } }, select: TASK_SELECT });
    if (!tarefa) throw new BadRequestException('Selecione uma tarefa vinculada ao recurso.');
    if (tarefa.moeda !== moeda) throw new BadRequestException('A moeda da tarefa deve ser a mesma moeda do orcamento.');
    if (!tarefa.ativo) {
      const custoAtual = custoId ? await this.prisma.projetoCusto.findFirst({ where: { id: custoId, projetoId: contexto.projeto.id, recursoId, tarefaId: id } }) : null;
      if (!custoAtual) throw new BadRequestException('Selecione uma tarefa ativa vinculada ao recurso.');
    }
  }
  private async orcamentoRascunho(projetoId: string) { const item = await this.prisma.projetoOrcamento.findUnique({ where: { projetoId } }); if (!item) throw new BadRequestException('Cadastre o orcamento-base antes desta operacao.'); this.assertDraft(item); return item; }
  private assertDraft(item: any) { if (item?.status === ProjetoOrcamentoStatus.APROVADO) throw new BadRequestException('O orcamento aprovado nao pode ser alterado.'); }
  private async assertCategoria(orcamentoId: string, id: string) { if (!await this.prisma.projetoOrcamentoCategoria.findFirst({ where: { id, orcamentoId } })) throw new BadRequestException('Categoria financeira invalida.'); }
  private money(value: string, scale = 2) { try { const decimal = new Prisma.Decimal(value); if (decimal.isNegative()) throw new Error(); return decimal.toDecimalPlaces(scale, Prisma.Decimal.ROUND_HALF_UP).toFixed(scale); } catch { throw new BadRequestException('Valor monetario invalido.'); } }
  private user(item: any) { return { id: item.id, nome: item.nome ?? null, login: item.login ?? null, email: item.email }; }
  private recurso(item: any) { return { id: item.id, cadastroRecursoId: item.recursoId, usuarioId: item.cadastro.usuarioId, ativo: item.ativo && item.cadastro.ativo, versao: item.versao, usuario: this.user(item.cadastro.usuario) }; }
  private async updateVersioned(model: any, id: string, versao: number | null | undefined, data: any, label: string, scope: Record<string, unknown> = {}) { if (!versao) throw new BadRequestException('Informe a versao para alterar o registro.'); const result = await model.updateMany({ where: { id, versao, ...scope }, data: { ...data, versao: { increment: 1 } } }); if (result.count !== 1) throw new ConflictException(`${label} foi alterado por outra pessoa. Atualize os dados.`); const record = await model.findUnique({ where: { id } }); if (!record) throw new NotFoundException(`${label} nao foi encontrado.`); return record; }
  private async deleteVersioned(model: any, id: string, versao: number, label: string, scope: Record<string, unknown>) { const result = await model.deleteMany({ where: { id, versao, ...scope } }); if (result.count !== 1) throw new ConflictException(`${label} foi alterado por outra pessoa ou nao existe mais. Atualize os dados.`); }
  private audit(tx: Prisma.TransactionClient, contexto: ProjetoOrcamentoContexto, user: JwtPayload, entidade: string, entidadeId: string, evento: string, dados: any) { return this.auditoria.registrar(tx, { empresaId: contexto.empresaId, projetoId: contexto.projeto.id, usuarioId: user.sub, entidade, entidadeId, evento, dados }); }
  private findFinanceiro(tx: Prisma.TransactionClient | PrismaService, projetoId: string) { return tx.projetoOrcamento.findUnique({ where: { projetoId }, include: FINANCE_INCLUDE }).then((item) => { if (!item) throw new NotFoundException('Orcamento nao encontrado.'); return item; }); }
  private categoria(item: any) { const planned = new Prisma.Decimal(item.valorPlanejado); return { ...item, valorPlanejado: planned.toFixed(2), valorComprometido: new Prisma.Decimal(item.valorComprometido).toFixed(2), valorRealizado: new Prisma.Decimal(item.valorRealizado).toFixed(2), variacao: planned.minus(item.valorRealizado).toFixed(2) }; }
  private tarefa(item: any) { return { ...item, recursoIds: (item.recursos ?? []).map((recurso: any) => recurso.recursoId), valorHora: new Prisma.Decimal(item.valorHora).toFixed(4) }; }
  private custo(item: any) { if (!item) throw new NotFoundException('Custo nao encontrado.'); return { ...item, taxaHora: item.taxaHora ? new Prisma.Decimal(item.taxaHora).toFixed(4) : null, valorPlanejado: new Prisma.Decimal(item.valorPlanejado).toFixed(2), valorComprometido: new Prisma.Decimal(item.valorComprometido).toFixed(2), valorRealizado: new Prisma.Decimal(item.valorRealizado).toFixed(2), recurso: item.recurso ? this.recurso(item.recurso) : null, tarefa: item.tarefa ? this.tarefa(item.tarefa) : null, taxas: (item.taxas ?? []).map((taxa: any) => ({ ...taxa, taxaHora: new Prisma.Decimal(taxa.taxaHora).toFixed(4), criadoPor: this.user(taxa.criadoPor) })) }; }
  private financeiro(item: any) { const categorias = (item.categorias ?? []).map((entry: any) => this.categoria(entry)); const sum = (field: string) => categorias.reduce((total: Prisma.Decimal, entry: any) => total.add(entry[field]), new Prisma.Decimal(0)); const planned = sum('valorPlanejado'); const actual = sum('valorRealizado'); return { ...item, totalPlanejado: planned.toFixed(2), totalComprometido: sum('valorComprometido').toFixed(2), totalRealizado: actual.toFixed(2), variacao: planned.minus(actual).toFixed(2), categorias, custos: (item.custos ?? []).map((entry: any) => this.custo(entry)) }; }
}
