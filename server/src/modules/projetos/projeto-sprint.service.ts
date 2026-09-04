import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import {
  AlterarEscopoProjetoSprintInput,
  ConcluirProjetoSprintInput,
  CreateProjetoSprintInput,
  TransicionarProjetoSprintInput,
  UpdateProjetoSprintInput
} from './dto/projeto-sprint.input';
import {
  ProjetoSprintCandidatoType,
  ProjetoSprintPainelType,
  ProjetoSprintType
} from './dto/projeto-sprint.type';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import {
  ProjetoSprintAuthorizationService,
  ProjetoSprintContexto
} from './projeto-sprint-authorization.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoRecursoHierarquiaService } from './projeto-recurso-hierarquia.service';
import {
  ProjetoItemPrioridade,
  ProjetoItemStatus,
  ProjetoItemTipo
} from './types/projeto-item.types';
import {
  ProjetoSprintDestinoIncompletos,
  ProjetoSprintPermissoesEfetivas,
  ProjetoSprintStatus
} from './types/projeto-sprint.types';

const SPRINT_INCLUDE = {
  itens: {
    include: { item: true },
    orderBy: { incluidoEm: 'asc' as const }
  }
};

@Injectable()
export class ProjetoSprintService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoSprintAuthorizationService,
    private readonly auditoria: ProjetoAuditoriaService,
    private readonly periodo: ProjetoPeriodoService,
    private readonly recursoHierarquia: ProjetoRecursoHierarquiaService
  ) {}

  async painel(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoSprintPainelType> {
    const contexto = await this.authorization.assertReadContext(projetoId, user);
    const escopo = await this.recursoHierarquia.escopo(
      user,
      contexto.empresaId,
      contexto.projeto.id
    );
    const filtroItens = this.recursoHierarquia.filtroProjetoItem(escopo);
    const [sprints, candidatos, permissoes] = await Promise.all([
      this.prisma.projetoSprint.findMany({
        where: { projetoId, empresaId: contexto.empresaId },
        include: this.sprintInclude(filtroItens),
        orderBy: [{ inicioPrevistoEm: 'desc' }, { criadoEm: 'desc' }]
      }),
      this.prisma.projetoItem.findMany({
        where: {
          projetoId,
          empresaId: contexto.empresaId,
          ...filtroItens,
          arquivadoEm: null,
          NOT: { status: { in: [ProjetoItemStatus.CONCLUIDO, ProjetoItemStatus.CANCELADO] } },
          sprints: { none: { retiradoEm: null } }
        },
        orderBy: [{ ordemBacklog: 'asc' }, { numero: 'asc' }]
      }),
      this.authorization.effectivePermissions(contexto, user)
    ]);
    const mapped = sprints.map((sprint) => this.toType(sprint));

    return {
      planejadas: mapped.filter((sprint) => sprint.status === ProjetoSprintStatus.PLANEJADA),
      ativa: mapped.find((sprint) => sprint.status === ProjetoSprintStatus.ATIVA) ?? null,
      historico: mapped.filter((sprint) =>
        sprint.status === ProjetoSprintStatus.CONCLUIDA ||
        sprint.status === ProjetoSprintStatus.CANCELADA
      ),
      candidatos: candidatos.map((item) => this.toCandidato(item)),
      permissoes: escopo.restrito
        ? {
            ...permissoes,
            podeIniciar: false,
            podeConcluir: false,
            podeCancelar: false
          }
        : permissoes
    };
  }

  async create(
    input: CreateProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    const contexto = await this.authorization.assertReadContext(input.projetoId, user);
    await this.authorization.assertAction(
      contexto,
      user,
      ProjetoAcao.INCLUIR,
      'criar sprints'
    );
    const inicio = this.date(input.inicioPrevistoEm);
    const fim = this.date(input.fimPrevistoEm);
    this.periodo.assertPeriodoValido(inicio, fim);

    return this.prisma.$transaction(async (tx) => {
      const sprint = await tx.projetoSprint.create({
        data: {
          empresaId: contexto.empresaId,
          projetoId: contexto.projeto.id,
          nome: input.nome.trim(),
          objetivo: this.optionalText(input.objetivo),
          status: ProjetoSprintStatus.PLANEJADA,
          inicioPrevistoEm: inicio,
          fimPrevistoEm: fim,
          criadoPorId: user.sub
        },
        include: SPRINT_INCLUDE
      });
      await this.audit(tx, contexto, user, sprint.id, 'CRIADA', {
        nome: sprint.nome,
        inicioPrevistoEm: inicio,
        fimPrevistoEm: fim
      });
      return this.toType(sprint);
    });
  }

  async update(
    input: UpdateProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    const reference = await this.reference(input.id);
    const contexto = await this.authorization.assertReadContext(reference.projetoId, user);
    const escopo = await this.recursoHierarquia.escopo(
      user,
      contexto.empresaId,
      contexto.projeto.id
    );
    const filtroItens = this.recursoHierarquia.filtroProjetoItem(escopo);
    await this.authorization.assertAction(
      contexto,
      user,
      ProjetoAcao.ALTERAR,
      'alterar sprints'
    );
    if (reference.status !== ProjetoSprintStatus.PLANEJADA) {
      throw new BadRequestException('Somente sprints planejadas podem ser alteradas.');
    }
    const inicio = this.date(input.inicioPrevistoEm);
    const fim = this.date(input.fimPrevistoEm);
    this.periodo.assertPeriodoValido(inicio, fim);

    return this.prisma.$transaction(async (tx) => {
      await this.claimVersion(tx, input.id, input.versao, {
        nome: input.nome.trim(),
        objetivo: this.optionalText(input.objetivo),
        inicioPrevistoEm: inicio,
        fimPrevistoEm: fim,
        versao: { increment: 1 }
      });
      await this.audit(tx, contexto, user, input.id, 'ALTERADA', {
        versaoAnterior: input.versao
      });
      return this.findOne(input.id, tx, filtroItens);
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  }

  async adicionarItem(
    input: AlterarEscopoProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    const sprint = await this.reference(input.sprintId);
    const contexto = await this.authorization.assertReadContext(sprint.projetoId, user);
    const escopo = await this.recursoHierarquia.escopo(
      user,
      contexto.empresaId,
      contexto.projeto.id
    );
    const filtroItens = this.recursoHierarquia.filtroProjetoItem(escopo);
    await this.authorization.assertAction(
      contexto,
      user,
      ProjetoAcao.PLANEJAR,
      'planejar o escopo da sprint'
    );
    this.assertEscopoMutavel(sprint.status);

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.projetoItem.findFirst({
        where: {
          id: input.itemId,
          projetoId: sprint.projetoId,
          empresaId: contexto.empresaId,
          arquivadoEm: null,
          ...filtroItens
        }
      });
      if (!item) throw new NotFoundException('Item de projeto nao encontrado.');
      if (
        item.status === ProjetoItemStatus.CONCLUIDO ||
        item.status === ProjetoItemStatus.CANCELADO
      ) {
        throw new BadRequestException('Itens finalizados nao podem entrar em uma sprint.');
      }
      const vinculo = await tx.projetoSprintItem.findFirst({
        where: { itemId: item.id, retiradoEm: null }
      });
      if (vinculo) {
        throw new ConflictException('O item ja pertence a uma sprint.');
      }
      await this.claimVersion(tx, sprint.id, input.versao, {
        versao: { increment: 1 },
        ...(sprint.status === ProjetoSprintStatus.ATIVA
          ? { itensAdicionadosAposInicio: { increment: 1 } }
          : {})
      });
      await tx.projetoSprintItem.create({
        data: {
          empresaId: contexto.empresaId,
          projetoId: sprint.projetoId,
          sprintId: sprint.id,
          itemId: item.id,
          incluidoPorId: user.sub,
          escopoInicial: false
        }
      });
      await this.audit(tx, contexto, user, sprint.id, 'ITEM_INCLUIDO', {
        itemId: item.id,
        chave: item.chave,
        aposInicio: sprint.status === ProjetoSprintStatus.ATIVA
      });
      return this.findOne(sprint.id, tx, filtroItens);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async removerItem(
    input: AlterarEscopoProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    const sprint = await this.reference(input.sprintId);
    const contexto = await this.authorization.assertReadContext(sprint.projetoId, user);
    const escopo = await this.recursoHierarquia.escopo(
      user,
      contexto.empresaId,
      contexto.projeto.id
    );
    const filtroItens = this.recursoHierarquia.filtroProjetoItem(escopo);
    await this.authorization.assertAction(
      contexto,
      user,
      ProjetoAcao.PLANEJAR,
      'planejar o escopo da sprint'
    );
    this.assertEscopoMutavel(sprint.status);

    return this.prisma.$transaction(async (tx) => {
      const vinculo = await tx.projetoSprintItem.findFirst({
        where: {
          sprintId: sprint.id,
          itemId: input.itemId,
          retiradoEm: null,
          item: filtroItens
        },
        include: { item: true }
      });
      if (!vinculo) {
        throw new NotFoundException('O item nao pertence ao escopo atual da sprint.');
      }
      await this.claimVersion(tx, sprint.id, input.versao, {
        versao: { increment: 1 },
        ...(sprint.status === ProjetoSprintStatus.ATIVA
          ? { itensRetiradosAposInicio: { increment: 1 } }
          : {})
      });
      await tx.projetoSprintItem.update({
        where: { id: vinculo.id },
        data: { retiradoEm: new Date(), retiradoPorId: user.sub }
      });
      await this.audit(tx, contexto, user, sprint.id, 'ITEM_RETIRADO', {
        itemId: vinculo.itemId,
        chave: vinculo.item.chave,
        aposInicio: sprint.status === ProjetoSprintStatus.ATIVA
      });
      return this.findOne(sprint.id, tx, filtroItens);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async iniciar(
    input: TransicionarProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    const sprint = await this.reference(input.id);
    const contexto = await this.authorization.assertReadContext(sprint.projetoId, user);
    const escopo = await this.recursoHierarquia.escopo(
      user,
      contexto.empresaId,
      contexto.projeto.id
    );
    this.recursoHierarquia.assertVisaoCompleta(escopo, 'iniciar a sprint');
    await this.authorization.assertAction(
      contexto,
      user,
      ProjetoAcao.INICIAR,
      'iniciar a sprint'
    );
    if (sprint.status !== ProjetoSprintStatus.PLANEJADA) {
      throw new BadRequestException('Somente sprints planejadas podem ser iniciadas.');
    }

    return this.prisma.$transaction(async (tx) => {
      const ativa = await tx.projetoSprint.findFirst({
        where: {
          projetoId: sprint.projetoId,
          status: ProjetoSprintStatus.ATIVA,
          id: { not: sprint.id }
        }
      });
      if (ativa) {
        throw new ConflictException('O projeto ja possui uma sprint ativa.');
      }
      const itens = await tx.projetoSprintItem.findMany({
        where: { sprintId: sprint.id, retiradoEm: null },
        include: { item: true }
      });
      await this.claimVersion(tx, sprint.id, input.versao, {
        status: ProjetoSprintStatus.ATIVA,
        inicioRealEm: new Date(),
        escopoInicialItens: itens.length,
        escopoInicialEstimativa: this.sumEstimate(itens),
        itensAdicionadosAposInicio: 0,
        itensRetiradosAposInicio: 0,
        versao: { increment: 1 }
      });
      for (const vinculo of itens) {
        await tx.projetoSprintItem.update({
          where: { id: vinculo.id },
          data: {
            escopoInicial: true,
            statusAoIniciar: vinculo.item.status,
            estimativaAoIniciar: vinculo.item.estimativaMinutos
          }
        });
      }
      await this.audit(tx, contexto, user, sprint.id, 'INICIADA', {
        escopoInicialItens: itens.length,
        escopoInicialEstimativa: this.sumEstimate(itens)
      });
      return this.findOne(sprint.id, tx);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async concluir(
    input: ConcluirProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    const sprint = await this.reference(input.id);
    const contexto = await this.authorization.assertReadContext(sprint.projetoId, user);
    const escopo = await this.recursoHierarquia.escopo(
      user,
      contexto.empresaId,
      contexto.projeto.id
    );
    this.recursoHierarquia.assertVisaoCompleta(escopo, 'concluir a sprint');
    await this.authorization.assertAction(
      contexto,
      user,
      ProjetoAcao.CONCLUIR,
      'concluir a sprint'
    );
    if (sprint.status !== ProjetoSprintStatus.ATIVA) {
      throw new BadRequestException('Somente a sprint ativa pode ser concluida.');
    }

    return this.prisma.$transaction(async (tx) => {
      const itens = await tx.projetoSprintItem.findMany({
        where: { sprintId: sprint.id, retiradoEm: null },
        include: { item: true }
      });
      const incompletos = itens.filter(
        ({ item }) => item.status !== ProjetoItemStatus.CONCLUIDO
      );
      let destino: { id: string } | null = null;

      if (input.destinoIncompletos === ProjetoSprintDestinoIncompletos.SPRINT) {
        if (!input.sprintDestinoId || input.sprintDestinoId === sprint.id) {
          throw new BadRequestException(
            'Informe uma sprint planejada de destino para os itens incompletos.'
          );
        }
        destino = await tx.projetoSprint.findFirst({
          where: {
            id: input.sprintDestinoId,
            projetoId: sprint.projetoId,
            status: ProjetoSprintStatus.PLANEJADA
          },
          select: { id: true }
        });
        if (!destino) {
          throw new BadRequestException('A sprint de destino deve estar planejada.');
        }
      }

      const agora = new Date();
      for (const vinculo of itens) {
        const concluido = vinculo.item.status === ProjetoItemStatus.CONCLUIDO;
        await tx.projetoSprintItem.update({
          where: { id: vinculo.id },
          data: {
            statusAoEncerrar: vinculo.item.status,
            estimativaAoEncerrar: vinculo.item.estimativaMinutos,
            concluidoNoSprint: concluido,
            ...(!concluido
              ? { retiradoEm: agora, retiradoPorId: user.sub }
              : {})
          }
        });
        if (!concluido && destino) {
          await tx.projetoSprintItem.create({
            data: {
              empresaId: contexto.empresaId,
              projetoId: sprint.projetoId,
              sprintId: destino.id,
              itemId: vinculo.itemId,
              incluidoPorId: user.sub,
              escopoInicial: false
            }
          });
        }
      }

      const concluidos = itens.filter(
        ({ item }) => item.status === ProjetoItemStatus.CONCLUIDO
      );
      await this.claimVersion(tx, sprint.id, input.versao, {
        status: ProjetoSprintStatus.CONCLUIDA,
        fimRealEm: agora,
        resultado: this.optionalText(input.resultado),
        itensConcluidos: concluidos.length,
        estimativaConcluida: this.sumEstimate(concluidos),
        versao: { increment: 1 }
      });
      await this.audit(tx, contexto, user, sprint.id, 'CONCLUIDA', {
        itensConcluidos: concluidos.length,
        itensIncompletos: incompletos.length,
        destinoIncompletos: input.destinoIncompletos,
        sprintDestinoId: destino?.id ?? null
      });
      return this.findOne(sprint.id, tx);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async cancelar(
    input: TransicionarProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    const sprint = await this.reference(input.id);
    const contexto = await this.authorization.assertReadContext(sprint.projetoId, user);
    const escopo = await this.recursoHierarquia.escopo(
      user,
      contexto.empresaId,
      contexto.projeto.id
    );
    this.recursoHierarquia.assertVisaoCompleta(escopo, 'cancelar a sprint');
    await this.authorization.assertAction(
      contexto,
      user,
      ProjetoAcao.CANCELAR,
      'cancelar a sprint'
    );
    if (
      sprint.status === ProjetoSprintStatus.CONCLUIDA ||
      sprint.status === ProjetoSprintStatus.CANCELADA
    ) {
      throw new BadRequestException('A sprint ja foi encerrada.');
    }

    return this.prisma.$transaction(async (tx) => {
      const agora = new Date();
      await this.claimVersion(tx, sprint.id, input.versao, {
        status: ProjetoSprintStatus.CANCELADA,
        canceladoEm: agora,
        canceladoPorId: user.sub,
        fimRealEm: sprint.status === ProjetoSprintStatus.ATIVA ? agora : null,
        versao: { increment: 1 }
      });
      await tx.projetoSprintItem.updateMany({
        where: { sprintId: sprint.id, retiradoEm: null },
        data: { retiradoEm: agora, retiradoPorId: user.sub }
      });
      await this.audit(tx, contexto, user, sprint.id, 'CANCELADA', {
        statusAnterior: sprint.status
      });
      return this.findOne(sprint.id, tx);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async reference(id: string): Promise<any> {
    const sprint = await this.prisma.projetoSprint.findUnique({ where: { id } });
    if (!sprint) throw new NotFoundException('Sprint nao encontrada.');
    return sprint;
  }

  private async findOne(
    id: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
    filtroItens: Prisma.ProjetoItemWhereInput = {}
  ): Promise<ProjetoSprintType> {
    const sprint = await tx.projetoSprint.findUnique({
      where: { id },
      include: this.sprintInclude(filtroItens)
    });
    if (!sprint) throw new NotFoundException('Sprint nao encontrada.');
    return this.toType(sprint);
  }

  private sprintInclude(filtroItens: Prisma.ProjetoItemWhereInput) {
    return {
      itens: {
        where: { item: filtroItens },
        include: { item: true },
        orderBy: { incluidoEm: 'asc' as const }
      }
    };
  }

  private async claimVersion(
    tx: Prisma.TransactionClient | PrismaService,
    id: string,
    versao: number,
    data: Prisma.ProjetoSprintUncheckedUpdateManyInput
  ): Promise<void> {
    const updated = await tx.projetoSprint.updateMany({
      where: { id, versao },
      data
    });
    if (updated.count !== 1) {
      throw new ConflictException(
        'A sprint foi alterada por outra pessoa. Atualize os dados e tente novamente.'
      );
    }
  }

  private assertEscopoMutavel(status: string): void {
    if (
      status !== ProjetoSprintStatus.PLANEJADA &&
      status !== ProjetoSprintStatus.ATIVA
    ) {
      throw new BadRequestException('O escopo de uma sprint encerrada e somente leitura.');
    }
  }

  private audit(
    tx: Prisma.TransactionClient,
    contexto: ProjetoSprintContexto,
    user: JwtPayload,
    sprintId: string,
    evento: string,
    dados?: unknown
  ): Promise<unknown> {
    return this.auditoria.registrar(tx, {
      empresaId: contexto.empresaId,
      projetoId: contexto.projeto.id,
      usuarioId: user.sub,
      entidade: 'SPRINT',
      entidadeId: sprintId,
      evento,
      dados
    });
  }

  private toType(sprint: any): ProjetoSprintType {
    const itens = (sprint.itens ?? []).map((vinculo: any) => ({
      vinculoId: vinculo.id,
      itemId: vinculo.itemId,
      chave: vinculo.item.chave,
      titulo: vinculo.item.titulo,
      tipo: vinculo.item.tipo as ProjetoItemTipo,
      status: vinculo.item.status as ProjetoItemStatus,
      prioridade: vinculo.item.prioridade as ProjetoItemPrioridade,
      estimativaMinutos: vinculo.item.estimativaMinutos ?? null,
      escopoInicial: vinculo.escopoInicial,
      adicionadoAposInicio: !!sprint.inicioRealEm && !vinculo.escopoInicial,
      retiradoAposInicio: !!sprint.inicioRealEm && !!vinculo.retiradoEm,
      incluidoEm: vinculo.incluidoEm,
      retiradoEm: vinculo.retiradoEm ?? null,
      statusAoIniciar: vinculo.statusAoIniciar as ProjetoItemStatus | null,
      estimativaAoIniciar: vinculo.estimativaAoIniciar ?? null,
      statusAoEncerrar: vinculo.statusAoEncerrar as ProjetoItemStatus | null,
      estimativaAoEncerrar: vinculo.estimativaAoEncerrar ?? null,
      concluidoNoSprint: vinculo.concluidoNoSprint ?? null
    }));
    const atuais = itens.filter((item: ProjetoSprintType['itens'][number]) => !item.retiradoEm);
    const concluidos = atuais.filter(
      (item: ProjetoSprintType['itens'][number]) =>
        item.status === ProjetoItemStatus.CONCLUIDO
    ).length;

    return {
      id: sprint.id,
      projetoId: sprint.projetoId,
      nome: sprint.nome,
      objetivo: sprint.objetivo ?? null,
      status: sprint.status as ProjetoSprintStatus,
      inicioPrevistoEm: sprint.inicioPrevistoEm,
      fimPrevistoEm: sprint.fimPrevistoEm,
      inicioRealEm: sprint.inicioRealEm ?? null,
      fimRealEm: sprint.fimRealEm ?? null,
      resultado: sprint.resultado ?? null,
      versao: sprint.versao,
      escopoInicialItens: sprint.escopoInicialItens ?? null,
      escopoInicialEstimativa: sprint.escopoInicialEstimativa ?? null,
      itensConcluidos: sprint.itensConcluidos ?? null,
      estimativaConcluida: sprint.estimativaConcluida ?? null,
      itensAdicionadosAposInicio: sprint.itensAdicionadosAposInicio ?? 0,
      itensRetiradosAposInicio: sprint.itensRetiradosAposInicio ?? 0,
      totalItens: atuais.length,
      totalConcluidos: concluidos,
      progressoPercentual: atuais.length
        ? Math.round((concluidos / atuais.length) * 100)
        : 0,
      itens,
      criadoEm: sprint.criadoEm,
      atualizadoEm: sprint.atualizadoEm
    };
  }

  private toCandidato(item: any): ProjetoSprintCandidatoType {
    return {
      id: item.id,
      chave: item.chave,
      titulo: item.titulo,
      tipo: item.tipo as ProjetoItemTipo,
      status: item.status as ProjetoItemStatus,
      prioridade: item.prioridade as ProjetoItemPrioridade,
      estimativaMinutos: item.estimativaMinutos ?? null
    };
  }

  private sumEstimate(vinculos: Array<{ item: { estimativaMinutos?: number | null } }>): number {
    return vinculos.reduce(
      (total, vinculo) => total + (vinculo.item.estimativaMinutos ?? 0),
      0
    );
  }

  private optionalText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private date(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Informe uma data valida.');
    }
    return date;
  }
}
