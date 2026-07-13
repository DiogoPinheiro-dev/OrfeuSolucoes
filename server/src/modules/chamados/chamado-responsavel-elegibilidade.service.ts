import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { usuarioResumoSelect } from './constants/chamado-prisma.constants';
import { ChamadoResponsavelUsuarioOptionType } from './dto/chamado-responsavel.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { GrupoResumoRecord, UsuarioResumoRecord } from './types/chamado-record.types';

@Injectable()
export class ChamadoResponsavelElegibilidadeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ChamadoAuthorizationService
  ) {}

  async ensureUsuarioElegivelResponsavel(usuarioId: string, empresaId: number): Promise<void> {
    const usuarios = await this.findUsuariosElegiveisResponsaveis(empresaId);

    if (!usuarios.some((usuario) => usuario.id === usuarioId)) {
      throw new BadRequestException('Usuario selecionado nao pertence a empresa ativa ou nao possui acesso ao Controle de Chamados.');
    }
  }

  async ensureGrupoElegivelResponsavel(grupoId: number, empresaId: number): Promise<void> {
    const grupos = await this.findGruposElegiveisResponsaveis(empresaId);

    if (!grupos.some((grupo) => grupo.id === grupoId)) {
      throw new BadRequestException('Grupo selecionado nao possui usuarios vinculados a empresa ativa ou nao possui acesso ao Controle de Chamados.');
    }
  }

  async findUsuariosElegiveisAcompanhantes(
    empresaId: number,
    contexto: { solicitanteId?: string | null; responsavelId?: string | null } = {}
  ): Promise<ChamadoResponsavelUsuarioOptionType[]> {
    const blockedIds = new Set([contexto.solicitanteId ?? null, contexto.responsavelId ?? null].filter((id): id is string => !!id));

    return (await this.findUsuariosElegiveisResponsaveis(empresaId))
      .filter((usuario) => !blockedIds.has(usuario.id))
      .map((usuario) => ({
        id: usuario.id,
        nome: usuario.nome ?? null,
        login: usuario.login ?? null,
        email: usuario.email,
        grupoNome: usuario.grupoNome ?? null
      }));
  }

  async resolveAcompanhantesPayload(
    empresaId: number,
    usuarioIds: string[] | null | undefined,
    contexto: { solicitanteId?: string | null; responsavelId?: string | null }
  ): Promise<ChamadoResponsavelUsuarioOptionType[]> {
    const normalizedIds = [...new Set((usuarioIds ?? []).map((id) => id?.trim()).filter((id): id is string => !!id))];

    if (!normalizedIds.length) {
      return [];
    }

    const blockedIds = new Set([contexto.solicitanteId ?? null, contexto.responsavelId ?? null].filter((id): id is string => !!id));
    const blockedSelected = normalizedIds.find((id) => blockedIds.has(id));

    if (blockedSelected && blockedSelected === contexto.solicitanteId) {
      throw new BadRequestException('O solicitante do chamado nao pode ser acompanhante.');
    }

    if (blockedSelected && blockedSelected === contexto.responsavelId) {
      throw new BadRequestException('O responsavel do chamado nao pode ser acompanhante.');
    }

    const elegiveis = await this.findUsuariosElegiveisAcompanhantes(empresaId, contexto);
    const elegiveisById = new Map(elegiveis.map((usuario) => [usuario.id, usuario]));
    const missing = normalizedIds.filter((id) => !elegiveisById.has(id));

    if (missing.length) {
      throw new BadRequestException('Um ou mais acompanhantes selecionados nao pertencem a empresa ativa ou nao possuem acesso ao Controle de Chamados.');
    }

    return normalizedIds.map((id) => elegiveisById.get(id)).filter((usuario): usuario is ChamadoResponsavelUsuarioOptionType => !!usuario);
  }

  async findUsuariosElegiveisResponsaveis(empresaId: number): Promise<Array<UsuarioResumoRecord & { grupoNome?: string | null }>> {
    const vinculos = (await (this.prisma as never as { empresaUsuario: { findMany: Function } }).empresaUsuario.findMany({
      where: { empresaId },
      include: {
        usuario: {
          select: {
            ...usuarioResumoSelect,
            grupo: {
              select: {
                nome: true,
                acessoEcommerce: true,
                acessoProjetos: true,
                acessoHoras: true,
                acessoConfigurador: true,
                solucoes: { include: { solucao: { select: { slug: true } } } },
                funcionalidades: { include: { funcionalidade: { include: { solucao: { select: { slug: true } } } } } }
              }
            }
          }
        }
      }
    })) as Array<{ usuario?: (UsuarioResumoRecord & { grupo?: { nome?: string | null; acessoEcommerce?: boolean | null; acessoProjetos?: boolean | null; acessoHoras?: boolean | null; acessoConfigurador?: boolean | null; solucoes?: Array<{ solucao?: { slug: string } | null }>; funcionalidades?: Array<{ funcionalidade?: { solucao?: { slug: string } | null } | null }> } | null }) | null }>;

    return vinculos
      .map((vinculo) => vinculo.usuario)
      .filter((usuario): usuario is UsuarioResumoRecord & { grupo?: { nome?: string | null; acessoEcommerce?: boolean | null; acessoProjetos?: boolean | null; acessoHoras?: boolean | null; acessoConfigurador?: boolean | null; solucoes?: Array<{ solucao?: { slug: string } | null }>; funcionalidades?: Array<{ funcionalidade?: { solucao?: { slug: string } | null } | null }> } | null } => !!usuario)
      .filter((usuario) => this.authorization.grupoPossuiAcessoControleChamados(usuario.grupo))
      .sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email))
      .map((usuario) => ({
        id: usuario.id,
        nome: usuario.nome ?? null,
        login: usuario.login ?? null,
        email: usuario.email,
        grupoNome: usuario.grupo?.nome ?? null
      }));
  }

  async findGruposElegiveisResponsaveis(empresaId: number): Promise<Array<GrupoResumoRecord & { usuariosCount: number }>> {
    const grupos = await this.prisma.grupoUsuario.findMany({
      where: {
        usuarios: {
          some: {
            empresas: { some: { empresaId } }
          }
        }
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        acessoEcommerce: true,
        acessoProjetos: true,
        acessoHoras: true,
        acessoConfigurador: true,
        solucoes: { include: { solucao: { select: { slug: true } } } },
        funcionalidades: { include: { funcionalidade: { include: { solucao: { select: { slug: true } } } } } },
        usuarios: {
          where: { empresas: { some: { empresaId } } },
          select: { id: true }
        }
      },
      orderBy: { nome: 'asc' }
    }) as Array<GrupoResumoRecord & { acessoEcommerce?: boolean | null; acessoProjetos?: boolean | null; acessoHoras?: boolean | null; acessoConfigurador?: boolean | null; solucoes?: Array<{ solucao?: { slug: string } | null }>; funcionalidades?: Array<{ funcionalidade?: { solucao?: { slug: string } | null } | null }>; usuarios?: Array<{ id: string }> }>;

    return grupos
      .filter((grupo) => this.authorization.grupoPossuiAcessoControleChamados(grupo))
      .filter((grupo) => (grupo.usuarios ?? []).length > 0)
      .map((grupo) => ({
        id: grupo.id,
        nome: grupo.nome,
        descricao: grupo.descricao ?? null,
        usuariosCount: grupo.usuarios?.length ?? 0
      }));
  }

  async ensureGrupoResponsavel(grupoId: number): Promise<GrupoResumoRecord> {
    const grupo = await this.prisma.grupoUsuario.findFirst({
      where: { id: grupoId },
      select: { id: true, nome: true, descricao: true }
    }) as GrupoResumoRecord | null;

    if (!grupo) {
      throw new BadRequestException('Grupo responsavel nao encontrado.');
    }

    return grupo;
  }

  async ensureUserBelongsToCompany(usuarioId: string, empresaId: number): Promise<UsuarioResumoRecord> {
    const vinculo = (await (this.prisma as never as { empresaUsuario: { findFirst: Function } }).empresaUsuario.findFirst({
      where: {
        empresaId,
        usuarioId
      },
      include: {
        usuario: {
          select: usuarioResumoSelect
        }
      }
    })) as { usuario?: UsuarioResumoRecord | null } | null;

    if (!vinculo?.usuario) {
      throw new BadRequestException('Responsavel nao pertence a empresa selecionada.');
    }

    return vinculo.usuario;
  }
}
