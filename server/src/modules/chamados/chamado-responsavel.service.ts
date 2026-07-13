import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { FEATURES } from './constants/chamado.constants';
import { usuarioResumoSelect } from './constants/chamado-prisma.constants';
import { ChamadoResponsavelOptionsType, ChamadoResponsavelType, ChamadoResponsavelUsuarioOptionType } from './dto/chamado-responsavel.type';
import { ChamadoResponsavelElegibilidadeService } from './chamado-responsavel-elegibilidade.service';
import { ChamadoResponsavelOptionsService } from './chamado-responsavel-options.service';
import { ChamadoResponsavelVinculoService } from './chamado-responsavel-vinculo.service';
import { AtendenteChamadoType } from './dto/atendente-chamado.type';
import { CreateChamadoResponsavelInput, UpdateChamadoResponsavelInput } from './dto/chamado-responsavel.input';
import { responsavelRecordToAtendente, responsavelRecordToPayload, toResponsavelType } from './mappers/chamado.mapper';
import {
  ChamadoResponsavelFuncionalidadeRecord,
  ChamadoResponsavelRecord,
  ChamadoResponsavelSolucaoRecord,
  GrupoResumoRecord,
  ResponsavelAlvoPayload,
  ResponsavelAberturaPayload,
  ResponsavelSolucaoPayload,
  UsuarioResumoRecord
} from './types/chamado-record.types';

