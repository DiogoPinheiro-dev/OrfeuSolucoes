import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoRecursoAuthorizationService } from './projeto-recurso-authorization.service';

export type ProjetoRecursoEscopoHierarquico = {
  restrito: boolean;
  recursoIds: string[];
  usuarioIds: string[];
};

@Injectable()
export class ProjetoRecursoHierarquiaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoRecursoAuthorizationService
  ) {}

  async escopo(
    user: JwtPayload,
    empresaId: number,
    projetoId?: string
  ): Promise<ProjetoRecursoEscopoHierarquico> {
    if (this.authorization.isSystemAdmin(user)) {
      return { restrito: false, recursoIds: [], usuarioIds: [] };
    }

    const recursoAtual = await this.prisma.recurso.findUnique({
      where: { empresaId_usuarioId: { empresaId, usuarioId: user.sub } },
      include: { capacitacao: true }
    });
    if (!recursoAtual) {
      return { restrito: false, recursoIds: [], usuarioIds: [] };
    }

    const recursoIds = new Set([recursoAtual.id]);
    const usuarioIds = new Set([recursoAtual.usuarioId]);
    const nivelAtual = recursoAtual.capacitacao?.ativo ? recursoAtual.capacitacao.nivelHierarquico : null;
    if (!recursoAtual.ativo || !nivelAtual) {
      return {
        restrito: true,
        recursoIds: [...recursoIds],
        usuarioIds: [...usuarioIds]
      };
    }

    const equipes = await this.prisma.equipeRecurso.findMany({
      where: {
        empresaId,
        recursoId: recursoAtual.id,
        equipe: {
          ativo: true,
          ...(projetoId
            ? { projetos: { some: { projetoId, ativo: true } } }
            : {})
        }
      },
      select: { equipeId: true }
    });
    const equipeIds = [...new Set(equipes.map((vinculo) => vinculo.equipeId))];
    if (!equipeIds.length) {
      return {
        restrito: true,
        recursoIds: [...recursoIds],
        usuarioIds: [...usuarioIds]
      };
    }

    const subordinados = await this.prisma.equipeRecurso.findMany({
      where: {
        empresaId,
        equipeId: { in: equipeIds },
        recurso: {
          ativo: true,
          capacitacao: { ativo: true, nivelHierarquico: { lt: nivelAtual } },
          ...(projetoId
            ? { projetos: { some: { projetoId, ativo: true } } }
            : {})
        }
      },
      select: { recursoId: true, recurso: { select: { usuarioId: true } } }
    });
    subordinados.forEach((vinculo) => {
      recursoIds.add(vinculo.recursoId);
      usuarioIds.add(vinculo.recurso.usuarioId);
    });
    return {
      restrito: true,
      recursoIds: [...recursoIds],
      usuarioIds: [...usuarioIds]
    };
  }

  filtroRecurso(escopo: ProjetoRecursoEscopoHierarquico): Prisma.RecursoWhereInput {
    return escopo.restrito ? { id: { in: escopo.recursoIds } } : {};
  }

  filtroProjetoRecurso(escopo: ProjetoRecursoEscopoHierarquico): Prisma.ProjetoRecursoWhereInput {
    return escopo.restrito ? { recursoId: { in: escopo.recursoIds } } : {};
  }

  filtroProjetoItem(escopo: ProjetoRecursoEscopoHierarquico): Prisma.ProjetoItemWhereInput {
    return escopo.restrito
      ? { responsavelId: { in: escopo.usuarioIds } }
      : {};
  }

  assertPodeAcessarRecurso(escopo: ProjetoRecursoEscopoHierarquico, recursoId: string): void {
    if (escopo.restrito && !escopo.recursoIds.includes(recursoId)) {
      throw new ForbiddenException('Você não possui acesso às tarefas deste recurso.');
    }
  }

  assertPodeGerenciarRecursos(escopo: ProjetoRecursoEscopoHierarquico, recursoIds: string[]): void {
    if (escopo.restrito && recursoIds.some((recursoId) => !escopo.recursoIds.includes(recursoId))) {
      throw new ForbiddenException('Você não possui acesso a todos os recursos desta tarefa.');
    }
  }

  assertPodeAcessarResponsavel(
    escopo: ProjetoRecursoEscopoHierarquico,
    responsavelId?: string | null
  ): void {
    if (
      escopo.restrito &&
      (!responsavelId || !escopo.usuarioIds.includes(responsavelId))
    ) {
      throw new ForbiddenException(
        'Você não possui acesso aos itens deste responsável.'
      );
    }
  }

  assertVisaoCompleta(
    escopo: ProjetoRecursoEscopoHierarquico,
    operacao: string
  ): void {
    if (escopo.restrito) {
      throw new ForbiddenException(
        `Somente usuários com visão completa do projeto podem ${operacao}.`
      );
    }
  }
}
