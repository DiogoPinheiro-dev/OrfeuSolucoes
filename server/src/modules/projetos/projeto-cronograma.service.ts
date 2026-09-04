import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import {
  CreateProjetoItemDependenciaInput,
  ProjetoCronogramaFiltroInput,
  UpdateProjetoCronogramaItemDatasInput,
  VersionarProjetoItemDependenciaInput
} from './dto/projeto-cronograma.input';
import {
  ProjetoCronogramaElementoType,
  ProjetoCronogramaInconsistenciaType,
  ProjetoCronogramaPainelType,
  ProjetoItemDependenciaType
} from './dto/projeto-cronograma.type';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import {
  ProjetoCronogramaAuthorizationService,
  ProjetoCronogramaContexto
} from './projeto-cronograma-authorization.service';
import {
  normalizeCalendarDate,
  validatePlannedDates
} from './policies/projeto-input.policy';
import { assertProjetoDependenciaSemCiclo } from './policies/projeto-dependencia.policy';
import {
  ProjetoCronogramaAgrupamento,
  ProjetoCronogramaElementoTipo,
  ProjetoCronogramaSeveridade
} from './types/projeto-cronograma.types';
import { ProjetoItemStatus } from './types/projeto-item.types';
import {
  ProjetoRecursoEscopoHierarquico,
  ProjetoRecursoHierarquiaService
} from './projeto-recurso-hierarquia.service';

const DEPENDENCIA_INCLUDE = {
  bloqueador: true,
  bloqueado: true
};

type CronogramaItem = {
  id: string;
  projetoId: string;
  chave: string;
  titulo: string;
  tipo: string;
  status: string;
  responsavelId: string | null;
  responsavel?: { nome?: string | null; login?: string | null; email: string } | null;
  inicioPrevistoEm: Date | null;
  fimPrevistoEm: Date | null;
  estimativaMinutos: number | null;
  versao: number;
  arquivadoEm: Date | null;
};

