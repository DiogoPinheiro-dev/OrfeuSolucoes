import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import { ExcluirProjetoTarefaInput, SalvarProjetoTarefaInput } from './dto/projeto-tarefa.input';
import { ProjetoTarefaAuthorizationService } from './projeto-tarefa-authorization.service';

const USER_SELECT = { id: true, nome: true, login: true, email: true };
const RESOURCE_INCLUDE = { usuario: { select: USER_SELECT } };
const TASK_RESOURCE_INCLUDE = { recurso: { include: RESOURCE_INCLUDE } };
const TASK_INCLUDE = {
  recursos: { include: TASK_RESOURCE_INCLUDE, orderBy: { criadoEm: 'asc' as const } },
  alocacoes: { orderBy: { inicioEm: 'asc' as const } },
  taxas: { include: { criadoPor: { select: USER_SELECT } }, orderBy: { criadoEm: 'desc' as const } }
};

@Injectable()
export class ProjetoTarefaService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ProjetoTarefaAuthorizationService) {}

  async painel(user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user);
    const [tarefas, recursos] = await Promise.all([
      this.prisma.projetoTarefa.findMany({ where: { empresaId }, include: TASK_INCLUDE, orderBy: { criadoEm: 'asc' } }),
      this.prisma.recurso.findMany({ where: { empresaId }, include: RESOURCE_INCLUDE, orderBy: { criadoEm: 'asc' } })
    ]);
    return {
      tarefas: tarefas.map((item) => this.tarefa(item)),
      recursos: recursos.map((item) => this.recurso(item))
    };
  }

  async salvar(input: SalvarProjetoTarefaInput, user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user, input.id ? ProjetoAcao.ALTERAR : ProjetoAcao.INCLUIR);
    const atual = input.id
      ? await this.prisma.projetoTarefa.findFirst({ where: { id: input.id, empresaId }, include: TASK_INCLUDE })
      : null;
    if (input.id && !atual) throw new NotFoundException('Tarefa nao encontrada.');

    const recursoIds = [...new Set(input.recursoIds ?? [])];
    if (!recursoIds.length) throw new BadRequestException('Selecione ao menos um recurso para a tarefa.');
    if (recursoIds.length !== input.recursoIds.length) throw new BadRequestException('Nao repita o mesmo recurso na tarefa.');

    const recursos = await this.prisma.recurso.findMany({
      where: { id: { in: recursoIds }, empresaId },
      include: RESOURCE_INCLUDE
    });
    if (recursos.length !== recursoIds.length) throw new BadRequestException('Selecione somente recursos cadastrados na empresa.');
    if (input.ativo && recursos.some((item) => !item.ativo)) {
      throw new BadRequestException('Tarefas ativas exigem recursos ativos.');
    }

    if (atual) {
      const solicitados = new Set(recursoIds);
      const removidos = atual.recursos.map((item) => item.recursoId).filter((id) => !solicitados.has(id));
      if (removidos.length) {
        const vinculosProjeto = await this.prisma.projetoRecurso.findMany({
          where: { empresaId, recursoId: { in: removidos } },
          select: { id: true }
        });
        const projetoRecursoIds = vinculosProjeto.map((item) => item.id);
        const [execucoes, custos] = projetoRecursoIds.length
          ? await Promise.all([
              this.prisma.projetoAlocacao.count({ where: { empresaId, tarefaId: atual.id, recursoId: { in: projetoRecursoIds } } }),
              this.prisma.projetoCusto.count({ where: { empresaId, tarefaId: atual.id, recursoId: { in: projetoRecursoIds } } })
            ])
          : [0, 0];
        if (execucoes + custos > 0) {
          throw new BadRequestException('Um recurso da tarefa possui planejamento ou custos. Remova essas dependencias antes de desvincular o recurso.');
        }
      }
    }

    const funcionalidade = input.funcionalidade.trim();
    if (!funcionalidade) throw new BadRequestException('Descreva a funcionalidade da tarefa.');
    if (!Number.isInteger(input.estimativaMinutos) || input.estimativaMinutos <= 0) throw new BadRequestException('As horas estimadas devem ser maiores que zero.');
    const valorHora = this.money(input.valorHora);
    const moeda = input.moeda.trim().toUpperCase();
    const observacao = input.observacao?.trim() || null;

    const saved = await this.prisma.$transaction(async (tx) => {
      const data = { funcionalidade, estimativaMinutos: input.estimativaMinutos, valorHora, moeda, observacao, ativo: input.ativo };
      const tarefa = atual
        ? await this.updateVersioned(tx.projetoTarefa, atual.id, input.versao, data, empresaId)
        : await tx.projetoTarefa.create({ data: { empresaId, ...data } });

      await tx.projetoTarefaRecurso.deleteMany({
        where: { tarefaId: tarefa.id, recursoId: { notIn: recursoIds } }
      });
      const existentes = new Set(atual?.recursos.map((item) => item.recursoId) ?? []);
      const novosRecursoIds = recursoIds.filter((recursoId) => !existentes.has(recursoId));
      if (novosRecursoIds.length) {
        await tx.projetoTarefaRecurso.createMany({
          data: novosRecursoIds.map((recursoId) => ({ empresaId, tarefaId: tarefa.id, recursoId }))
        });
      }

      const taxaAlterada = !atual || !new Prisma.Decimal(atual.valorHora).equals(valorHora) || atual.moeda !== moeda;
      if (taxaAlterada) {
        await tx.projetoTarefaTaxaHistorico.create({ data: { tarefaId: tarefa.id, valorHora, moeda, criadoPorId: user.sub } });
      }
      return tarefa;
    });
    return this.find(saved.id, empresaId);
  }

  async excluir(input: ExcluirProjetoTarefaInput, user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user, ProjetoAcao.EXCLUIR);
    const [execucoes, custos] = await Promise.all([
      this.prisma.projetoAlocacao.count({ where: { empresaId, tarefaId: input.id } }),
      this.prisma.projetoCusto.count({ where: { empresaId, tarefaId: input.id } })
    ]);
    if (execucoes + custos > 0) throw new BadRequestException('A tarefa possui planejamento ou custos vinculados. Desative a tarefa para preservar o planejamento e o historico.');
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.projetoTarefa.deleteMany({ where: { id: input.id, empresaId, versao: input.versao } });
      if (result.count !== 1) throw new ConflictException('A tarefa foi alterada por outra pessoa ou nao existe mais. Atualize os dados.');
      await tx.projetoTarefaRecurso.deleteMany({ where: { tarefaId: input.id, empresaId } });
      return true;
    });
  }

  private async find(id: string, empresaId: number) {
    const item = await this.prisma.projetoTarefa.findFirst({ where: { id, empresaId }, include: TASK_INCLUDE });
    if (!item) throw new NotFoundException('Tarefa nao encontrada.');
    return this.tarefa(item);
  }

  private money(value: string) {
    try {
      const decimal = new Prisma.Decimal(value);
      if (!decimal.isPositive()) throw new Error();
      return decimal.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toFixed(4);
    } catch {
      throw new BadRequestException('O valor por hora deve ser maior que zero.');
    }
  }

  private async updateVersioned(model: any, id: string, versao: number | null | undefined, data: any, empresaId: number) {
    if (!versao) throw new BadRequestException('Informe a versao para alterar a tarefa.');
    const result = await model.updateMany({ where: { id, empresaId, versao }, data: { ...data, versao: { increment: 1 } } });
    if (result.count !== 1) throw new ConflictException('A tarefa foi alterada por outra pessoa. Atualize os dados.');
    const record = await model.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Tarefa nao encontrada.');
    return record;
  }

  private tarefa(item: any) {
    const planejadoMinutos = (item.alocacoes ?? []).length > 0
      ? Number(item.estimativaMinutos || 0)
      : 0;
    const recursos = (item.recursos ?? []).map((vinculo: any) => this.recursoVinculo(vinculo));
    return {
      ...item,
      valorHora: new Prisma.Decimal(item.valorHora).toFixed(4),
      observacao: item.observacao ?? null,
      recursoIds: recursos.map((vinculo: any) => vinculo.recursoId),
      recursos,
      pendenteRecurso: recursos.length === 0,
      planejadoMinutos,
      saldoMinutos: Number(item.estimativaMinutos || 0) - planejadoMinutos,
      sobreplanejada: planejadoMinutos > Number(item.estimativaMinutos || 0),
      taxas: (item.taxas ?? []).map((taxa: any) => ({
        ...taxa,
        valorHora: new Prisma.Decimal(taxa.valorHora).toFixed(4),
        criadoPor: this.user(taxa.criadoPor)
      }))
    };
  }

  private recursoVinculo(item: any) {
    return {
      id: item.id,
      recursoId: item.recursoId,
      ativo: item.recurso.ativo,
      recurso: this.recurso(item.recurso)
    };
  }

  private recurso(item: any) {
    return { id: item.id, ativo: item.ativo, usuario: this.user(item.usuario) };
  }

  private user(item: any) {
    return { id: item.id, nome: item.nome ?? null, login: item.login ?? null, email: item.email };
  }
}