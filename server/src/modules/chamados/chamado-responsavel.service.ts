import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { FEATURES } from './constants/chamado.constants';
import { usuarioResumoSelect } from './constants/chamado-prisma.constants';
import { ChamadoResponsavelOptionsType, ChamadoResponsavelType, ChamadoResponsavelUsuarioOptionType } from './dto/chamado-responsavel.type';
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
    private readonly authorization: ChamadoAuthorizationService
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

    const solucoes = await this.normalizeResponsavelSolucoes(input.solucoes);
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
      ? await this.normalizeResponsavelSolucoes(input.solucoes)
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

      await this.syncResponsavelSolucoes(tx, responsavel.id, solucoes);

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
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.painel, 'atribuir_chamado');

    const [vinculos, grupos] = await Promise.all([
      (this.prisma as never as { empresaUsuario: { findMany: Function } }).empresaUsuario.findMany({
        where: { empresaId },
        include: {
          usuario: {
            select: usuarioResumoSelect
          }
        }
      }) as Promise<Array<{ usuario?: UsuarioResumoRecord | null }>>,
      this.findGruposElegiveisResponsaveis(empresaId)
    ]);

    const usuarios = vinculos
      .map((vinculo) => vinculo.usuario)
      .filter((usuario): usuario is { id: string; nome: string | null; login: string | null; email: string } => !!usuario)
      .sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email))
      .map((usuario) => ({
        id: `USUARIO:${usuario.id}`,
        tipo: 'USUARIO',
        usuarioId: usuario.id,
        grupoId: null,
        nome: usuario.nome ?? null,
        login: usuario.login ?? null,
        email: usuario.email
      }));

    const gruposOptions = grupos.map((grupo) => ({
      id: `GRUPO:${grupo.id}`,
      tipo: 'GRUPO',
      usuarioId: null,
      grupoId: grupo.id,
      nome: grupo.nome,
      login: null,
      email: null
    }));

    return [...usuarios, ...gruposOptions];
  }

  async opcoesAberturaChamado(user: JwtPayload): Promise<ChamadoResponsavelOptionsType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.abrir, 'incluir');

    return {
      usuarios: [],
      grupos: [],
      solucoes: await this.findSolucoesChamadoOptions(empresaId)
    };
  }

  async responsaveisParaAberturaChamado(user: JwtPayload, solucaoId: number, funcionalidadeId?: number | null): Promise<AtendenteChamadoType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);
    const canSelectResponsavel =
      await this.authorization.canFeatureAction(user, FEATURES.abrir, 'incluir') ||
      await this.authorization.canFeatureAction(user, FEATURES.painel, 'atribuir_chamado') ||
      await this.authorization.canFeatureAction(user, FEATURES.painel, 'transferir_chamado');

    if (!canSelectResponsavel) {
      throw new ForbiddenException('Usuario sem permissao para selecionar responsaveis de chamado.');
    }

    const contexto = await this.resolveChamadoContext(solucaoId, funcionalidadeId ?? null);

    return this.findResponsaveisParaContexto(empresaId, contexto.solucaoId, contexto.funcionalidadeId);
  }

  async findSolucoesChamadoOptions(empresaId?: number): Promise<ChamadoResponsavelOptionsType['solucoes']> {
    const solucoes = await this.prisma.solucao.findMany({
      where: {
        ativo: true,
        ...(empresaId ? { empresas: { some: { empresaId } } } : {})
      },
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
    });

    return solucoes.map((solucao) => ({
      id: solucao.id,
      nome: solucao.nome,
      slug: solucao.slug,
      funcionalidades: (solucao.funcionalidades ?? []).map((funcionalidade) => ({
        id: funcionalidade.id,
        titulo: funcionalidade.titulo,
        label: funcionalidade.label ?? null,
        slug: funcionalidade.slug
      }))
    }));
  }

  async resolveChamadoContext(solucaoIdInput: number, funcionalidadeIdInput?: number | null): Promise<{ solucaoId: number; funcionalidadeId: number | null }> {
    const solucaoId = Number(solucaoIdInput);
    const funcionalidadeId = funcionalidadeIdInput ? Number(funcionalidadeIdInput) : null;

    if (!Number.isInteger(solucaoId) || solucaoId <= 0) {
      throw new BadRequestException('Selecione uma solucao valida para o chamado.');
    }

    const solucao = await this.prisma.solucao.findFirst({
      where: { id: solucaoId, ativo: true },
      select: { id: true }
    });

    if (!solucao) {
      throw new BadRequestException('Solucao selecionada nao existe ou esta inativa.');
    }

    if (!funcionalidadeId) {
      return { solucaoId, funcionalidadeId: null };
    }

    if (!Number.isInteger(funcionalidadeId) || funcionalidadeId <= 0) {
      throw new BadRequestException('Selecione uma funcionalidade valida para o chamado.');
    }

    const funcionalidade = await this.prisma.funcionalidade.findFirst({
      where: { id: funcionalidadeId, solucaoId, ativo: true },
      select: { id: true }
    });

    if (!funcionalidade) {
      throw new BadRequestException('Funcionalidade selecionada nao pertence a solucao informada ou esta inativa.');
    }

    return { solucaoId, funcionalidadeId };
  }

  async findResponsaveisParaContexto(empresaId: number, solucaoId: number, funcionalidadeId: number | null): Promise<AtendenteChamadoType[]> {
    const criterios = funcionalidadeId
      ? [
          { responsavelGeral: true },
          { funcionalidades: { some: { funcionalidadeId, ativo: true } } }
        ]
      : undefined;

    const responsaveis = await this.prisma.chamadoResponsavel.findMany({
      where: {
        empresaId,
        ativo: true,
        solucoes: {
          some: {
            solucaoId,
            ativo: true,
            ...(criterios ? { OR: criterios } : {})
          }
        }
      },
      include: {
        usuario: { select: usuarioResumoSelect },
        grupo: { select: { id: true, nome: true, descricao: true } }
      }
    }) as ChamadoResponsavelRecord[];

    return responsaveis
      .map((responsavel) => responsavelRecordToAtendente(responsavel))
      .filter((responsavel): responsavel is AtendenteChamadoType => !!responsavel)
      .sort((a, b) => (a.nome || a.email || '').localeCompare(b.nome || b.email || ''));
  }

  async resolveResponsavelAbertura(
    empresaId: number,
    solucaoId: number,
    funcionalidadeId: number | null,
    responsavelId?: string | null,
    responsavelGrupoId?: number | null
  ): Promise<ResponsavelAberturaPayload> {
    const usuarioId = responsavelId?.trim() || null;
    const grupoId = responsavelGrupoId ? Number(responsavelGrupoId) : null;

    if (usuarioId && grupoId) {
      throw new BadRequestException('Selecione apenas um responsavel para o chamado.');
    }

    if (!usuarioId && !grupoId) {
      return { responsavelId: null, responsavelGrupoId: null };
    }

    const responsaveis = await this.findResponsaveisParaContexto(empresaId, solucaoId, funcionalidadeId);
    const match = responsaveis.find((responsavel) => (
      usuarioId ? responsavel.tipo === 'USUARIO' && responsavel.usuarioId === usuarioId : responsavel.tipo === 'GRUPO' && responsavel.grupoId === grupoId
    ));

    if (!match) {
      throw new BadRequestException('Responsavel selecionado nao esta cadastrado para a solucao ou funcionalidade do chamado.');
    }

    return {
      responsavelId: usuarioId,
      responsavelGrupoId: grupoId
    };
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

  private async normalizeResponsavelSolucoes(inputSolucoes: Array<{ solucaoId: number; responsavelGeral?: boolean | null; funcionalidadeIds?: number[] | null }>): Promise<ResponsavelSolucaoPayload[]> {
    if (!inputSolucoes?.length) {
      throw new BadRequestException('Selecione pelo menos uma solucao.');
    }

    const solucaoIds = new Set<number>();
    const payloads = inputSolucoes.map((item) => {
      const solucaoId = Number(item.solucaoId);

      if (!Number.isInteger(solucaoId) || solucaoId <= 0) {
        throw new BadRequestException('Selecione uma solucao valida.');
      }

      if (solucaoIds.has(solucaoId)) {
        throw new BadRequestException('A mesma solucao foi informada mais de uma vez.');
      }

      solucaoIds.add(solucaoId);

      const funcionalidadeIds = [...new Set((item.funcionalidadeIds ?? [])
        .map((funcionalidadeId) => Number(funcionalidadeId))
        .filter((funcionalidadeId) => Number.isInteger(funcionalidadeId) && funcionalidadeId > 0))];
      const responsavelGeral = !!item.responsavelGeral;

      if (!responsavelGeral && !funcionalidadeIds.length) {
        throw new BadRequestException('Marque responsavel geral ou selecione pelo menos uma funcionalidade para cada solucao.');
      }

      return {
        solucaoId,
        responsavelGeral,
        funcionalidadeIds: responsavelGeral ? [] : funcionalidadeIds
      };
    });

    const solucoes = await this.prisma.solucao.findMany({
      where: { id: { in: [...solucaoIds] }, ativo: true },
      select: {
        id: true,
        nome: true,
        funcionalidades: {
          where: { ativo: true },
          select: { id: true }
        }
      }
    });
    const solucoesById = new Map(solucoes.map((solucao) => [solucao.id, solucao]));

    for (const payload of payloads) {
      const solucao = solucoesById.get(payload.solucaoId);

      if (!solucao) {
        throw new BadRequestException('Solucao selecionada nao existe ou esta inativa.');
      }

      if (payload.responsavelGeral) {
        continue;
      }

      const validFuncionalidadeIds = new Set((solucao.funcionalidades ?? []).map((funcionalidade) => funcionalidade.id));
      const invalidFuncionalidade = payload.funcionalidadeIds.find((funcionalidadeId) => !validFuncionalidadeIds.has(funcionalidadeId));

      if (invalidFuncionalidade) {
        throw new BadRequestException(`Funcionalidade selecionada nao pertence a solucao ${solucao.nome} ou esta inativa.`);
      }
    }

    return payloads;
  }

  private async syncResponsavelSolucoes(tx: any, responsavelId: number, solucoes: ResponsavelSolucaoPayload[]): Promise<void> {
    const existingSolucoes = await tx.chamadoResponsavelSolucao.findMany({
      where: { responsavelId },
      include: { funcionalidades: true }
    }) as Array<ChamadoResponsavelSolucaoRecord & { funcionalidades: ChamadoResponsavelFuncionalidadeRecord[] }>;
    const existingBySolucaoId = new Map(existingSolucoes.map((solucao) => [solucao.solucaoId, solucao]));
    const selectedSolucaoIds = new Set(solucoes.map((solucao) => solucao.solucaoId));

    for (const existing of existingSolucoes) {
      if (selectedSolucaoIds.has(existing.solucaoId)) {
        continue;
      }

      await tx.chamadoResponsavelSolucao.update({
        where: { id: existing.id },
        data: { ativo: false }
      });

      if (existing.funcionalidades?.length) {
        await tx.chamadoResponsavelFuncionalidade.updateMany({
          where: { responsavelSolucaoId: existing.id },
          data: { ativo: false }
        });
      }
    }

    for (const payload of solucoes) {
      const existing = existingBySolucaoId.get(payload.solucaoId);
      const responsavelSolucao = existing
        ? await tx.chamadoResponsavelSolucao.update({
            where: { id: existing.id },
            data: {
              responsavelGeral: payload.responsavelGeral,
              ativo: true
            }
          })
        : await tx.chamadoResponsavelSolucao.create({
            data: {
              responsavelId,
              solucaoId: payload.solucaoId,
              responsavelGeral: payload.responsavelGeral,
              ativo: true
            }
          });

      const existingFuncionalidades = existing?.funcionalidades ?? [];
      const existingFuncionalidadesById = new Map(existingFuncionalidades.map((funcionalidade) => [funcionalidade.funcionalidadeId, funcionalidade]));
      const selectedFuncionalidadeIds = new Set(payload.funcionalidadeIds);

      if (payload.responsavelGeral) {
        if (existingFuncionalidades.length) {
          await tx.chamadoResponsavelFuncionalidade.updateMany({
            where: { responsavelSolucaoId: responsavelSolucao.id },
            data: { ativo: false }
          });
        }
        continue;
      }

      for (const existingFuncionalidade of existingFuncionalidades) {
        if (selectedFuncionalidadeIds.has(existingFuncionalidade.funcionalidadeId)) {
          continue;
        }

        await tx.chamadoResponsavelFuncionalidade.update({
          where: { id: existingFuncionalidade.id },
          data: { ativo: false }
        });
      }

      for (const funcionalidadeId of payload.funcionalidadeIds) {
        const existingFuncionalidade = existingFuncionalidadesById.get(funcionalidadeId);

        if (existingFuncionalidade) {
          if (!existingFuncionalidade.ativo) {
            await tx.chamadoResponsavelFuncionalidade.update({
              where: { id: existingFuncionalidade.id },
              data: { ativo: true }
            });
          }
          continue;
        }

        await tx.chamadoResponsavelFuncionalidade.create({
          data: {
            responsavelSolucaoId: responsavelSolucao.id,
            funcionalidadeId,
            ativo: true
          }
        });
      }
    }
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
