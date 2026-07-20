import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoFiltroInput } from './dto/projeto-filtro.input';
import { ProjetoPageType, ProjetoType, ProjetoUsuarioType } from './dto/projeto.type';
import { resolveMeuPapel, toProjetoType, toProjetoUsuarioType } from './mappers/projeto.mapper';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoRecord, ProjetoUsuarioRecord } from './types/projeto.types';

const PROJETO_INCLUDE = {
  responsavel: { include: { grupo: true } },
  criadoPor: { include: { grupo: true } },
  arquivadoPor: { include: { grupo: true } },
  membros: {
    include: { usuario: { include: { grupo: true } } },
    orderBy: { incluidoEm: 'asc' as const }
  }
};

@Injectable()
export class ProjetoQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoAuthorizationService
  ) {}

  async findPage(user: JwtPayload, filtro: ProjetoFiltroInput = {}): Promise<ProjetoPageType> {
    const empresaId = await this.authorization.assertReadAccess(user);
    const pagina = Math.max(1, filtro.pagina ?? 1);
    const limite = Math.min(100, Math.max(1, filtro.limite ?? 20));
    const termo = filtro.termo?.trim();
    const where: Prisma.ProjetoWhereInput = {
      empresaId,
      ...this.authorization.visibilityWhere(user),
      ...(!filtro.incluirArquivados ? { arquivadoEm: null } : {}),
      ...(filtro.metodologia ? { metodologia: filtro.metodologia } : {}),
      ...(filtro.situacao ? { situacao: filtro.situacao } : {}),
      ...(filtro.saude ? { saude: filtro.saude } : {}),
      ...(termo ? {
        AND: [{
          OR: [
            { chave: { contains: termo } },
            { nome: { contains: termo } },
            { objetivo: { contains: termo } },
            { descricao: { contains: termo } }
          ]
        }]
      } : {})
    };
    const [total, records, functional] = await Promise.all([
      this.prisma.projeto.count({ where }),
      this.prisma.projeto.findMany({
        where,
        include: PROJETO_INCLUDE,
        orderBy: { atualizadoEm: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite
      }),
      this.authorization.resolveFunctionalPermissions(user)
    ]);
    const items = (records as unknown as ProjetoRecord[]).map((projeto) => {
      const meuPapel = resolveMeuPapel(projeto, user.sub);
      return toProjetoType(projeto, meuPapel, this.authorization.effectivePermissions(user, meuPapel, functional));
    });

    return {
      items,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite)
    };
  }

  async findOne(id: string, user: JwtPayload): Promise<ProjetoType> {
    const empresaId = await this.authorization.assertReadAccess(user);
    const projeto = await this.prisma.projeto.findFirst({
      where: { id, empresaId },
      include: PROJETO_INCLUDE
    }) as unknown as ProjetoRecord | null;

    this.authorization.assertVisibleProject(projeto, user, empresaId);
    const meuPapel = resolveMeuPapel(projeto, user.sub);
    const functional = await this.authorization.resolveFunctionalPermissions(user);
    return toProjetoType(projeto, meuPapel, this.authorization.effectivePermissions(user, meuPapel, functional));
  }

  async participantesDisponiveis(user: JwtPayload): Promise<ProjetoUsuarioType[]> {
    const empresaId = await this.authorization.assertReadAccess(user);
    const vinculos = await this.prisma.empresaUsuario.findMany({
      where: { empresaId },
      include: {
        usuario: {
          include: {
            grupo: {
              include: {
                solucoes: { include: { solucao: true } },
                funcionalidades: { include: { funcionalidade: { include: { solucao: true } } } }
              }
            }
          }
        }
      },
      orderBy: { id: 'asc' }
    }) as unknown as Array<{ usuario: ProjetoUsuarioRecord & { grupo?: Parameters<ProjetoAuthorizationService['groupHasProjectAccess']>[0] } }>;

    return vinculos
      .map((item) => item.usuario)
      .filter((usuario) => this.authorization.isSystemAdmin(usuario) || this.authorization.groupHasProjectAccess(usuario.grupo))
      .sort((a, b) => (a.nome ?? a.login ?? a.email).localeCompare(b.nome ?? b.login ?? b.email))
      .map(toProjetoUsuarioType);
  }
}
