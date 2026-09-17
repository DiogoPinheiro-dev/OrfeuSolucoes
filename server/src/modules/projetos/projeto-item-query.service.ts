import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoItemFiltroInput } from './dto/projeto-item-filtro.input';
import { ProjetoItemHistoricoType } from './dto/projeto-item-historico.type';
import {
  ProjetoItemPageType,
  ProjetoItemType
} from './dto/projeto-item.type';
import { toProjetoItemType } from './mappers/projeto-item.mapper';
import { toProjetoUsuarioType } from './mappers/projeto.mapper';
import {
  contarGrupos,
  GrupoDoBacklog,
  ordenarPorAgrupamento,
  ProjetoBacklogAgrupamento
} from './policies/projeto-backlog-agrupamento.policy';
import { ProjetoItemAuthorizationService } from './projeto-item-authorization.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoItemRecord } from './types/projeto-item.types';

export const PROJETO_ITEM_INCLUDE = {
  responsavel: { include: { grupo: true } },
  autor: { include: { grupo: true } },
  arquivadoPor: { include: { grupo: true } }
};

const ORDEM_DO_BACKLOG: Prisma.ProjetoItemOrderByWithRelationInput[] = [
  { ordemBacklog: 'asc' },
  { numero: 'asc' },
  { id: 'asc' }
];

type PaginaDoBacklog = { total: number; records: unknown[]; grupos: GrupoDoBacklog[] };

@Injectable()
export class ProjetoItemQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoItemAuthorizationService,
    private readonly periodoService: ProjetoPeriodoService
  ) {}

  async findPage(
    user: JwtPayload,
    filtro: ProjetoItemFiltroInput
  ): Promise<ProjetoItemPageType> {
    const contexto = await this.authorization.assertReadContext(
      filtro.projetoId,
      user
    );
    const { pagina, limite } = this.periodoService.normalizePaginacao(
      filtro.pagina,
      filtro.limite
    );
    const escopo = await this.authorization.escopoHierarquico(user, contexto);
    const termo = filtro.termo?.trim();
    const where: Prisma.ProjetoItemWhereInput = {
      empresaId: contexto.empresaId,
      projetoId: contexto.projeto.id,
      ...this.authorization.filtroVisibilidade(escopo),
      ...(!filtro.incluirArquivados ? { arquivadoEm: null } : {}),
      ...(filtro.tipo ? { tipo: filtro.tipo } : {}),
      ...(filtro.status ? { status: filtro.status } : {}),
      ...(filtro.prioridade ? { prioridade: filtro.prioridade } : {}),
      ...(filtro.responsavelId
        ? { responsavelId: filtro.responsavelId }
        : {}),
      ...(termo
        ? {
            AND: [{
              OR: [
                { chave: { contains: termo } },
                { titulo: { contains: termo } },
                { descricao: { contains: termo } }
              ]
            }]
          }
        : {})
    };
    const [{ total, records, grupos }, permissoes] = await Promise.all([
      filtro.agruparPor
        ? this.findGroupedPage(where, pagina, limite, filtro.agruparPor)
        : this.findOrderedPage(where, pagina, limite),
      this.authorization.effectivePermissions(user, contexto)
    ]);

    return {
      items: (records as ProjetoItemRecord[]).map((item) =>
        toProjetoItemType(item, permissoes)
      ),
      grupos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
      backlogVersao: contexto.projeto.backlogVersao,
      permissoes
    };
  }

  async findOne(id: string, user: JwtPayload): Promise<ProjetoItemType> {
    const reference = await this.prisma.projetoItem.findUnique({
      where: { id },
      select: { projetoId: true }
    });

    if (!reference) {
      throw new NotFoundException('Item de projeto nao encontrado.');
    }

    const contexto = await this.authorization.assertReadContext(
      reference.projetoId,
      user
    );
    const escopo = await this.authorization.escopoHierarquico(user, contexto);
    const [item, permissoes] = await Promise.all([
      this.prisma.projetoItem.findFirst({
        where: {
          id,
          empresaId: contexto.empresaId,
          projetoId: contexto.projeto.id,
          ...this.authorization.filtroVisibilidade(escopo)
        },
        include: PROJETO_ITEM_INCLUDE
      }),
      this.authorization.effectivePermissions(user, contexto)
    ]);

    if (!item) {
      throw new NotFoundException('Item de projeto nao encontrado.');
    }

    return toProjetoItemType(
      item as unknown as ProjetoItemRecord,
      permissoes
    );
  }

  async findHistorico(
    id: string,
    user: JwtPayload
  ): Promise<ProjetoItemHistoricoType[]> {
    const reference = await this.prisma.projetoItem.findUnique({
      where: { id },
      select: { projetoId: true }
    });

    if (!reference) {
      throw new NotFoundException('Item de projeto nao encontrado.');
    }

    const contexto = await this.authorization.assertReadContext(
      reference.projetoId,
      user
    );
    const escopo = await this.authorization.escopoHierarquico(user, contexto);
    const itemVisivel = await this.prisma.projetoItem.findFirst({
      where: {
        id,
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        ...this.authorization.filtroVisibilidade(escopo)
      },
      select: { id: true }
    });

    if (!itemVisivel) {
      throw new NotFoundException('Item de projeto nao encontrado.');
    }
    const eventos = await this.prisma.projetoEvento.findMany({
      where: {
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        entidade: 'ITEM',
        entidadeId: id
      },
      include: {
        usuario: { include: { grupo: true } }
      },
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }]
    });

    return eventos.map((evento) => ({
      id: evento.id,
      evento: evento.evento,
      dados: evento.dados
        ? typeof evento.dados === 'string'
          ? evento.dados
          : JSON.stringify(evento.dados)
        : null,
      criadoEm: evento.criadoEm,
      usuario: evento.usuario
        ? toProjetoUsuarioType(evento.usuario as never)
        : null
    }));
  }

  private async findOrderedPage(
    where: Prisma.ProjetoItemWhereInput,
    pagina: number,
    limite: number
  ): Promise<PaginaDoBacklog> {
    const [total, records] = await Promise.all([
      this.prisma.projetoItem.count({ where }),
      this.prisma.projetoItem.findMany({
        where,
        include: PROJETO_ITEM_INCLUDE,
        orderBy: ORDEM_DO_BACKLOG,
        skip: (pagina - 1) * limite,
        take: limite
      })
    ]);

    return { total, records, grupos: [] };
  }

  /** Agrupa o backlog filtrado inteiro antes de paginar, para que cada página continue a sequência dos grupos. */
  private async findGroupedPage(
    where: Prisma.ProjetoItemWhereInput,
    pagina: number,
    limite: number,
    agrupamento: ProjetoBacklogAgrupamento
  ): Promise<PaginaDoBacklog> {
    const chaves = await this.prisma.projetoItem.findMany({
      where,
      select: { id: true, status: true, tipo: true, prioridade: true },
      orderBy: ORDEM_DO_BACKLOG
    });
    const ordenados = ordenarPorAgrupamento(chaves, agrupamento);
    const idsDaPagina = ordenados
      .slice((pagina - 1) * limite, pagina * limite)
      .map((item) => item.id);
    const records = idsDaPagina.length
      ? await this.prisma.projetoItem.findMany({
          where: { ...where, id: { in: idsDaPagina } },
          include: PROJETO_ITEM_INCLUDE
        })
      : [];
    const porId = new Map(records.map((record) => [record.id, record]));

    return {
      total: ordenados.length,
      records: idsDaPagina.map((id) => porId.get(id)).filter((record) => record !== undefined),
      grupos: contarGrupos(ordenados, agrupamento)
    };
  }
}