@Injectable()
export class ProjetoCronogramaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoCronogramaAuthorizationService,
    private readonly auditoria: ProjetoAuditoriaService,
    private readonly recursoHierarquia: ProjetoRecursoHierarquiaService
  ) {}

  async painel(
    input: ProjetoCronogramaFiltroInput,
    user: JwtPayload
  ): Promise<ProjetoCronogramaPainelType> {
    const contexto = await this.authorization.assertReadContext(
      input.projetoId,
      user
    );
    const inicioFiltro = input.inicioEm
      ? normalizeCalendarDate(input.inicioEm)
      : null;
    const fimFiltro = input.fimEm ? normalizeCalendarDate(input.fimEm) : null;
    validatePlannedDates(inicioFiltro, fimFiltro);
    const escopo = await this.recursoHierarquia.escopo(
      user,
      contexto.empresaId,
      contexto.projeto.id
    );
    const filtroItens = this.recursoHierarquia.filtroProjetoItem(escopo);

    const [itens, marcos, entregas, dependencias, permissoes] =
      await Promise.all([
        this.prisma.projetoItem.findMany({
          where: {
            projetoId: input.projetoId,
            empresaId: contexto.empresaId,
            ...filtroItens
          },
          include: { responsavel: true },
          orderBy: [{ ordemBacklog: 'asc' }, { numero: 'asc' }]
        }),
        this.prisma.projetoMarco.findMany({
          where: {
            projetoId: input.projetoId,
            empresaId: contexto.empresaId
          },
          include: {
            responsavel: true,
            itens: { where: { item: filtroItens }, include: { item: true } }
          },
          orderBy: [{ dataPrevistaEm: 'asc' }, { nome: 'asc' }]
        }),
        this.prisma.projetoEntrega.findMany({
          where: {
            projetoId: input.projetoId,
            empresaId: contexto.empresaId
          },
          include: {
            responsavel: true,
            itens: { where: { item: filtroItens }, include: { item: true } }
          },
          orderBy: [{ inicioPrevistoEm: 'asc' }, { nome: 'asc' }]
        }),
        this.prisma.projetoItemDependencia.findMany({
          where: {
            projetoId: input.projetoId,
            empresaId: contexto.empresaId,
            bloqueador: filtroItens,
            bloqueado: filtroItens,
            ...(!input.incluirDependenciasArquivadas
              ? { arquivadoEm: null }
              : {})
          },
          include: DEPENDENCIA_INCLUDE,
          orderBy: [{ criadoEm: 'asc' }]
        }),
        this.authorization.effectivePermissions(contexto, user)
      ]);

    const ativas = dependencias.filter((item) => !item.arquivadoEm);
    const incoming = new Map<string, typeof ativas>();
    for (const dependencia of ativas) {
      const list = incoming.get(dependencia.bloqueadoId) ?? [];
      list.push(dependencia);
      incoming.set(dependencia.bloqueadoId, list);
    }

    const itemElements = itens.map((item) =>
      this.itemElement(
        item as CronogramaItem,
        incoming.get(item.id) ?? [],
        input.agrupamento ?? ProjetoCronogramaAgrupamento.NENHUM
      )
    );
    const byItem = new Map(itemElements.map((item) => [item.id, item]));
    const marcoElements = marcos.map((marco) => {
      const itemIds = marco.itens.map((entry) => entry.itemId);
      const related = itemIds
        .map((id) => byItem.get(id))
        .filter((item): item is ProjetoCronogramaElementoType => !!item);
      return {
        id: marco.id,
        tipo: ProjetoCronogramaElementoTipo.MARCO,
        titulo: marco.nome,
        chave: null,
        status: marco.status,
        grupo: this.groupLabel(
          input.agrupamento,
          ProjetoCronogramaElementoTipo.MARCO,
          marco.status,
          marco.responsavel
        ),
        inicioEm: marco.dataPrevistaEm,
        fimEm: marco.dataPrevistaEm,
        versao: marco.versao,
        progressoPercentual: this.progress(marco.itens.map((entry) => entry.item)),
        semPeriodo: false,
        bloqueado: related.some((item) => item.bloqueado),
        riscoAtraso:
          related.some((item) => item.riscoAtraso) ||
          this.isPast(marco.dataPrevistaEm, marco.status, ['ATINGIDO', 'CANCELADO']),
        arquivado: !!marco.arquivadoEm,
        itemIds
      };
    });
    const entregaElements = entregas.map((entrega) => {
      const itemIds = entrega.itens.map((entry) => entry.itemId);
      const related = itemIds
        .map((id) => byItem.get(id))
        .filter((item): item is ProjetoCronogramaElementoType => !!item);
      return {
        id: entrega.id,
        tipo: ProjetoCronogramaElementoTipo.ENTREGA,
        titulo: entrega.nome,
        chave: null,
        status: entrega.status,
        grupo: this.groupLabel(
          input.agrupamento,
          ProjetoCronogramaElementoTipo.ENTREGA,
          entrega.status,
          entrega.responsavel
        ),
        inicioEm: entrega.inicioPrevistoEm,
        fimEm: entrega.fimPrevistoEm,
        versao: entrega.versao,
        progressoPercentual: this.progress(
          entrega.itens.map((entry) => entry.item)
        ),
        semPeriodo: false,
        bloqueado: related.some((item) => item.bloqueado),
        riscoAtraso:
          related.some((item) => item.riscoAtraso) ||
          this.isPast(entrega.fimPrevistoEm, entrega.status, [
            'CONCLUIDA',
            'CANCELADA'
          ]),
        arquivado: !!entrega.arquivadoEm,
        itemIds
      };
    });

    const allElements = [...itemElements, ...marcoElements, ...entregaElements];
    const elementos = allElements.filter((item) =>
      this.overlaps(item.inicioEm, item.fimEm, inicioFiltro, fimFiltro)
    );
    const inconsistencias = this.inconsistencies(
      allElements,
      dependencias.map((item) => this.toDependencia(item))
    );
    const dated = elementos.filter((item) => item.inicioEm && item.fimEm);
    const timestamps = dated.flatMap((item) => [
      item.inicioEm!.getTime(),
      item.fimEm!.getTime()
    ]);

    return {
      elementos,
      dependencias: dependencias.map((item) => this.toDependencia(item)),
      inconsistencias,
      inicioEm: timestamps.length ? new Date(Math.min(...timestamps)) : null,
      fimEm: timestamps.length ? new Date(Math.max(...timestamps)) : null,
      permissoes
    };
  }

  async createDependencia(
    input: CreateProjetoItemDependenciaInput,
    user: JwtPayload
  ): Promise<ProjetoItemDependenciaType> {
    if (input.bloqueadorId === input.bloqueadoId) {
      throw new BadRequestException(
        'Um item nao pode bloquear a si proprio.'
      );
    }
    const contexto = await this.authorization.assertReadContext(
      input.projetoId,
      user
    );
    await this.authorization.assertManageDependencies(contexto, user);
    const escopo = await this.recursoHierarquia.escopo(
      user,
      contexto.empresaId,
      contexto.projeto.id
    );

    return this.prisma.$transaction(async (tx) => {
      await this.assertEndpoints(tx, contexto, input, escopo);
      const existente = await tx.projetoItemDependencia.findFirst({
        where: {
          projetoId: input.projetoId,
          bloqueadorId: input.bloqueadorId,
          bloqueadoId: input.bloqueadoId
        },
        include: DEPENDENCIA_INCLUDE
      });
      if (existente && !existente.arquivadoEm) {
        throw new BadRequestException('Esta dependencia ja existe.');
      }
      await this.assertNoCycle(
        tx,
        input.projetoId,
        input.bloqueadorId,
        input.bloqueadoId,
        existente?.id
      );

      const dependencia = existente
        ? await tx.projetoItemDependencia.update({
            where: { id: existente.id },
            data: {
              arquivadoEm: null,
              arquivadoPorId: null,
              versao: { increment: 1 }
            },
            include: DEPENDENCIA_INCLUDE
          })
        : await tx.projetoItemDependencia.create({
            data: {
              empresaId: contexto.empresaId,
              projetoId: input.projetoId,
              bloqueadorId: input.bloqueadorId,
              bloqueadoId: input.bloqueadoId,
              criadoPorId: user.sub
            },
            include: DEPENDENCIA_INCLUDE
          });
      await this.auditoria.registrar(tx, {
        empresaId: contexto.empresaId,
        projetoId: input.projetoId,
        usuarioId: user.sub,
        entidade: 'DEPENDENCIA',
        entidadeId: dependencia.id,
        evento: existente ? 'REATIVADA' : 'CRIADA',
        dados: {
          bloqueadorId: input.bloqueadorId,
          bloqueadoId: input.bloqueadoId
        }
      });
      return this.toDependencia(dependencia);
    });
  }

  async archiveDependencia(
    input: VersionarProjetoItemDependenciaInput,
    user: JwtPayload,
    reactivate: boolean
  ): Promise<ProjetoItemDependenciaType> {
    const reference = await this.dependenciaReference(input.id);
    const contexto = await this.authorization.assertReadContext(
      reference.projetoId,
      user
    );
    await this.authorization.assertManageDependencies(contexto, user);
    const escopo = await this.recursoHierarquia.escopo(
      user,
      contexto.empresaId,
      contexto.projeto.id
    );
    if (reactivate === !reference.arquivadoEm) {
      throw new BadRequestException(
        reactivate
          ? 'A dependencia nao esta arquivada.'
          : 'A dependencia ja esta arquivada.'
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await this.assertEndpoints(tx, contexto, {
        projetoId: reference.projetoId,
        bloqueadorId: reference.bloqueadorId,
        bloqueadoId: reference.bloqueadoId
      }, escopo);
      if (reactivate) {
        await this.assertNoCycle(
          tx,
          reference.projetoId,
          reference.bloqueadorId,
          reference.bloqueadoId,
          reference.id
        );
      }
      const result = await tx.projetoItemDependencia.updateMany({
        where: { id: input.id, versao: input.versao },
        data: {
          arquivadoEm: reactivate ? null : new Date(),
          arquivadoPorId: reactivate ? null : user.sub,
          versao: { increment: 1 }
        }
      });
      if (result.count !== 1) this.throwConflict();
      const updated = await tx.projetoItemDependencia.findUnique({
        where: { id: input.id },
        include: DEPENDENCIA_INCLUDE
      });
      await this.auditoria.registrar(tx, {
        empresaId: contexto.empresaId,
        projetoId: reference.projetoId,
        usuarioId: user.sub,
        entidade: 'DEPENDENCIA',
        entidadeId: input.id,
        evento: reactivate ? 'REATIVADA' : 'ARQUIVADA'
      });
      return this.toDependencia(updated!);
    });
  }

  async updateItemDates(
    input: UpdateProjetoCronogramaItemDatasInput,
    user: JwtPayload
  ): Promise<ProjetoCronogramaElementoType> {
    const current = await this.prisma.projetoItem.findUnique({
      where: { id: input.id },
      include: { responsavel: true }
    });
    if (!current) throw new NotFoundException('Item de projeto nao encontrado.');
    if (current.arquivadoEm) {
      throw new BadRequestException(
        'Itens arquivados estao disponiveis somente para consulta.'
      );
    }
    const contexto = await this.authorization.assertReadContext(
      current.projetoId,
      user
    );
    await this.authorization.assertEditDates(contexto, user);
    const escopo = await this.recursoHierarquia.escopo(
      user,
      contexto.empresaId,
      contexto.projeto.id
    );
    this.recursoHierarquia.assertPodeAcessarResponsavel(
      escopo,
      current.responsavelId
    );
    const inicio = input.inicioPrevistoEm === undefined
      ? current.inicioPrevistoEm
      : normalizeCalendarDate(input.inicioPrevistoEm);
    const fim = input.fimPrevistoEm === undefined
      ? current.fimPrevistoEm
      : normalizeCalendarDate(input.fimPrevistoEm);
    validatePlannedDates(inicio, fim);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.projetoItem.updateMany({
        where: { id: input.id, versao: input.versao },
        data: {
          inicioPrevistoEm: inicio,
          fimPrevistoEm: fim,
          versao: { increment: 1 }
        }
      });
      if (result.count !== 1) this.throwConflict();
      await this.auditoria.registrar(tx, {
        empresaId: contexto.empresaId,
        projetoId: current.projetoId,
        usuarioId: user.sub,
        entidade: 'ITEM',
        entidadeId: current.id,
        evento: 'DATAS_CRONOGRAMA_ALTERADAS',
        dados: {
          inicioPrevistoEm: inicio?.toISOString() ?? null,
          fimPrevistoEm: fim?.toISOString() ?? null
        }
      });
      return tx.projetoItem.findUnique({
        where: { id: current.id },
        include: { responsavel: true }
      });
    });
    return this.itemElement(
      updated as CronogramaItem,
      [],
      ProjetoCronogramaAgrupamento.NENHUM
    );
  }

  private async assertEndpoints(
    tx: Prisma.TransactionClient,
    contexto: ProjetoCronogramaContexto,
    input: {
      projetoId: string;
      bloqueadorId: string;
      bloqueadoId: string;
    },
    escopo: ProjetoRecursoEscopoHierarquico
  ): Promise<void> {
    const itens = await tx.projetoItem.findMany({
      where: {
        id: { in: [input.bloqueadorId, input.bloqueadoId] },
        projetoId: input.projetoId,
        empresaId: contexto.empresaId,
        ...this.recursoHierarquia.filtroProjetoItem(escopo)
      }
    });
    if (itens.length !== 2) {
      throw new BadRequestException(
        'As dependencias devem relacionar itens do mesmo projeto.'
      );
    }
    if (itens.some((item) => item.arquivadoEm)) {
      throw new BadRequestException(
        'Nao e permitido relacionar itens arquivados.'
      );
    }
  }

  private async assertNoCycle(
    tx: Prisma.TransactionClient,
    projetoId: string,
    bloqueadorId: string,
    bloqueadoId: string,
    ignoreId?: string
  ): Promise<void> {
    const dependencies = await tx.projetoItemDependencia.findMany({
      where: {
        projetoId,
        arquivadoEm: null,
        ...(ignoreId ? { id: { not: ignoreId } } : {})
      },
      select: { bloqueadorId: true, bloqueadoId: true }
    });
    assertProjetoDependenciaSemCiclo(
      dependencies,
      bloqueadorId,
      bloqueadoId
    );
  }

  private itemElement(
    item: CronogramaItem,
    incoming: Array<{ bloqueador: CronogramaItem }>,
    grouping: ProjetoCronogramaAgrupamento
  ): ProjetoCronogramaElementoType {
    const incomplete = incoming.filter(
      (entry) => !this.isDone(entry.bloqueador.status)
    );
    const conflict = incoming.some(
      (entry) =>
        entry.bloqueador.fimPrevistoEm &&
        item.inicioPrevistoEm &&
        entry.bloqueador.fimPrevistoEm.getTime() >
          item.inicioPrevistoEm.getTime()
    );
    const semPeriodo = !item.inicioPrevistoEm || !item.fimPrevistoEm;
    return {
      id: item.id,
      tipo: ProjetoCronogramaElementoTipo.ITEM,
      titulo: item.titulo,
      chave: item.chave,
      status: item.status,
      grupo: this.groupLabel(
        grouping,
        item.tipo,
        item.status,
        item.responsavel
      ),
      inicioEm: item.inicioPrevistoEm,
      fimEm: item.fimPrevistoEm,
      versao: item.versao,
      progressoPercentual: this.isDone(item.status) ? 100 : 0,
      semPeriodo,
      bloqueado: incomplete.length > 0,
      riscoAtraso:
        conflict ||
        this.isPast(item.fimPrevistoEm, item.status, [
          ProjetoItemStatus.CONCLUIDO,
          ProjetoItemStatus.CANCELADO
        ]),
      arquivado: !!item.arquivadoEm,
      itemIds: [item.id]
    };
  }

  private inconsistencies(
    elements: ProjetoCronogramaElementoType[],
    dependencies: ProjetoItemDependenciaType[]
  ): ProjetoCronogramaInconsistenciaType[] {
    const result: ProjetoCronogramaInconsistenciaType[] = [];
    const byId = new Map(elements.map((item) => [item.id, item]));
    for (const element of elements) {
      if (element.semPeriodo) {
        result.push({
          codigo: 'ITEM_SEM_PERIODO',
          severidade: ProjetoCronogramaSeveridade.AVISO,
          mensagem: `${element.chave ?? element.titulo} nao possui periodo completo.`,
          elementoIds: [element.id]
        });
      }
    }
    for (const dependency of dependencies) {
      if (dependency.arquivadoEm) {
        result.push({
          codigo: 'DEPENDENCIA_ARQUIVADA',
          severidade: ProjetoCronogramaSeveridade.AVISO,
          mensagem: `${dependency.bloqueador.chave} → ${dependency.bloqueado.chave} esta arquivada e nao interfere no cronograma.`,
          elementoIds: [dependency.bloqueador.id, dependency.bloqueado.id]
        });
        continue;
      }
      const blocker = byId.get(dependency.bloqueador.id);
      const blocked = byId.get(dependency.bloqueado.id);
      if (blocker?.arquivado || blocked?.arquivado) {
        result.push({
          codigo: 'DEPENDENCIA_COM_ITEM_ARQUIVADO',
          severidade: ProjetoCronogramaSeveridade.CRITICO,
          mensagem: 'Uma dependencia ativa referencia item arquivado.',
          elementoIds: [dependency.bloqueador.id, dependency.bloqueado.id]
        });
      }
      if (
        blocker?.fimEm &&
        blocked?.inicioEm &&
        blocker.fimEm.getTime() > blocked.inicioEm.getTime()
      ) {
        result.push({
          codigo: 'CONFLITO_DE_DATAS',
          severidade: ProjetoCronogramaSeveridade.CRITICO,
          mensagem: `${dependency.bloqueado.chave} inicia antes do termino de ${dependency.bloqueador.chave}.`,
          elementoIds: [dependency.bloqueador.id, dependency.bloqueado.id]
        });
      }
    }
    return result;
  }

  private progress(items: Array<{ status: string; estimativaMinutos: number | null }>): number {
    if (!items.length) return 0;
    const hasEstimate = items.some(
      (item) => (item.estimativaMinutos ?? 0) > 0
    );
    if (!hasEstimate) {
      return Math.round(
        (items.filter((item) => this.isDone(item.status)).length / items.length) *
          100
      );
    }
    const total = items.reduce(
      (sum, item) => sum + Math.max(item.estimativaMinutos ?? 0, 0),
      0
    );
    if (!total) return 0;
    const done = items.reduce(
      (sum, item) =>
        sum +
        (this.isDone(item.status)
          ? Math.max(item.estimativaMinutos ?? 0, 0)
          : 0),
      0
    );
    return Math.round((done / total) * 100);
  }

  private groupLabel(
    grouping: ProjetoCronogramaAgrupamento | undefined,
    type: string,
    status: string,
    responsible?: { nome?: string | null; login?: string | null; email: string } | null
  ): string {
    switch (grouping) {
      case ProjetoCronogramaAgrupamento.TIPO:
        return type;
      case ProjetoCronogramaAgrupamento.STATUS:
        return status;
      case ProjetoCronogramaAgrupamento.RESPONSAVEL:
        return (
          responsible?.nome ||
          responsible?.login ||
          responsible?.email ||
          'Nao atribuido'
        );
      default:
        return 'Cronograma';
    }
  }

  private overlaps(
    start: Date | null | undefined,
    end: Date | null | undefined,
    filterStart: Date | null,
    filterEnd: Date | null
  ): boolean {
    if (!start || !end) return true;
    if (filterStart && end.getTime() < filterStart.getTime()) return false;
    if (filterEnd && start.getTime() > filterEnd.getTime()) return false;
    return true;
  }

  private isPast(
    date: Date | null | undefined,
    status: string,
    terminalStatuses: string[]
  ): boolean {
    if (!date || terminalStatuses.includes(status)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  }

  private isDone(status: string): boolean {
    return (
      status === ProjetoItemStatus.CONCLUIDO ||
      status === ProjetoItemStatus.CANCELADO
    );
  }

  private async dependenciaReference(id: string) {
    const item = await this.prisma.projetoItemDependencia.findUnique({
      where: { id },
      select: {
        id: true,
        projetoId: true,
        bloqueadorId: true,
        bloqueadoId: true,
        versao: true,
        arquivadoEm: true
      }
    });
    if (!item) throw new NotFoundException('Dependencia nao encontrada.');
    return item;
  }

  private toDependencia(item: any): ProjetoItemDependenciaType {
    return {
      id: item.id,
      projetoId: item.projetoId,
      bloqueador: this.toReference(item.bloqueador),
      bloqueado: this.toReference(item.bloqueado),
      versao: item.versao,
      arquivadoEm: item.arquivadoEm,
      criadoEm: item.criadoEm,
      atualizadoEm: item.atualizadoEm
    };
  }

  private toReference(item: any) {
    return {
      id: item.id,
      chave: item.chave,
      titulo: item.titulo,
      status: item.status,
      inicioPrevistoEm: item.inicioPrevistoEm,
      fimPrevistoEm: item.fimPrevistoEm,
      arquivadoEm: item.arquivadoEm
    };
  }

  private throwConflict(): never {
    throw new ConflictException(
      'O registro foi alterado por outro usuario. Atualize o cronograma e tente novamente.'
    );
  }
}
