import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import { ExcluirProjetoTarefaInput, SalvarProjetoTarefaInput } from './dto/projeto-tarefa.input';
import { ProjetoTarefaAuthorizationService } from './projeto-tarefa-authorization.service';

const USER_SELECT = { id: true, nome: true, login: true, email: true };
const PROJECT_SELECT = { id: true, chave: true, nome: true, arquivadoEm: true };
const RESOURCE_INCLUDE = { usuario: { select: USER_SELECT } };
const TASK_INCLUDE = {
  recurso: { include: RESOURCE_INCLUDE },
  projetoRecurso: { include: { projeto: { select: PROJECT_SELECT } } },
  alocacoes: { orderBy: { inicioEm: 'asc' as const } },
  taxas: { include: { criadoPor: { select: USER_SELECT } }, orderBy: { criadoEm: 'desc' as const } }
};

@Injectable()
export class ProjetoTarefaService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ProjetoTarefaAuthorizationService) {}

  async painel(user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user);
    const [tarefas, recursos, permissoes] = await Promise.all([
      this.prisma.projetoTarefa.findMany({ where: { empresaId }, include: TASK_INCLUDE, orderBy: { criadoEm: 'asc' } }),
      this.prisma.recurso.findMany({ where: { empresaId }, include: RESOURCE_INCLUDE, orderBy: { criadoEm: 'asc' } }),
      this.authorization.permissoes(user)
    ]);
    return {
      tarefas: tarefas.map((item) => this.tarefa(item)),
      recursos: recursos.map((item) => this.recurso(item)),
      permissoes
    };
  }

  async salvar(input: SalvarProjetoTarefaInput, user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user, input.id ? ProjetoAcao.ALTERAR : ProjetoAcao.INCLUIR);
    const atual = input.id
      ? await this.prisma.projetoTarefa.findFirst({ where: { id: input.id, empresaId }, include: TASK_INCLUDE })
      : null;
    if (input.id && !atual) throw new NotFoundException('Tarefa nao encontrada.');
    if (atual && atual.recursoId !== input.recursoId) throw new BadRequestException('O recurso da tarefa nao pode ser alterado. Cadastre outra tarefa.');

    const recurso = await this.prisma.recurso.findFirst({ where: { id: input.recursoId, empresaId }, include: RESOURCE_INCLUDE });
    if (!recurso) throw new BadRequestException('Selecione um recurso da empresa.');
    if (input.ativo && !recurso.ativo) throw new BadRequestException('Recursos inativos nao podem receber tarefas ativas.');
    const projetoRecurso = await this.resolveProjetoRecurso(empresaId, input.recursoId, input.projetoRecursoId, atual, input.ativo);

    const funcionalidade = input.funcionalidade.trim();
    if (!funcionalidade) throw new BadRequestException('Descreva a funcionalidade da tarefa.');
    if (!Number.isInteger(input.estimativaMinutos) || input.estimativaMinutos <= 0) throw new BadRequestException('As horas estimadas devem ser maiores que zero.');
    const valorHora = this.money(input.valorHora);
    const moeda = input.moeda.trim().toUpperCase();
    const observacao = input.observacao?.trim() || null;
    const saved = await this.prisma.$transaction(async (tx) => {
      const data = { recursoId: input.recursoId, projetoRecursoId: projetoRecurso?.id ?? atual?.projetoRecursoId ?? null, funcionalidade, estimativaMinutos: input.estimativaMinutos, valorHora, moeda, observacao, ativo: input.ativo };
      const tarefa = atual
        ? await this.updateVersioned(tx.projetoTarefa, atual.id, input.versao, data, empresaId)
        : await tx.projetoTarefa.create({ data: { empresaId, ...data } });
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
    const result = await this.prisma.projetoTarefa.deleteMany({ where: { id: input.id, empresaId, versao: input.versao } });
    if (result.count !== 1) throw new ConflictException('A tarefa foi alterada por outra pessoa ou nao existe mais. Atualize os dados.');
    return true;
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
    } catch { throw new BadRequestException('O valor por hora deve ser maior que zero.'); }
  }

  private async updateVersioned(model: any, id: string, versao: number | null | undefined, data: any, empresaId: number) {
    if (!versao) throw new BadRequestException('Informe a versao para alterar a tarefa.');
    const result = await model.updateMany({ where: { id, empresaId, versao }, data: { ...data, versao: { increment: 1 } } });
    if (result.count !== 1) throw new ConflictException('A tarefa foi alterada por outra pessoa. Atualize os dados.');
    const record = await model.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Tarefa nao encontrada.');
    return record;
  }

  private async resolveProjetoRecurso(empresaId: number, recursoId: string, solicitadoId: string | null | undefined, atual: any, ativo: boolean) {
    if (atual?.projetoRecursoId && solicitadoId && atual.projetoRecursoId !== solicitadoId) {
      throw new BadRequestException('O projeto da tarefa nao pode ser alterado. Cadastre outra tarefa.');
    }
    const id = solicitadoId || atual?.projetoRecursoId;
    if (id) {
      const vinculo = await this.prisma.projetoRecurso.findFirst({ where: { id, empresaId, recursoId }, include: { projeto: { select: PROJECT_SELECT } } });
      if (!vinculo) throw new BadRequestException('Selecione um projeto vinculado ao recurso.');
      if (ativo && (!vinculo.ativo || vinculo.projeto.arquivadoEm)) throw new BadRequestException('Tarefas ativas exigem um vinculo ativo com um projeto nao arquivado.');
      return vinculo;
    }
    if (atual) return null;
    const candidatos = await this.prisma.projetoRecurso.findMany({
      where: { empresaId, recursoId, ativo: true, projeto: { arquivadoEm: null } },
      include: { projeto: { select: PROJECT_SELECT } },
      take: 2
    });
    if (candidatos.length === 1) return candidatos[0];
    throw new BadRequestException(candidatos.length === 0
      ? 'Vincule o recurso a um projeto antes de cadastrar a tarefa.'
      : 'Selecione o projeto em que esta tarefa sera executada.');
  }

  private tarefa(item: any) {
    const planejadoMinutos = (item.alocacoes ?? []).reduce((total: number, alocacao: any) => total + Number(alocacao.alocacaoMinutos || 0), 0);
    return {
      ...item,
      valorHora: new Prisma.Decimal(item.valorHora).toFixed(4),
      observacao: item.observacao ?? null,
      projeto: item.projetoRecurso?.projeto ?? null,
      pendenteVinculo: !item.projetoRecursoId,
      planejadoMinutos,
      saldoMinutos: Number(item.estimativaMinutos || 0) - planejadoMinutos,
      sobreplanejada: planejadoMinutos > Number(item.estimativaMinutos || 0),
      recurso: this.recurso(item.recurso),
      taxas: (item.taxas ?? []).map((taxa: any) => ({ ...taxa, valorHora: new Prisma.Decimal(taxa.valorHora).toFixed(4), criadoPor: this.user(taxa.criadoPor) }))
    };
  }
  private recurso(item: any) { return { id: item.id, ativo: item.ativo, usuario: this.user(item.usuario) }; }
  private user(item: any) { return { id: item.id, nome: item.nome ?? null, login: item.login ?? null, email: item.email }; }
}
