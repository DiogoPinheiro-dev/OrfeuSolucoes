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
  ProjetoBacklogProjetoType
} from './dto/projeto-backlog.type';
import { ProjetoUsuarioType } from './dto/projeto.type';
import { toProjetoUsuarioType } from './mappers/projeto.mapper';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoItemAuthorizationService } from './projeto-item-authorization.service';
import { ProjetoPapel, ProjetoUsuarioRecord } from './types/projeto.types';

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
    const usuarios = [
      contexto.projeto.responsavel,
      ...contexto.projeto.membros
        .filter((membro) => membro.papel === ProjetoPapel.MEMBRO)
        .map((membro) => membro.usuario)
    ];
    const unique = new Map<string, ProjetoUsuarioRecord>();

    for (const usuario of usuarios) unique.set(usuario.id, usuario);

    return [...unique.values()]
      .sort((a, b) =>
        (a.nome ?? a.login ?? a.email).localeCompare(
          b.nome ?? b.login ?? b.email
        )
      )
      .map(toProjetoUsuarioType);
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
}