@Injectable()
export class ChamadoResponsavelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ChamadoAuthorizationService,
    private readonly elegibilidade: ChamadoResponsavelElegibilidadeService,
    private readonly responsavelOptions: ChamadoResponsavelOptionsService,
    private readonly responsavelVinculo: ChamadoResponsavelVinculoService
  ) {}
  async responsaveisChamado(user: JwtPayload, ativas = false): Promise<ChamadoResponsavelType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.responsaveis, 'visualizar');

    const responsaveis = (await this.prisma.chamadoResponsavel.findMany({
      where: {
        empresaId,
        ...(ativas ? { ativo: true } : {})
      },
      include: this.responsavelInclude(),
      orderBy: [{ ativo: 'desc' }, { atualizadoEm: 'desc' }]
    })) as ChamadoResponsavelRecord[];

    return responsaveis
      .map((responsavel) => toResponsavelType(responsavel))
      .sort((a, b) => (a.responsavelNome || '').localeCompare(b.responsavelNome || ''));
  }

  async responsaveisFiltroChamado(user: JwtPayload): Promise<ChamadoResponsavelType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);

    if (!(await this.authorization.canUseAnyChamadosFeature(user))) {
      throw new ForbiddenException('Usuario sem acesso ao controle de chamados.');
    }

    const responsaveis = (await this.prisma.chamadoResponsavel.findMany({
      where: {
        empresaId,
        ativo: true,
        solucoes: { some: { ativo: true } }
      },
      include: this.responsavelInclude(),
      orderBy: [{ atualizadoEm: 'desc' }]
    })) as ChamadoResponsavelRecord[];

    return responsaveis
      .map((responsavel) => toResponsavelType(responsavel))
      .sort((a, b) => (a.responsavelNome || '').localeCompare(b.responsavelNome || ''));
  }

  async responsaveisChamadoOptions(user: JwtPayload): Promise<ChamadoResponsavelOptionsType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.responsaveis, 'visualizar');

    const [usuarios, grupos, solucoes] = await Promise.all([
      this.findUsuariosElegiveisResponsaveis(empresaId),
      this.findGruposElegiveisResponsaveis(empresaId),
      this.prisma.solucao.findMany({
        where: { ativo: true },
        select: {
          id: true,
          nome: true,
          slug: true,
          funcionalidades: {
            where: { ativo: true },
            select: { id: true, titulo: true, label: true, slug: true },
            orderBy: { ordem: 'asc' }
          }
        },
        orderBy: { ordem: 'asc' }
      })
    ]);

    return {
      usuarios: usuarios.map((usuario) => ({
        id: usuario.id,
        nome: usuario.nome ?? null,
        login: usuario.login ?? null,
        email: usuario.email,
        grupoNome: usuario.grupoNome ?? null
      })),
      grupos: grupos.map((grupo) => ({
        id: grupo.id,
        nome: grupo.nome,
        descricao: grupo.descricao ?? null,
        usuariosCount: grupo.usuariosCount
      })),
      solucoes: solucoes.map((solucao) => ({
        id: solucao.id,
        nome: solucao.nome,
        slug: solucao.slug,
        funcionalidades: (solucao.funcionalidades ?? []).map((funcionalidade) => ({
          id: funcionalidade.id,
          titulo: funcionalidade.titulo,
          label: funcionalidade.label ?? null,
          slug: funcionalidade.slug
        }))
      }))
    };
  }

  async createResponsavel(input: CreateChamadoResponsavelInput, user: JwtPayload): Promise<ChamadoResponsavelType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.responsaveis, 'incluir');
    const alvo = await this.resolveResponsavelAlvo(input, empresaId);

    const solucoes = await this.responsavelVinculo.normalizeResponsavelSolucoes(input.solucoes);
    const existing = await this.prisma.chamadoResponsavel.findFirst({
      where: {
        empresaId,
        tipo: alvo.tipo,
        ...(alvo.tipo === 'USUARIO' ? { usuarioId: alvo.usuarioId } : { grupoId: alvo.grupoId })
      },
      include: this.responsavelInclude()
    }) as ChamadoResponsavelRecord | null;

    if (existing?.ativo) {
      throw new BadRequestException('Este responsavel ja possui cadastro nesta empresa. Use a alteracao para ajustar os vinculos.');
    }

    if (existing) {
      return this.updateResponsavel({ id: existing.id, tipo: alvo.tipo, usuarioId: alvo.usuarioId, grupoId: alvo.grupoId, solucoes, ativo: input.ativo ?? true }, user);
    }

    const created = await this.prisma.chamadoResponsavel.create({
      data: {
        empresaId,
        tipo: alvo.tipo,
        usuarioId: alvo.usuarioId,
        grupoId: alvo.grupoId,
        ativo: input.ativo ?? true,
        solucoes: {
          create: solucoes.map((solucao) => ({
            solucaoId: solucao.solucaoId,
            responsavelGeral: solucao.responsavelGeral,
            ativo: true,
            funcionalidades: solucao.responsavelGeral ? undefined : {
              create: solucao.funcionalidadeIds.map((funcionalidadeId) => ({
                funcionalidadeId,
                ativo: true
              }))
            }
          }))
        }
      },
      include: this.responsavelInclude()
    }) as ChamadoResponsavelRecord;

    return toResponsavelType(created);
  }

  async updateResponsavel(input: UpdateChamadoResponsavelInput, user: JwtPayload): Promise<ChamadoResponsavelType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.responsaveis, 'alterar');
    const current = await this.ensureResponsavel(input.id, empresaId);
    const alvo = await this.resolveResponsavelAlvo(input, empresaId, current);

    const targetChanged = alvo.tipo !== current.tipo || alvo.usuarioId !== (current.usuarioId ?? null) || alvo.grupoId !== (current.grupoId ?? null);

    if (targetChanged) {
      const duplicated = await this.prisma.chamadoResponsavel.findFirst({
        where: {
          empresaId,
          tipo: alvo.tipo,
          ...(alvo.tipo === 'USUARIO' ? { usuarioId: alvo.usuarioId } : { grupoId: alvo.grupoId }),
          NOT: { id: input.id }
        },
        select: { id: true }
      });

      if (duplicated) {
        throw new BadRequestException('Este responsavel ja possui cadastro nesta empresa.');
      }
    }

    const solucoes = input.solucoes !== undefined && input.solucoes !== null
      ? await this.responsavelVinculo.normalizeResponsavelSolucoes(input.solucoes)
      : responsavelRecordToPayload(current);

    const updated = await this.prisma.$transaction(async (tx) => {
      const responsavel = await tx.chamadoResponsavel.update({
        where: { id: input.id },
        data: {
          tipo: alvo.tipo,
          usuarioId: alvo.usuarioId,
          grupoId: alvo.grupoId,
          ...(input.ativo !== undefined && input.ativo !== null ? { ativo: input.ativo } : {})
        }
      });

      await this.responsavelVinculo.syncResponsavelSolucoes(tx, responsavel.id, solucoes);

      return tx.chamadoResponsavel.findFirst({
        where: { id: responsavel.id, empresaId },
        include: this.responsavelInclude()
      });
    }) as ChamadoResponsavelRecord | null;

    if (!updated) {
      throw new NotFoundException('Responsavel de atendimento nao encontrado.');
    }

    return toResponsavelType(updated);
  }

  async deleteResponsavel(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.responsaveis, 'excluir');
    await this.ensureResponsavel(id, empresaId);

    await this.prisma.$transaction(async (tx) => {
      await tx.chamadoResponsavel.update({
        where: { id },
        data: { ativo: false }
      });

      await tx.chamadoResponsavelSolucao.updateMany({
        where: { responsavelId: id },
        data: { ativo: false }
      });

      const solucoes = await tx.chamadoResponsavelSolucao.findMany({
        where: { responsavelId: id },
        select: { id: true }
      });

      if (solucoes.length) {
        await tx.chamadoResponsavelFuncionalidade.updateMany({
          where: { responsavelSolucaoId: { in: solucoes.map((solucao) => solucao.id) } },
          data: { ativo: false }
        });
      }
    });

    return true;
  }

  async atendentesDisponiveis(user: JwtPayload): Promise<AtendenteChamadoType[]> {
    return this.responsavelOptions.atendentesDisponiveis(user);
  }

  async opcoesAberturaChamado(user: JwtPayload): Promise<ChamadoResponsavelOptionsType> {
    return this.responsavelOptions.opcoesAberturaChamado(user);
  }

  async responsaveisParaAberturaChamado(user: JwtPayload, solucaoId: number, funcionalidadeId?: number | null): Promise<AtendenteChamadoType[]> {
    return this.responsavelOptions.responsaveisParaAberturaChamado(user, solucaoId, funcionalidadeId);
  }

  async findSolucoesChamadoOptions(empresaId?: number): Promise<ChamadoResponsavelOptionsType['solucoes']> {
    return this.responsavelOptions.findSolucoesChamadoOptions(empresaId);
  }

  async resolveChamadoContext(solucaoIdInput: number, funcionalidadeIdInput?: number | null): Promise<{ solucaoId: number; funcionalidadeId: number | null }> {
    return this.responsavelOptions.resolveChamadoContext(solucaoIdInput, funcionalidadeIdInput);
  }

  async findResponsaveisParaContexto(empresaId: number, solucaoId: number, funcionalidadeId: number | null): Promise<AtendenteChamadoType[]> {
    return this.responsavelOptions.findResponsaveisParaContexto(empresaId, solucaoId, funcionalidadeId);
  }

  async resolveResponsavelAbertura(
    empresaId: number,
    solucaoId: number,
    funcionalidadeId: number | null,
    responsavelId?: string | null,
    responsavelGrupoId?: number | null
  ): Promise<ResponsavelAberturaPayload> {
    return this.responsavelOptions.resolveResponsavelAbertura(empresaId, solucaoId, funcionalidadeId, responsavelId, responsavelGrupoId);
  }
  private responsavelInclude() {
    return {
      usuario: { select: usuarioResumoSelect },
      grupo: { select: { id: true, nome: true, descricao: true } },
      solucoes: {
        include: {
          solucao: { select: { id: true, nome: true, slug: true } },
          funcionalidades: {
            include: { funcionalidade: { select: { id: true, titulo: true, label: true, slug: true } } },
            orderBy: { id: 'asc' as const }
          }
        },
        orderBy: { id: 'asc' as const }
      }
    };
  }

  private async ensureResponsavel(id: number, empresaId: number): Promise<ChamadoResponsavelRecord> {
    const responsavel = await this.prisma.chamadoResponsavel.findFirst({
      where: { id, empresaId },
      include: this.responsavelInclude()
    }) as ChamadoResponsavelRecord | null;

    if (!responsavel) {
      throw new NotFoundException('Responsavel de atendimento nao encontrado.');
    }

    return responsavel;
  }

  private async resolveResponsavelAlvo(
    input: Pick<CreateChamadoResponsavelInput | UpdateChamadoResponsavelInput, 'tipo' | 'usuarioId' | 'grupoId'>,
    empresaId: number,
    current?: ChamadoResponsavelRecord
  ): Promise<ResponsavelAlvoPayload> {
    const tipo = this.normalizeResponsavelTipo(input.tipo ?? current?.tipo ?? 'USUARIO');
    const usuarioId = tipo === 'USUARIO'
      ? (input.usuarioId !== undefined ? input.usuarioId?.trim() || null : current?.usuarioId ?? null)
      : null;
    const grupoId = tipo === 'GRUPO'
      ? (input.grupoId !== undefined && input.grupoId !== null ? Number(input.grupoId) : current?.grupoId ?? null)
      : null;

    if (tipo === 'USUARIO') {
      if (!usuarioId) {
        throw new BadRequestException('Selecione o usuario responsavel.');
      }

      await this.ensureUsuarioElegivelResponsavel(usuarioId, empresaId);
      return { tipo, usuarioId, grupoId: null };
    }

    if (!grupoId || !Number.isInteger(grupoId) || grupoId <= 0) {
      throw new BadRequestException('Selecione o grupo responsavel.');
    }

    await this.ensureGrupoElegivelResponsavel(grupoId, empresaId);
    return { tipo, usuarioId: null, grupoId };
  }

  private normalizeResponsavelTipo(tipo?: string | null): 'USUARIO' | 'GRUPO' {
    const normalized = (tipo || 'USUARIO').trim().toUpperCase();

    if (!['USUARIO', 'GRUPO'].includes(normalized)) {
      throw new BadRequestException('Tipo de responsavel invalido.');
    }

    return normalized as 'USUARIO' | 'GRUPO';
  }

  private async ensureUsuarioElegivelResponsavel(usuarioId: string, empresaId: number): Promise<void> {
    return this.elegibilidade.ensureUsuarioElegivelResponsavel(usuarioId, empresaId);
  }

  async ensureGrupoElegivelResponsavel(grupoId: number, empresaId: number): Promise<void> {
    return this.elegibilidade.ensureGrupoElegivelResponsavel(grupoId, empresaId);
  }

  async findUsuariosElegiveisAcompanhantes(
    empresaId: number,
    contexto: { solicitanteId?: string | null; responsavelId?: string | null } = {}
  ): Promise<ChamadoResponsavelUsuarioOptionType[]> {
    return this.elegibilidade.findUsuariosElegiveisAcompanhantes(empresaId, contexto);
  }

  async resolveAcompanhantesPayload(
    empresaId: number,
    usuarioIds: string[] | null | undefined,
    contexto: { solicitanteId?: string | null; responsavelId?: string | null }
  ): Promise<ChamadoResponsavelUsuarioOptionType[]> {
    return this.elegibilidade.resolveAcompanhantesPayload(empresaId, usuarioIds, contexto);
  }

  async findUsuariosElegiveisResponsaveis(empresaId: number): Promise<Array<UsuarioResumoRecord & { grupoNome?: string | null }>> {
    return this.elegibilidade.findUsuariosElegiveisResponsaveis(empresaId);
  }

  async findGruposElegiveisResponsaveis(empresaId: number): Promise<Array<GrupoResumoRecord & { usuariosCount: number }>> {
    return this.elegibilidade.findGruposElegiveisResponsaveis(empresaId);
  }

  async ensureGrupoResponsavel(grupoId: number): Promise<GrupoResumoRecord> {
    return this.elegibilidade.ensureGrupoResponsavel(grupoId);
  }

  async ensureUserBelongsToCompany(usuarioId: string, empresaId: number): Promise<UsuarioResumoRecord> {
    return this.elegibilidade.ensureUserBelongsToCompany(usuarioId, empresaId);
  }
}