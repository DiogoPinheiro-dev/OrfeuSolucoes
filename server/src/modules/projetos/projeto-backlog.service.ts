import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import {
  MoverProjetoItemBacklogInput,
  ProjetoBacklogDirecao
} from './dto/mover-projeto-item-backlog.input';
import {
  ProjetoBacklogMovimentoType,
  ProjetoBacklogPaiCandidatoType,
  ProjetoBacklogProjetoType
} from './dto/projeto-backlog.type';
import { ProjetoUsuarioType } from './dto/projeto.type';
import { toProjetoUsuarioType } from './mappers/projeto.mapper';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoItemAuthorizationService } from './projeto-item-authorization.service';
import { ProjetoSituacao } from './types/projeto.types';

type ProjetoItemHierarquiaRecord = {
  id: string;
  chave: string;
  titulo: string;
  paiId: string | null;
  ordemBacklog: number;
  numero: number;
  arquivadoEm: Date | null;
};

@Injectable()
export class ProjetoBacklogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAuthorization: ProjetoAuthorizationService,
    private readonly itemAuthorization: ProjetoItemAuthorizationService,
    private readonly auditoriaService: ProjetoAuditoriaService
  ) {}

  async projetos(
    user: JwtPayload,
    incluirArquivados = false
  ): Promise<ProjetoBacklogProjetoType[]> {
    const empresaId = await this.projectAuthorization.assertFeatureActionAccess(
      user,
      ProjetoFuncionalidade.BACKLOG,
      ProjetoAcao.VISUALIZAR
    );
    return this.prisma.projeto.findMany({
      where: {
        empresaId,
        situacao: ProjetoSituacao.RASCUNHO,
        ...this.projectAuthorization.visibilityWhere(user),
        ...(!incluirArquivados ? { arquivadoEm: null } : {})
      },
      select: {
        id: true,
        chave: true,
        nome: true,
        arquivadoEm: true
      },
      orderBy: [{ arquivadoEm: 'asc' }, { nome: 'asc' }]
    });
  }

  async responsaveis(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoUsuarioType[]> {
    const contexto = await this.itemAuthorization.assertReadContext(
      projetoId,
      user
    );
    const escopo = await this.itemAuthorization.escopoHierarquico(
      user,
      contexto
    );
    const vinculos = await this.prisma.projetoRecurso.findMany({
      where: {
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        ativo: true,
        cadastro: { ativo: true },
        ...this.itemAuthorization.filtroProjetoRecurso(escopo)
      },
      include: { cadastro: { include: { usuario: true } } }
    });
    const unique = new Map(vinculos.map((vinculo) => [
      vinculo.cadastro.usuario.id,
      vinculo.cadastro.usuario
    ]));

    return [...unique.values()]
      .sort((a, b) =>
        (a.nome ?? a.login ?? a.email).localeCompare(
          b.nome ?? b.login ?? b.email
        )
      )
      .map(toProjetoUsuarioType);
  }

  async candidatosPai(
    projetoId: string,
    user: JwtPayload,
    itemId?: string
  ): Promise<ProjetoBacklogPaiCandidatoType[]> {
    const contexto = await this.itemAuthorization.assertReadContext(
      projetoId,
      user
    );
    const escopo = await this.itemAuthorization.escopoHierarquico(
      user,
      contexto
    );
    const itens = await this.prisma.projetoItem.findMany({
      where: {
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        ...this.itemAuthorization.filtroVisibilidade(escopo)
      },
      select: {
        id: true,
        chave: true,
        titulo: true,
        paiId: true,
        ordemBacklog: true,
        numero: true,
        arquivadoEm: true
      },
      orderBy: [
        { ordemBacklog: 'asc' },
        { numero: 'asc' },
        { id: 'asc' }
      ]
    }) as ProjetoItemHierarquiaRecord[];

    if (itemId && !itens.some((item) => item.id === itemId)) {
      throw new NotFoundException('Item de projeto nao encontrado.');
    }

    const excluidos = this.descendentesDoItem(itens, itemId);
    const itensPorId = new Map(itens.map((item) => [item.id, item]));
    const trilhas = new Map<string, string[]>();

    return itens
      .filter((item) => !item.arquivadoEm && !excluidos.has(item.id))
      .map((item) => {
        const partes = this.resolverTrilha(item, itensPorId, trilhas, new Set());
        return {
          id: item.id,
          chave: item.chave,
          titulo: item.titulo,
          paiId: item.paiId,
          nivel: partes.length - 1,
          trilha: partes.join(' › ')
        };
      });
  }

  async mover(
    input: MoverProjetoItemBacklogInput,
    user: JwtPayload
  ): Promise<ProjetoBacklogMovimentoType> {
    const reference = await this.prisma.projetoItem.findUnique({
      where: { id: input.itemId },
      select: {
        id: true,
        projetoId: true,
        arquivadoEm: true
      }
    });

    if (!reference) {
      throw new NotFoundException('Item de projeto nao encontrado.');
    }

    if (reference.arquivadoEm) {
      throw new BadRequestException(
        'Itens arquivados nao podem ser priorizados.'
      );
    }

    const contexto = await this.itemAuthorization.assertPrioritizeContext(
      reference.projetoId,
      user
    );
    const backlogVersao = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.projeto.updateMany({
        where: {
          id: contexto.projeto.id,
          backlogVersao: input.backlogVersao,
          arquivadoEm: null
        },
        data: {
          backlogVersao: { increment: 1 }
        }
      });

      if (claimed.count !== 1) {
        throw new ConflictException(
          'O backlog foi priorizado por outra pessoa. Atualize a lista e tente novamente.'
        );
      }

      const items = await tx.projetoItem.findMany({
        where: {
          projetoId: contexto.projeto.id,
          arquivadoEm: null
        },
        select: {
          id: true,
          ordemBacklog: true,
          numero: true
        },
        orderBy: [
          { ordemBacklog: 'asc' },
          { numero: 'asc' },
          { id: 'asc' }
        ]
      });
      const currentIndex = items.findIndex((item) => item.id === reference.id);

      if (currentIndex < 0) {
        throw new NotFoundException('Item de projeto nao encontrado.');
      }

      const targetIndex = this.resolveTargetIndex(
        currentIndex,
        items.length,
        input.direcao
      );
      const ordered = [...items];
      const [moved] = ordered.splice(currentIndex, 1);

      if (!moved) {
        throw new NotFoundException('Item de projeto nao encontrado.');
      }

      ordered.splice(targetIndex, 0, moved);

      await Promise.all(
        ordered.map((item, index) =>
          tx.projetoItem.updateMany({
            where: {
              id: item.id,
              projetoId: contexto.projeto.id,
              arquivadoEm: null
            },
            data: {
              ordemBacklog: index + 1
            }
          })
        )
      );
      await this.auditoriaService.registrar(tx, {
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        usuarioId: user.sub,
        entidade: 'ITEM',
        entidadeId: reference.id,
        evento: 'PRIORIZADO',
        dados: {
          de: currentIndex + 1,
          para: targetIndex + 1,
          direcao: input.direcao,
          backlogVersaoAnterior: input.backlogVersao
        }
      });

      return input.backlogVersao + 1;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return {
      itemId: reference.id,
      backlogVersao
    };
  }

  private resolveTargetIndex(
    currentIndex: number,
    total: number,
    direction: ProjetoBacklogDirecao
  ): number {
    if (direction === ProjetoBacklogDirecao.TOPO) return 0;
    if (direction === ProjetoBacklogDirecao.FUNDO) return total - 1;
    if (direction === ProjetoBacklogDirecao.SUBIR) {
      return Math.max(0, currentIndex - 1);
    }
    return Math.min(total - 1, currentIndex + 1);
  }

  private descendentesDoItem(
    itens: ProjetoItemHierarquiaRecord[],
    itemId?: string
  ): Set<string> {
    if (!itemId) return new Set();

    const filhosPorPai = new Map<string, string[]>();
    for (const item of itens) {
      if (!item.paiId) continue;
      filhosPorPai.set(item.paiId, [
        ...(filhosPorPai.get(item.paiId) ?? []),
        item.id
      ]);
    }

    const excluidos = new Set<string>([itemId]);
    const pendentes = [...(filhosPorPai.get(itemId) ?? [])];
    while (pendentes.length) {
      const atual = pendentes.shift();
      if (!atual || excluidos.has(atual)) continue;
      excluidos.add(atual);
      pendentes.push(...(filhosPorPai.get(atual) ?? []));
    }
    return excluidos;
  }

  private resolverTrilha(
    item: ProjetoItemHierarquiaRecord,
    itensPorId: Map<string, ProjetoItemHierarquiaRecord>,
    trilhas: Map<string, string[]>,
    visitados: Set<string>
  ): string[] {
    const existente = trilhas.get(item.id);
    if (existente) return existente;
    if (visitados.has(item.id)) {
      throw new BadRequestException(
        'A hierarquia existente contem um ciclo e precisa ser corrigida.'
      );
    }

    visitados.add(item.id);
    const pai = item.paiId ? itensPorId.get(item.paiId) : null;
    if (item.paiId && !pai) {
      throw new BadRequestException(
        'A hierarquia existente referencia um item pai invalido.'
      );
    }
    const partesPai = pai
      ? this.resolverTrilha(pai, itensPorId, trilhas, visitados)
      : [];
    const partes = [...partesPai, `${item.chave} — ${item.titulo}`];
    visitados.delete(item.id);
    trilhas.set(item.id, partes);
    return partes;
  }
}
