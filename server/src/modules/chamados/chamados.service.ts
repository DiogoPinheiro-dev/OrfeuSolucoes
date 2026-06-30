import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { SolucoesService } from '../solucoes/solucoes.service';
import { AlterarPrioridadeChamadoInput } from './dto/alterar-prioridade-chamado.input';
import { AlterarStatusChamadoInput } from './dto/alterar-status-chamado.input';
import { AtribuirChamadoInput } from './dto/atribuir-chamado.input';
import { AtendenteChamadoType } from './dto/atendente-chamado.type';
import { ChamadoCategoriaType } from './dto/chamado-categoria.type';
import { CreateChamadoCategoriaInput, UpdateChamadoCategoriaInput } from './dto/chamado-categoria.input';
import { ChamadoFiltroInput } from './dto/chamado-filtro.input';
import { ChamadoHistoricoType, ChamadoMensagemType, ChamadoPageType, ChamadoType } from './dto/chamado.type';
import { CriarChamadoInput } from './dto/criar-chamado.input';
import { ResponderChamadoInput } from './dto/responder-chamado.input';

const SOLUTION_SLUG = 'controle-de-chamados';

const FEATURES = {
  abrir: 'abrir-chamado',
  meus: 'meus-chamados',
  painel: 'painel-atendimento',
  categorias: 'categorias'
} as const;

const STATUS = ['ABERTO', 'EM_TRIAGEM', 'EM_ATENDIMENTO', 'PENDENTE', 'RESOLVIDO', 'ENCERRADO'] as const;
const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'] as const;
const TIPOS = ['SOLICITACAO', 'INCIDENTE', 'DUVIDA', 'MELHORIA'] as const;

const OPEN_STATUSES = ['ABERTO', 'EM_TRIAGEM', 'EM_ATENDIMENTO', 'PENDENTE'] as const;
const GENERAL_STATUS_TRANSITIONS: Record<string, string[]> = {
  ABERTO: ['EM_TRIAGEM', 'EM_ATENDIMENTO'],
  EM_TRIAGEM: ['EM_ATENDIMENTO', 'PENDENTE'],
  EM_ATENDIMENTO: ['EM_TRIAGEM', 'PENDENTE'],
  PENDENTE: ['EM_TRIAGEM', 'EM_ATENDIMENTO']
};

type UsuarioResumoRecord = {
  id: string;
  nome?: string | null;
  login?: string | null;
  email: string;
};

