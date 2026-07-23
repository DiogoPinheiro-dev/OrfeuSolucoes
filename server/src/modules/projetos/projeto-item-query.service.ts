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
import { ProjetoItemAuthorizationService } from './projeto-item-authorization.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoItemRecord } from './types/projeto-item.types';

export const PROJETO_ITEM_INCLUDE = {
  responsavel: { include: { grupo: true } },
  autor: { include: { grupo: true } },
  arquivadoPor: { include: { grupo: true } }
};

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
    const termo = filtro.termo?.trim();
    const where: Prisma.ProjetoItemWhereInput = {
      empresaId: contexto.empresaId,
      projetoId: contexto.projeto.id,
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
    const [total, records, permissoes] = await Promise.all([
      this.prisma.projetoItem.count({ where }),
      this.prisma.projetoItem.findMany({
        where,
        include: PROJETO_ITEM_INCLUDE,
        orderBy: [
          { ordemBacklog: 'asc' },
          { numero: 'asc' },
          { id: 'asc' }
        ],
        skip: (pagina - 1) * limite,
        take: limite
      }),
      this.authorization.effectivePermissions(user, contexto)
    ]);

    return {
      items: (records as unknown as ProjetoItemRecord[]).map((item) =>
        toProjetoItemType(item, permissoes)
      ),
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
    const [item, permissoes] = await Promise.all([
      this.prisma.projetoItem.findFirst({
        where: {
          id,
          empresaId: contexto.empresaId,
          projetoId: contexto.projeto.id
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
}
