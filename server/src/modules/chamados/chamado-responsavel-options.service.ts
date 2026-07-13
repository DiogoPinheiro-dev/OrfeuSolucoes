import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoResponsavelElegibilidadeService } from './chamado-responsavel-elegibilidade.service';
import { FEATURES } from './constants/chamado.constants';
import { usuarioResumoSelect } from './constants/chamado-prisma.constants';
import { AtendenteChamadoType } from './dto/atendente-chamado.type';
import { ChamadoResponsavelOptionsType } from './dto/chamado-responsavel.type';
import { responsavelRecordToAtendente } from './mappers/chamado.mapper';
import { ChamadoResponsavelRecord, ResponsavelAberturaPayload, UsuarioResumoRecord } from './types/chamado-record.types';

@Injectable()
export class ChamadoResponsavelOptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ChamadoAuthorizationService,
    private readonly elegibilidade: ChamadoResponsavelElegibilidadeService
  ) {}

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
      this.elegibilidade.findGruposElegiveisResponsaveis(empresaId)
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
}