type ChamadoCategoriaRecord = {
  id: number;
  empresaId: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

type ChamadoMensagemRecord = {
  id: string;
  chamadoId: string;
  empresaId: number;
  autorId: string;
  tipo: string;
  conteudo: string;
  criadoEm: Date;
  autor?: UsuarioResumoRecord | null;
};

type ChamadoHistoricoRecord = {
  id: string;
  chamadoId: string;
  empresaId: number;
  usuarioId?: string | null;
  evento: string;
  campo?: string | null;
  valorAnterior?: string | null;
  valorNovo?: string | null;
  observacao?: string | null;
  criadoEm: Date;
  usuario?: UsuarioResumoRecord | null;
};

type ChamadoRecord = {
  id: string;
  numero: number;
  empresaId: number;
  solicitanteId: string;
  responsavelId?: string | null;
  categoriaId?: number | null;
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  status: string;
  criadoEm: Date;
  atualizadoEm: Date;
  primeiraRespostaEm?: Date | null;
  resolvidoEm?: Date | null;
  encerradoEm?: Date | null;
  versao: number;
  solicitante?: UsuarioResumoRecord | null;
  responsavel?: UsuarioResumoRecord | null;
  categoria?: ChamadoCategoriaRecord | null;
  mensagens?: ChamadoMensagemRecord[];
  historico?: ChamadoHistoricoRecord[];
};

const usuarioResumoSelect = {
  id: true,
  nome: true,
  login: true,
  email: true
};

const chamadoSummaryInclude = {
  solicitante: { select: usuarioResumoSelect },
  responsavel: { select: usuarioResumoSelect },
  categoria: true
};

const chamadoDetailInclude = {
  ...chamadoSummaryInclude,
  mensagens: {
    include: {
      autor: { select: usuarioResumoSelect }
    },
    orderBy: { criadoEm: 'asc' }
  },
  historico: {
    include: {
      usuario: { select: usuarioResumoSelect }
    },
    orderBy: { criadoEm: 'asc' }
  }
};

@Injectable()
export class ChamadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly solucoesService: SolucoesService
  ) {}

  async meusChamados(user: JwtPayload, filtro?: ChamadoFiltroInput | null): Promise<ChamadoPageType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.meus, 'visualizar');

    return this.findChamadosPage(empresaId, filtro, { solicitanteId: user.sub });
  }

  async filaChamados(user: JwtPayload, filtro?: ChamadoFiltroInput | null): Promise<ChamadoPageType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'visualizar_fila');

    return this.findChamadosPage(empresaId, filtro);
  }

  async chamado(id: string, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    const chamado = await this.findChamadoRecordOrThrow(id, empresaId, true);

    await this.assertCanViewChamado(user, chamado);

    return this.toChamadoType(chamado);
  }

  async criarChamado(input: CriarChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.abrir, 'incluir');

    const tipo = this.normalizeValue(input.tipo, TIPOS, 'SOLICITACAO', 'tipo');
    const prioridade = this.normalizeValue(input.prioridade, PRIORIDADES, 'MEDIA', 'prioridade');
    const titulo = this.requiredText(input.titulo, 'titulo');
    const descricao = this.requiredText(input.descricao, 'descricao');

    if (input.categoriaId) {
      await this.ensureCategoria(input.categoriaId, empresaId, true);
    }

    const created = (await this.prisma.$transaction(async (tx) => {
      const db = tx as never as {
        chamadoSequencia: { upsert: Function };
        chamado: { create: Function };
        chamadoHistorico: { create: Function };
      };
      const sequencia = (await db.chamadoSequencia.upsert({
        where: { empresaId },
        update: { proximoNumero: { increment: 1 } },
        create: { empresaId, proximoNumero: 2 }
      })) as { proximoNumero: number };
      const numero = sequencia.proximoNumero - 1;
      const chamado = (await db.chamado.create({
        data: {
          numero,
          empresaId,
          solicitanteId: user.sub,
          categoriaId: input.categoriaId ?? null,
          titulo,
          descricao,
          tipo,
          prioridade,
          status: 'ABERTO'
        },
        include: chamadoSummaryInclude
      })) as ChamadoRecord;

      await db.chamadoHistorico.create({
        data: {
          chamadoId: chamado.id,
          empresaId,
          usuarioId: user.sub,
          evento: 'ABERTURA',
          campo: 'status',
          valorNovo: 'ABERTO',
          observacao: 'Chamado aberto pelo solicitante.'
        }
      });

      return chamado;
    })) as ChamadoRecord;

    return this.chamado(created.id, user);
  }

  async responderChamado(input: ResponderChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    const chamado = await this.findChamadoRecordOrThrow(input.chamadoId, empresaId);

    await this.assertCanRespondChamado(user, chamado);

    if (chamado.status === 'ENCERRADO') {
      throw new BadRequestException('Chamados encerrados precisam ser reabertos antes de receber novas respostas.');
    }

    const conteudo = this.requiredText(input.conteudo, 'conteudo');
    const isAtendente = chamado.solicitanteId !== user.sub;
    const shouldMarkFirstResponse = isAtendente && !chamado.primeiraRespostaEm;
    const shouldMoveToAttendance = isAtendente && ['ABERTO', 'EM_TRIAGEM'].includes(chamado.status);
    const nextStatus = shouldMoveToAttendance ? 'EM_ATENDIMENTO' : chamado.status;
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const db = tx as never as {
        chamadoMensagem: { create: Function };
        chamado: { update: Function };
        chamadoHistorico: { create: Function };
      };

      await db.chamadoMensagem.create({
        data: {
          chamadoId: chamado.id,
          empresaId,
          autorId: user.sub,
          tipo: 'PUBLICA',
          conteudo
        }
      });

      await db.chamadoHistorico.create({
        data: {
          chamadoId: chamado.id,
          empresaId,
          usuarioId: user.sub,
          evento: 'MENSAGEM',
          observacao: 'Resposta publica adicionada.'
        }
      });

      await db.chamado.update({
        where: { id: chamado.id },
        data: {
          ...(shouldMarkFirstResponse ? { primeiraRespostaEm: now } : {}),
          ...(shouldMoveToAttendance ? { status: nextStatus } : {}),
          versao: { increment: 1 }
        }
      });

      if (shouldMoveToAttendance) {
        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId,
            usuarioId: user.sub,
            evento: 'ALTERACAO_STATUS',
            campo: 'status',
            valorAnterior: chamado.status,
            valorNovo: nextStatus,
            observacao: 'Status ajustado automaticamente apos resposta do atendimento.'
          }
        });
      }
    });

    return this.chamado(chamado.id, user);
  }

  async assumirChamado(chamadoId: string, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'assumir_chamado');

    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);
    const nextStatus = OPEN_STATUSES.includes(chamado.status as never) && chamado.status !== 'EM_ATENDIMENTO'
      ? 'EM_ATENDIMENTO'
      : chamado.status;
    const responsavelAnteriorNome = this.usuarioLabel(chamado.responsavel);
    const novoResponsavelNome = user.nome || user.login || user.email;

    if (['RESOLVIDO', 'ENCERRADO'].includes(chamado.status)) {
      throw new BadRequestException('Chamados resolvidos ou encerrados nao podem ser assumidos sem reabertura.');
    }

    await this.prisma.$transaction(async (tx) => {
      const db = tx as never as { chamado: { update: Function }; chamadoHistorico: { create: Function } };

      await db.chamado.update({
        where: { id: chamado.id },
        data: {
          responsavelId: user.sub,
          status: nextStatus,
          versao: { increment: 1 }
        }
      });

      await db.chamadoHistorico.create({
        data: {
          chamadoId: chamado.id,
          empresaId,
          usuarioId: user.sub,
          evento: 'ATRIBUICAO',
          campo: 'responsavel',
          valorAnterior: responsavelAnteriorNome,
          valorNovo: novoResponsavelNome,
          observacao: 'Chamado assumido pelo atendente.'
        }
      });

      if (nextStatus !== chamado.status) {
        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId,
            usuarioId: user.sub,
            evento: 'ALTERACAO_STATUS',
            campo: 'status',
            valorAnterior: chamado.status,
            valorNovo: nextStatus
          }
        });
      }
    });

    return this.chamado(chamado.id, user);
  }

  async atribuirChamado(input: AtribuirChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'atribuir_chamado');

    const chamado = await this.findChamadoRecordOrThrow(input.chamadoId, empresaId);
    const responsavelId = input.responsavelId?.trim() || null;

    let novoResponsavel: UsuarioResumoRecord | null = null;

    if (responsavelId) {
      novoResponsavel = await this.ensureUserBelongsToCompany(responsavelId, empresaId);
    }

    const responsavelAnteriorNome = this.usuarioLabel(chamado.responsavel);
    const novoResponsavelNome = this.usuarioLabel(novoResponsavel);

    if (['RESOLVIDO', 'ENCERRADO'].includes(chamado.status)) {
      throw new BadRequestException('Reabra o chamado antes de alterar o responsavel.');
    }

    const nextStatus = responsavelId && ['ABERTO', 'EM_TRIAGEM'].includes(chamado.status)
      ? 'EM_ATENDIMENTO'
      : chamado.status;

    await this.updateChamadoWithHistory(
      chamado,
      user,
      {
        responsavelId,
        status: nextStatus,
        versao: { increment: 1 }
      },
      [
        {
          evento: 'ATRIBUICAO',
          campo: 'responsavel',
          valorAnterior: responsavelAnteriorNome,
          valorNovo: novoResponsavelNome,
          observacao: responsavelId ? 'Responsavel alterado.' : 'Responsavel removido.'
        },
        ...(nextStatus !== chamado.status
          ? [{
              evento: 'ALTERACAO_STATUS',
              campo: 'status',
              valorAnterior: chamado.status,
              valorNovo: nextStatus,
              observacao: 'Status ajustado apos atribuicao.'
            }]
          : [])
      ]
    );

    return this.chamado(chamado.id, user);
  }

  async alterarStatusChamado(input: AlterarStatusChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'alterar_status');

    const chamado = await this.findChamadoRecordOrThrow(input.chamadoId, empresaId);
    const status = this.normalizeValue(input.status, STATUS, undefined, 'status');

    if (['RESOLVIDO', 'ENCERRADO'].includes(status)) {
      throw new BadRequestException('Use as acoes especificas para resolver ou encerrar chamados.');
    }

    this.assertTransition(chamado.status, status);

    await this.updateStatus(chamado, user, status, input.observacao ?? null);

    return this.chamado(chamado.id, user);
  }

  async alterarPrioridadeChamado(input: AlterarPrioridadeChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'alterar_prioridade');

    const chamado = await this.findChamadoRecordOrThrow(input.chamadoId, empresaId);
    const prioridade = this.normalizeValue(input.prioridade, PRIORIDADES, undefined, 'prioridade');

    if (prioridade === chamado.prioridade) {
      return this.chamado(chamado.id, user);
    }

    await this.updateChamadoWithHistory(
      chamado,
      user,
      {
        prioridade,
        versao: { increment: 1 }
      },
      [{
        evento: 'ALTERACAO_PRIORIDADE',
        campo: 'prioridade',
        valorAnterior: chamado.prioridade,
        valorNovo: prioridade
      }]
    );

    return this.chamado(chamado.id, user);
  }

  async resolverChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'resolver_chamado');

    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);

    if (chamado.status === 'ENCERRADO') {
      throw new BadRequestException('Chamado encerrado nao pode ser resolvido novamente.');
    }

    if (chamado.status !== 'RESOLVIDO') {
      await this.updateStatus(chamado, user, 'RESOLVIDO', observacao ?? null, { resolvidoEm: new Date() });
    }

    return this.chamado(chamado.id, user);
  }

  async encerrarChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'encerrar_chamado');

    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);

    if (chamado.status !== 'RESOLVIDO') {
      throw new BadRequestException('Apenas chamados resolvidos podem ser encerrados.');
    }

    await this.updateStatus(chamado, user, 'ENCERRADO', observacao ?? null, { encerradoEm: new Date() });

    return this.chamado(chamado.id, user);
  }

  async reabrirChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);

    if (chamado.status === 'ENCERRADO' && !this.isSystemAdmin(user)) {
      throw new ForbiddenException('Apenas o administrador inicial pode reabrir chamados encerrados.');
    }

    if (chamado.solicitanteId === user.sub && chamado.status === 'RESOLVIDO') {
      await this.assertFeatureAction(user, FEATURES.meus, 'reabrir_proprio_chamado');
    } else {
      await this.assertFeatureAction(user, FEATURES.painel, 'reabrir_chamado');
    }

    if (!['RESOLVIDO', 'ENCERRADO'].includes(chamado.status)) {
      throw new BadRequestException('Apenas chamados resolvidos ou encerrados podem ser reabertos.');
    }

    await this.updateChamadoWithHistory(
      chamado,
      user,
      {
        status: 'EM_ATENDIMENTO',
        resolvidoEm: null,
        encerradoEm: null,
        versao: { increment: 1 }
      },
      [{
        evento: 'REABERTURA',
        campo: 'status',
        valorAnterior: chamado.status,
        valorNovo: 'EM_ATENDIMENTO',
        observacao: observacao?.trim() || 'Chamado reaberto.'
      }]
    );

    return this.chamado(chamado.id, user);
  }

  async categoriasChamado(user: JwtPayload, ativas = true): Promise<ChamadoCategoriaType[]> {
    const empresaId = this.assertCompanyContext(user);

    if (!(await this.canUseAnyChamadosFeature(user))) {
      throw new ForbiddenException('Usuario sem acesso ao controle de chamados.');
    }

    const categorias = (await (this.prisma as never as { chamadoCategoria: { findMany: Function } }).chamadoCategoria.findMany({
      where: {
        empresaId,
        ...(ativas ? { ativo: true } : {})
      },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }]
    })) as ChamadoCategoriaRecord[];

    return categorias.map((categoria) => this.toCategoriaType(categoria));
  }

  async createCategoria(input: CreateChamadoCategoriaInput, user: JwtPayload): Promise<ChamadoCategoriaType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.categorias, 'incluir');

    const created = (await (this.prisma as never as { chamadoCategoria: { create: Function } }).chamadoCategoria.create({
      data: {
        empresaId,
        nome: this.requiredText(input.nome, 'nome'),
        descricao: input.descricao?.trim() || null,
        ativo: input.ativo ?? true
      }
    })) as ChamadoCategoriaRecord;

    return this.toCategoriaType(created);
  }

  async updateCategoria(input: UpdateChamadoCategoriaInput, user: JwtPayload): Promise<ChamadoCategoriaType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.categorias, 'alterar');
    await this.ensureCategoria(input.id, empresaId, false);

    const updated = (await (this.prisma as never as { chamadoCategoria: { update: Function } }).chamadoCategoria.update({
      where: { id: input.id },
      data: {
        ...(input.nome !== undefined ? { nome: this.requiredText(input.nome ?? '', 'nome') } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
        ...(input.ativo !== undefined && input.ativo !== null ? { ativo: input.ativo } : {})
      }
    })) as ChamadoCategoriaRecord;

    return this.toCategoriaType(updated);
  }

  async deleteCategoria(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.categorias, 'excluir');
    await this.ensureCategoria(id, empresaId, false);

    await (this.prisma as never as { chamadoCategoria: { update: Function } }).chamadoCategoria.update({
      where: { id },
      data: { ativo: false }
    });

    return true;
  }

  async atendentesDisponiveis(user: JwtPayload): Promise<AtendenteChamadoType[]> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'atribuir_chamado');

    const vinculos = (await (this.prisma as never as { empresaUsuario: { findMany: Function } }).empresaUsuario.findMany({
      where: { empresaId },
      include: {
        usuario: {
          select: usuarioResumoSelect
        }
      }
    })) as Array<{ usuario?: UsuarioResumoRecord | null }>;

    return vinculos
      .map((vinculo) => vinculo.usuario)
      .filter((usuario): usuario is UsuarioResumoRecord => !!usuario)
      .sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email))
      .map((usuario) => ({
        id: usuario.id,
        nome: usuario.nome ?? null,
        login: usuario.login ?? null,
        email: usuario.email
      }));
  }

  private async findChamadosPage(
    empresaId: number,
    filtro: ChamadoFiltroInput | null | undefined,
    extraWhere: Record<string, unknown> = {}
  ): Promise<ChamadoPageType> {
    const page = Math.max(1, Number(filtro?.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(filtro?.pageSize ?? 20)));
    const where = this.buildChamadoWhere(empresaId, filtro, extraWhere);
    const db = this.prisma as never as {
      chamado: { count: Function; findMany: Function };
    };

    const [total, chamados] = await Promise.all([
      db.chamado.count({ where }) as Promise<number>,
      db.chamado.findMany({
        where,
        include: chamadoSummaryInclude,
        orderBy: [{ atualizadoEm: 'desc' }, { numero: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }) as Promise<ChamadoRecord[]>
    ]);

    return {
      items: chamados.map((chamado) => this.toChamadoType(chamado)),
      total,
      page,
      pageSize
    };
  }

  private buildChamadoWhere(
    empresaId: number,
    filtro: ChamadoFiltroInput | null | undefined,
    extraWhere: Record<string, unknown>
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {
      empresaId,
      ...extraWhere
    };

    if (filtro?.status) {
      where.status = this.normalizeValue(filtro.status, STATUS, undefined, 'status');
    }

    if (filtro?.prioridade) {
      where.prioridade = this.normalizeValue(filtro.prioridade, PRIORIDADES, undefined, 'prioridade');
    }

    if (filtro?.responsavelId) {
      where.responsavelId = filtro.responsavelId;
    }

    if (filtro?.categoriaId) {
      where.categoriaId = filtro.categoriaId;
    }

    const termo = filtro?.termo?.trim();

    if (termo) {
      const numero = Number(termo.replace('#', ''));
      where.OR = [
        { titulo: { contains: termo } },
        { descricao: { contains: termo } },
        ...(Number.isFinite(numero) && numero > 0 ? [{ numero }] : [])
      ];
    }

    return where;
  }

  private async findChamadoRecordOrThrow(id: string, empresaId: number, detailed = false): Promise<ChamadoRecord> {
    const chamado = (await (this.prisma as never as { chamado: { findFirst: Function } }).chamado.findFirst({
      where: { id, empresaId },
      include: detailed ? chamadoDetailInclude : chamadoSummaryInclude
    })) as ChamadoRecord | null;

    if (!chamado) {
      throw new NotFoundException('Chamado nao encontrado.');
    }

    return chamado;
  }

  private async ensureCategoria(id: number, empresaId: number, requireActive: boolean): Promise<ChamadoCategoriaRecord> {
    const categoria = (await (this.prisma as never as { chamadoCategoria: { findFirst: Function } }).chamadoCategoria.findFirst({
      where: {
        id,
        empresaId,
        ...(requireActive ? { ativo: true } : {})
      }
    })) as ChamadoCategoriaRecord | null;

    if (!categoria) {
      throw new NotFoundException('Categoria de chamado nao encontrada.');
    }

    return categoria;
  }

  private async ensureUserBelongsToCompany(usuarioId: string, empresaId: number): Promise<UsuarioResumoRecord> {
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

  private async updateStatus(
    chamado: ChamadoRecord,
    user: JwtPayload,
    status: string,
    observacao?: string | null,
    extraData: Record<string, unknown> = {}
  ): Promise<void> {
    await this.updateChamadoWithHistory(
      chamado,
      user,
      {
        status,
        ...extraData,
        versao: { increment: 1 }
      },
      [{
        evento: status === 'RESOLVIDO'
          ? 'RESOLUCAO'
          : status === 'ENCERRADO'
            ? 'ENCERRAMENTO'
            : 'ALTERACAO_STATUS',
        campo: 'status',
        valorAnterior: chamado.status,
        valorNovo: status,
        observacao: observacao?.trim() || null
      }]
    );
  }

  private async updateChamadoWithHistory(
    chamado: ChamadoRecord,
    user: JwtPayload,
    data: Record<string, unknown>,
    historico: Array<{
      evento: string;
      campo?: string | null;
      valorAnterior?: string | null;
      valorNovo?: string | null;
      observacao?: string | null;
    }>
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const db = tx as never as { chamado: { update: Function }; chamadoHistorico: { create: Function } };

      await db.chamado.update({
        where: { id: chamado.id },
        data
      });

      for (const item of historico) {
        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId: chamado.empresaId,
            usuarioId: user.sub,
            evento: item.evento,
            campo: item.campo ?? null,
            valorAnterior: item.valorAnterior ?? null,
            valorNovo: item.valorNovo ?? null,
            observacao: item.observacao ?? null
          }
        });
      }
    });
  }

  private assertTransition(current: string, next: string): void {
    if (current === next) {
      return;
    }

    const allowed = GENERAL_STATUS_TRANSITIONS[current] ?? [];

    if (!allowed.includes(next)) {
      throw new BadRequestException(`Transicao de status invalida: ${current} -> ${next}.`);
    }
  }

  private async assertCanViewChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (chamado.solicitanteId === user.sub) {
      await this.assertFeatureAction(user, FEATURES.meus, 'visualizar');
      return;
    }

    await this.assertFeatureAction(user, FEATURES.painel, 'visualizar_fila');
  }

  private async assertCanRespondChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (chamado.solicitanteId === user.sub && await this.canFeatureAction(user, FEATURES.meus, 'responder_proprio_chamado')) {
      return;
    }

    await this.assertFeatureAction(user, FEATURES.painel, 'responder_chamado');
  }

  private async canUseAnyChamadosFeature(user: JwtPayload): Promise<boolean> {
    const candidates: Array<[string, string]> = [
      [FEATURES.abrir, 'visualizar'],
      [FEATURES.abrir, 'incluir'],
      [FEATURES.meus, 'visualizar'],
      [FEATURES.painel, 'visualizar_fila'],
      [FEATURES.categorias, 'visualizar']
    ];

    for (const [feature, action] of candidates) {
      if (await this.canFeatureAction(user, feature, action)) {
        return true;
      }
    }

    return false;
  }

  private async canFeatureAction(user: JwtPayload, featureSlug: string, action: string): Promise<boolean> {
    try {
      await this.assertFeatureAction(user, featureSlug, action);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return false;
      }

      throw error;
    }
  }

  private async assertFeatureAction(user: JwtPayload, featureSlug: string, action: string): Promise<void> {
    if (this.isSystemAdmin(user) || this.hasFullAccessGroup(user.grupo)) {
      return;
    }

    const navigation = await this.solucoesService.myHubNavigation(user);
    const solution = navigation.find((item) => item.slug === SOLUTION_SLUG);
    const feature = solution?.funcionalidades.find((item) => item.slug === featureSlug);

    if (!solution || !feature || feature.podeVisualizar === false) {
      throw new ForbiddenException('Usuario sem permissao para acessar esta funcionalidade.');
    }

    const requestedAction = this.normalizeActionIdentifier(action);
    const dynamicAction = feature.acoes.find((item) =>
      this.normalizeActionIdentifier(item.chave) === requestedAction ||
      this.normalizeActionIdentifier(item.configuracao ?? '') === requestedAction
    );

    if (dynamicAction) {
      if (!dynamicAction.permitido) {
        throw new ForbiddenException('Usuario sem permissao para executar esta acao.');
      }

      return;
    }

    const legacyPermission = {
      visualizar: feature.podeVisualizar,
      incluir: feature.podeIncluir,
      alterar: feature.podeAlterar,
      excluir: feature.podeExcluir
    }[action];

    if (!legacyPermission) {
      throw new ForbiddenException('Usuario sem permissao para executar esta acao.');
    }
  }

  private assertCompanyContext(user: JwtPayload): number {
    if (!user?.empresaId) {
      throw new ForbiddenException('Selecione uma empresa para acessar o controle de chamados.');
    }

    return user.empresaId;
  }

  private normalizeActionIdentifier(value?: string | null): string {
    return (value ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private normalizeValue<T extends readonly string[]>(
    value: string | null | undefined,
    allowed: T,
    fallback: T[number] | undefined,
    fieldName: string
  ): T[number] {
    const normalized = (value || fallback || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') as T[number];

    if (!allowed.includes(normalized)) {
      throw new BadRequestException(`Valor invalido para ${fieldName}.`);
    }

    return normalized;
  }

  private requiredText(value: string, fieldName: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(`Preencha ${fieldName}.`);
    }

    return normalized;
  }

  private isSystemAdmin(user?: { login?: string | null } | null): boolean {
    return user?.login?.toLowerCase() === 'admin';
  }

  private hasFullAccessGroup(grupo?: {
    acessoEcommerce?: boolean | null;
    acessoProjetos?: boolean | null;
    acessoHoras?: boolean | null;
    acessoConfigurador?: boolean | null;
  } | null): boolean {
    return !!(
      grupo?.acessoEcommerce &&
      grupo.acessoProjetos &&
      grupo.acessoHoras &&
      grupo.acessoConfigurador
    );
  }

  private toChamadoType(chamado: ChamadoRecord): ChamadoType {
    return {
      id: chamado.id,
      numero: chamado.numero,
      empresaId: chamado.empresaId,
      solicitanteId: chamado.solicitanteId,
      solicitanteNome: this.usuarioLabel(chamado.solicitante),
      responsavelId: chamado.responsavelId ?? null,
      responsavelNome: this.usuarioLabel(chamado.responsavel),
      categoriaId: chamado.categoriaId ?? null,
      categoriaNome: chamado.categoria?.nome ?? null,
      titulo: chamado.titulo,
      descricao: chamado.descricao,
      tipo: chamado.tipo,
      prioridade: chamado.prioridade,
      status: chamado.status,
      criadoEm: chamado.criadoEm,
      atualizadoEm: chamado.atualizadoEm,
      primeiraRespostaEm: chamado.primeiraRespostaEm ?? null,
      resolvidoEm: chamado.resolvidoEm ?? null,
      encerradoEm: chamado.encerradoEm ?? null,
      versao: chamado.versao,
      mensagens: (chamado.mensagens ?? []).map((mensagem) => this.toMensagemType(mensagem)),
      historico: (chamado.historico ?? []).map((historico) => this.toHistoricoType(historico))
    };
  }

  private toMensagemType(mensagem: ChamadoMensagemRecord): ChamadoMensagemType {
    return {
      id: mensagem.id,
      chamadoId: mensagem.chamadoId,
      autorId: mensagem.autorId,
      autorNome: this.usuarioLabel(mensagem.autor),
      tipo: mensagem.tipo,
      conteudo: mensagem.conteudo,
      criadoEm: mensagem.criadoEm
    };
  }

  private toHistoricoType(historico: ChamadoHistoricoRecord): ChamadoHistoricoType {
    return {
      id: historico.id,
      chamadoId: historico.chamadoId,
      usuarioId: historico.usuarioId ?? null,
      usuarioNome: this.usuarioLabel(historico.usuario),
      evento: historico.evento,
      campo: historico.campo ?? null,
      valorAnterior: historico.valorAnterior ?? null,
      valorNovo: historico.valorNovo ?? null,
      observacao: historico.observacao ?? null,
      criadoEm: historico.criadoEm
    };
  }

  private toCategoriaType(categoria: ChamadoCategoriaRecord): ChamadoCategoriaType {
    return {
      id: categoria.id,
      empresaId: categoria.empresaId,
      nome: categoria.nome,
      descricao: categoria.descricao ?? null,
      ativo: categoria.ativo,
      criadoEm: categoria.criadoEm,
      atualizadoEm: categoria.atualizadoEm
    };
  }

  private usuarioLabel(usuario?: UsuarioResumoRecord | null): string | null {
    if (!usuario) {
      return null;
    }

    return usuario.nome || usuario.login || usuario.email;
  }
}
