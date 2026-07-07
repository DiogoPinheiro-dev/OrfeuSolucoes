import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { extname } from 'node:path';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { SolucoesService } from '../solucoes/solucoes.service';
import { ChamadoAnexoStorageService } from './chamado-anexo-storage.service';
import { AlterarPrioridadeChamadoInput } from './dto/alterar-prioridade-chamado.input';
import { AlterarStatusChamadoInput } from './dto/alterar-status-chamado.input';
import { AtribuirChamadoInput } from './dto/atribuir-chamado.input';
import { AtendenteChamadoType } from './dto/atendente-chamado.type';
import { AtualizarChamadoAcompanhantesInput } from './dto/chamado-acompanhante.input';
import { ChamadoAcompanhanteType } from './dto/chamado-acompanhante.type';
import { ChamadoAnexoType } from './dto/chamado-anexo.type';
import { ChamadoCategoriaType } from './dto/chamado-categoria.type';
import { CreateChamadoPrioridadeInput, UpdateChamadoPrioridadeInput } from './dto/chamado-prioridade.input';
import { ChamadoPrioridadeType } from './dto/chamado-prioridade.type';
import { CreateChamadoTipoInput, UpdateChamadoTipoInput } from './dto/chamado-tipo.input';
import { ChamadoTipoType } from './dto/chamado-tipo.type';
import { CreateChamadoCategoriaInput, UpdateChamadoCategoriaInput } from './dto/chamado-categoria.input';
import { CreateChamadoResponsavelInput, UpdateChamadoResponsavelInput } from './dto/chamado-responsavel.input';
import { ChamadoFiltroInput } from './dto/chamado-filtro.input';
import { ChamadoResponsavelOptionsType, ChamadoResponsavelType, ChamadoResponsavelUsuarioOptionType } from './dto/chamado-responsavel.type';
import { ChamadoHistoricoType, ChamadoMensagemType, ChamadoPageType, ChamadoType } from './dto/chamado.type';
import { CriarChamadoInput } from './dto/criar-chamado.input';
import { ResponderChamadoInput } from './dto/responder-chamado.input';

const SOLUTION_SLUG = 'controle-de-chamados';

const FEATURES = {
  abrir: 'abrir-chamado',
  meus: 'meus-chamados',
  painel: 'painel-atendimento',
  arquivados: 'chamados-arquivados',
  categorias: 'categorias',
  tipos: 'tipos',
  prioridades: 'prioridades',
  responsaveis: 'responsaveis'
} as const;

const STATUS = ['ABERTO', 'EM_TRIAGEM', 'EM_ATENDIMENTO', 'PENDENTE', 'RESOLVIDO', 'ARQUIVADO'] as const;

const MAX_ANEXO_FILES = 5;
const MAX_ANEXO_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_ANEXO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]);
const ALLOWED_ANEXO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.txt']);

const OPEN_STATUSES = ['ABERTO', 'EM_TRIAGEM', 'EM_ATENDIMENTO', 'PENDENTE'] as const;
const TERMINAL_STATUSES = ['RESOLVIDO', 'ARQUIVADO'] as const;
const CLOSED_STATUSES = ['ARQUIVADO'] as const;
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

type GrupoResumoRecord = {
  id: number;
  nome: string;
  descricao?: string | null;
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

type ChamadoConfiguracaoRecord = {
  id: number;
  empresaId: number;
  nome: string;
  descricao?: string | null;
  cor?: string | null;
  ordem: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};


type ChamadoResponsavelFuncionalidadeRecord = {
  id: number;
  responsavelSolucaoId: number;
  funcionalidadeId: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  funcionalidade?: { id: number; titulo: string; label?: string | null; slug: string } | null;
};

type ChamadoResponsavelSolucaoRecord = {
  id: number;
  responsavelId: number;
  solucaoId: number;
  responsavelGeral: boolean;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  solucao?: { id: number; nome: string; slug: string } | null;
  funcionalidades?: ChamadoResponsavelFuncionalidadeRecord[];
};

type ChamadoResponsavelRecord = {
  id: number;
  empresaId: number;
  tipo: string;
  usuarioId?: string | null;
  grupoId?: number | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  usuario?: UsuarioResumoRecord | null;
  grupo?: GrupoResumoRecord | null;
  solucoes?: ChamadoResponsavelSolucaoRecord[];
};

type ResponsavelSolucaoPayload = {
  solucaoId: number;
  responsavelGeral: boolean;
  funcionalidadeIds: number[];
};

type ResponsavelAlvoPayload = {
  tipo: 'USUARIO' | 'GRUPO';
  usuarioId: string | null;
  grupoId: number | null;
};

type ResponsavelAberturaPayload = {
  responsavelId: string | null;
  responsavelGrupoId: number | null;
};

export type ChamadoUploadFile = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
};

type ChamadoAnexoRecord = {
  id: string;
  chamadoId: string;
  empresaId: number;
  autorId: string;
  mensagemId?: string | null;
  nomeOriginal: string;
  nomeArquivo: string;
  caminho: string;
  mimeType: string;
  tamanho: number;
  criadoEm: Date;
  autor?: UsuarioResumoRecord | null;
};

type ChamadoAcompanhanteRecord = {
  id: string;
  chamadoId: string;
  empresaId: number;
  usuarioId: string;
  adicionadoPorId?: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  usuario?: UsuarioResumoRecord | null;
  adicionadoPor?: UsuarioResumoRecord | null;
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
  anexos?: ChamadoAnexoRecord[];
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
  responsavelGrupoId?: number | null;
  liderAtendimentoId?: string | null;
  atendimentoAssumidoEm?: Date | null;
  categoriaId?: number | null;
  solucaoId?: number | null;
  funcionalidadeId?: number | null;
  titulo: string;
  descricao: string;
  tipoId: number;
  prioridadeId: number;
  status: string;
  criadoEm: Date;
  atualizadoEm: Date;
  primeiraRespostaEm?: Date | null;
  resolvidoEm?: Date | null;
  encerradoEm?: Date | null;
  versao: number;
  solicitante?: UsuarioResumoRecord | null;
  responsavel?: UsuarioResumoRecord | null;
  responsavelGrupo?: GrupoResumoRecord | null;
  liderAtendimento?: UsuarioResumoRecord | null;
  categoria?: ChamadoCategoriaRecord | null;
  tipoConfiguracao?: ChamadoConfiguracaoRecord | null;
  prioridadeConfiguracao?: ChamadoConfiguracaoRecord | null;
  solucao?: { id: number; nome: string; slug: string } | null;
  funcionalidade?: { id: number; titulo: string; label?: string | null; slug: string } | null;
  mensagens?: ChamadoMensagemRecord[];
  historico?: ChamadoHistoricoRecord[];
  anexos?: ChamadoAnexoRecord[];
  acompanhantes?: ChamadoAcompanhanteRecord[];
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
  responsavelGrupo: { select: { id: true, nome: true, descricao: true } },
  liderAtendimento: { select: usuarioResumoSelect },
  categoria: true,
  solucao: { select: { id: true, nome: true, slug: true } },
  funcionalidade: { select: { id: true, titulo: true, label: true, slug: true } },
  tipoConfiguracao: true,
  prioridadeConfiguracao: true,
  acompanhantes: {
    where: { ativo: true },
    include: {
      usuario: { select: usuarioResumoSelect },
      adicionadoPor: { select: usuarioResumoSelect }
    },
    orderBy: { criadoEm: 'asc' as const }
  }
};

const chamadoDetailInclude = {
  ...chamadoSummaryInclude,
  mensagens: {
    include: {
      autor: { select: usuarioResumoSelect },
      anexos: {
        include: { autor: { select: usuarioResumoSelect } },
        orderBy: { criadoEm: 'asc' }
      }
    },
    orderBy: { criadoEm: 'asc' }
  },
  anexos: {
    where: { mensagemId: null },
    include: { autor: { select: usuarioResumoSelect } },
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
    private readonly solucoesService: SolucoesService,
    private readonly anexoStorage: ChamadoAnexoStorageService
  ) {}

  async meusChamados(user: JwtPayload, filtro?: ChamadoFiltroInput | null): Promise<ChamadoPageType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.meus, 'visualizar');

    return this.findChamadosPage(empresaId, filtro, {
      NOT: { status: { in: [...CLOSED_STATUSES] } },
      OR: [
        { solicitanteId: user.sub },
        { acompanhantes: { some: { usuarioId: user.sub, ativo: true } } }
      ]
    });
  }

  async filaChamados(user: JwtPayload, filtro?: ChamadoFiltroInput | null): Promise<ChamadoPageType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'visualizar_fila');

    return this.findChamadosPage(empresaId, filtro, { NOT: { status: { in: [...CLOSED_STATUSES] } } });
  }

  async chamadosArquivados(user: JwtPayload, filtro?: ChamadoFiltroInput | null): Promise<ChamadoPageType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.arquivados, 'visualizar');

    const archivedFiltro = filtro ? { ...filtro, status: null } : { status: null };

    return this.findChamadosPage(empresaId, archivedFiltro, { status: 'ARQUIVADO' });
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
    await this.ensureDefaultChamadoConfiguracoes(empresaId);

    const tipo = await this.ensureTipoChamado(empresaId, input.tipoId);
    const prioridade = await this.ensurePrioridadeChamado(empresaId, input.prioridadeId);
    const titulo = this.requiredText(input.titulo, 'titulo');
    const descricao = this.requiredText(input.descricao, 'descricao');
    const contexto = await this.resolveChamadoContext(input.solucaoId, input.funcionalidadeId ?? null);
    const responsavelAbertura = await this.resolveResponsavelAbertura(
      empresaId,
      contexto.solucaoId,
      contexto.funcionalidadeId,
      input.responsavelId ?? null,
      input.responsavelGrupoId ?? null
    );
    const acompanhantesAbertura = await this.resolveAcompanhantesPayload(
      empresaId,
      input.acompanhanteIds ?? [],
      {
        solicitanteId: user.sub,
        responsavelId: responsavelAbertura.responsavelId
      }
    );

    if (input.categoriaId) {
      await this.ensureCategoria(input.categoriaId, empresaId, true);
    }

    const created = (await this.prisma.$transaction(async (tx) => {
      const db = tx as never as {
        chamadoSequencia: { upsert: Function };
        chamado: { create: Function };
        chamadoHistorico: { create: Function };
        chamadoAcompanhante: { createMany: Function };
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
          solucaoId: contexto.solucaoId,
          funcionalidadeId: contexto.funcionalidadeId,
          responsavelId: responsavelAbertura.responsavelId,
          responsavelGrupoId: responsavelAbertura.responsavelGrupoId,
          titulo,
          descricao,
          tipoId: tipo.id,
          prioridadeId: prioridade.id,
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
          observacao: responsavelAbertura.responsavelId || responsavelAbertura.responsavelGrupoId ? 'Chamado aberto pelo solicitante com responsavel selecionado.' : 'Chamado aberto pelo solicitante.'
        }
      });

      if (acompanhantesAbertura.length) {
        await db.chamadoAcompanhante.createMany({
          data: acompanhantesAbertura.map((acompanhante) => ({
            chamadoId: chamado.id,
            empresaId,
            usuarioId: acompanhante.id,
            adicionadoPorId: user.sub,
            ativo: true
          }))
        });

        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId,
            usuarioId: user.sub,
            evento: 'ACOMPANHANTES',
            campo: 'acompanhantes',
            valorNovo: acompanhantesAbertura.map((acompanhante) => this.usuarioLabel(acompanhante)).filter(Boolean).join(', '),
            observacao: 'Acompanhantes adicionados na abertura do chamado.'
          }
        });
      }

      return chamado;
    })) as ChamadoRecord;

    return this.chamado(created.id, user);
  }

  async responderChamado(input: ResponderChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    const chamado = await this.findChamadoRecordOrThrow(input.chamadoId, empresaId);

    await this.assertCanRespondChamado(user, chamado);

    if (this.isClosedStatus(chamado.status)) {
      throw new BadRequestException('Chamados arquivados precisam ser reabertos antes de receber novas respostas.');
    }

    const conteudo = this.requiredText(input.conteudo, 'conteudo');
    const isAcompanhante = await this.isAcompanhanteAtivo(chamado.id, user.sub);
    const isAtendente = chamado.solicitanteId !== user.sub && !isAcompanhante;
    const shouldMarkFirstResponse = isAtendente && !chamado.primeiraRespostaEm;
    const shouldMoveToAttendance = isAtendente && ['ABERTO', 'EM_TRIAGEM'].includes(chamado.status);
    const nextStatus = shouldMoveToAttendance ? 'EM_ATENDIMENTO' : chamado.status;
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const db = tx as never as {
        chamadoMensagem: { create: Function };
        chamado: { update: Function };
        chamadoHistorico: { create: Function };
        chamadoAcompanhante: { createMany: Function };
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



  async adicionarAnexos(
    chamadoId: string,
    files: ChamadoUploadFile[],
    user: JwtPayload,
    mensagemId?: string | null
  ): Promise<ChamadoAnexoType[]> {
    const empresaId = this.assertCompanyContext(user);
    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);

    await this.assertCanAttachFiles(user, chamado);

    if (this.isClosedStatus(chamado.status)) {
      throw new BadRequestException('Chamados arquivados precisam ser reabertos antes de receber anexos.');
    }

    if (!files?.length) {
      throw new BadRequestException('Selecione ao menos um arquivo para anexar.');
    }

    if (files.length > MAX_ANEXO_FILES) {
      throw new BadRequestException(`Informe no maximo ${MAX_ANEXO_FILES} anexos por envio.`);
    }

    const normalizedMensagemId = mensagemId?.trim() || null;

    if (normalizedMensagemId) {
      const mensagem = await (this.prisma as never as { chamadoMensagem: { findFirst: Function } }).chamadoMensagem.findFirst({
        where: { id: normalizedMensagemId, chamadoId: chamado.id, empresaId },
        select: { id: true }
      });

      if (!mensagem) {
        throw new BadRequestException('Mensagem do chamado nao encontrada para vincular o anexo.');
      }
    }

    const created: ChamadoAnexoRecord[] = [];

    for (const file of files) {
      this.validateAnexoFile(file);
      const saved = await this.anexoStorage.save(chamado.id, file);
      const anexo = await (this.prisma as never as { chamadoAnexo: { create: Function } }).chamadoAnexo.create({
        data: {
          chamadoId: chamado.id,
          empresaId,
          autorId: user.sub,
          mensagemId: normalizedMensagemId,
          nomeOriginal: saved.nomeOriginal,
          nomeArquivo: saved.nomeArquivo,
          caminho: saved.caminho,
          mimeType: saved.mimeType,
          tamanho: saved.tamanho
        },
        include: { autor: { select: usuarioResumoSelect } }
      });

      created.push(anexo as ChamadoAnexoRecord);
    }

    await this.prisma.chamado.update({
      where: { id: chamado.id },
      data: { versao: { increment: 1 } }
    });

    await this.prisma.chamadoHistorico.create({
      data: {
        chamadoId: chamado.id,
        empresaId,
        usuarioId: user.sub,
        evento: 'ANEXO',
        observacao: `${created.length} anexo(s) adicionado(s).`
      }
    });

    return created.map((anexo) => this.toAnexoType(anexo));
  }

  async prepararDownloadAnexo(chamadoId: string, anexoId: string, user: JwtPayload): Promise<{
    caminhoAbsoluto: string;
    nomeOriginal: string;
    mimeType: string;
  }> {
    const empresaId = this.assertCompanyContext(user);
    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);

    await this.assertCanViewChamado(user, chamado);

    const anexo = await (this.prisma as never as { chamadoAnexo: { findFirst: Function } }).chamadoAnexo.findFirst({
      where: { id: anexoId, chamadoId: chamado.id, empresaId },
      include: { autor: { select: usuarioResumoSelect } }
    }) as ChamadoAnexoRecord | null;

    if (!anexo) {
      throw new NotFoundException('Anexo nao encontrado.');
    }

    const caminhoAbsoluto = this.anexoStorage.resolve(anexo.caminho);

    if (!existsSync(caminhoAbsoluto)) {
      throw new NotFoundException('Arquivo do anexo nao encontrado no armazenamento.');
    }

    return {
      caminhoAbsoluto,
      nomeOriginal: anexo.nomeOriginal,
      mimeType: anexo.mimeType
    };
  }

  async assumirChamado(chamadoId: string, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'assumir_chamado');

    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);
    const nextStatus = OPEN_STATUSES.includes(chamado.status as never) && chamado.status !== 'EM_ATENDIMENTO'
      ? 'EM_ATENDIMENTO'
      : chamado.status;
    const usuarioNome = user.nome || user.login || user.email;

    if (this.isTerminalStatus(chamado.status)) {
      throw new BadRequestException('Chamados resolvidos ou arquivados nao podem ser assumidos sem reabertura.');
    }

    if (chamado.liderAtendimentoId && chamado.liderAtendimentoId !== user.sub) {
      throw new BadRequestException(`Este chamado ja esta em atendimento por ${this.usuarioLabel(chamado.liderAtendimento) || 'outro usuario'}.`);
    }

    if (chamado.responsavelGrupoId) {
      await this.ensureUsuarioPertenceAoGrupoNaEmpresa(user.sub, empresaId, chamado.responsavelGrupoId);
      const liderAnteriorNome = this.usuarioLabel(chamado.liderAtendimento);

      await this.updateChamadoWithHistory(
        chamado,
        user,
        {
          liderAtendimentoId: user.sub,
          atendimentoAssumidoEm: chamado.liderAtendimentoId === user.sub ? chamado.atendimentoAssumidoEm ?? new Date() : new Date(),
          status: nextStatus,
          versao: { increment: 1 }
        },
        [
          {
            evento: 'LIDERANCA_ATENDIMENTO',
            campo: 'liderAtendimento',
            valorAnterior: liderAnteriorNome,
            valorNovo: usuarioNome,
            observacao: `Atendimento assumido pelo usuario dentro do grupo ${chamado.responsavelGrupo?.nome || 'responsavel'}.`
          },
          ...(nextStatus !== chamado.status
            ? [{
                evento: 'ALTERACAO_STATUS',
                campo: 'status',
                valorAnterior: chamado.status,
                valorNovo: nextStatus
              }]
            : [])
        ]
      );

      return this.chamado(chamado.id, user);
    }

    const responsavelAnteriorNome = this.usuarioLabel(chamado.responsavel);

    await this.prisma.$transaction(async (tx) => {
      const db = tx as never as { chamado: { update: Function }; chamadoHistorico: { create: Function } };

      await db.chamado.update({
        where: { id: chamado.id },
        data: {
          responsavelId: user.sub,
          responsavelGrupoId: null,
          liderAtendimentoId: null,
          atendimentoAssumidoEm: null,
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
          valorNovo: usuarioNome,
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

  async liberarAtendimentoChamado(chamadoId: string, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'assumir_chamado');

    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);

    if (!chamado.liderAtendimentoId) {
      throw new BadRequestException('Este chamado nao possui atendimento assumido.');
    }

    if (chamado.liderAtendimentoId !== user.sub && !this.isSystemAdmin(user)) {
      throw new ForbiddenException('Apenas o lider atual do atendimento pode liberar este chamado.');
    }

    await this.updateChamadoWithHistory(
      chamado,
      user,
      {
        liderAtendimentoId: null,
        atendimentoAssumidoEm: null,
        versao: { increment: 1 }
      },
      [{
        evento: 'LIBERACAO_ATENDIMENTO',
        campo: 'liderAtendimento',
        valorAnterior: this.usuarioLabel(chamado.liderAtendimento),
        valorNovo: null,
        observacao: chamado.responsavelGrupoId
          ? `Atendimento liberado para o grupo ${chamado.responsavelGrupo?.nome || 'responsavel'}.`
          : 'Atendimento liberado.'
      }]
    );

    return this.chamado(chamado.id, user);
  }

  async atribuirChamado(input: AtribuirChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    return this.alterarResponsavelChamado(input, user, 'atribuir_chamado', 'ATRIBUICAO', 'Responsavel alterado.', 'Responsavel removido.');
  }

  async transferirChamado(input: AtribuirChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    return this.alterarResponsavelChamado(input, user, 'transferir_chamado', 'TRANSFERENCIA', 'Chamado transferido.', 'Transferencia removida.');
  }

  private async alterarResponsavelChamado(
    input: AtribuirChamadoInput,
    user: JwtPayload,
    requiredAction: string,
    evento: string,
    observacaoAlteracao: string,
    observacaoRemocao: string
  ): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, requiredAction);

    const chamado = await this.findChamadoRecordOrThrow(input.chamadoId, empresaId);
    const responsavelId = input.responsavelId?.trim() || null;
    const responsavelGrupoId = input.responsavelGrupoId ? Number(input.responsavelGrupoId) : null;

    if (responsavelId && responsavelGrupoId) {
      throw new BadRequestException('Selecione apenas um responsavel para o chamado.');
    }

    let novoResponsavelUsuario: UsuarioResumoRecord | null = null;
    let novoResponsavelGrupo: GrupoResumoRecord | null = null;

    if (responsavelId) {
      novoResponsavelUsuario = await this.ensureUserBelongsToCompany(responsavelId, empresaId);
    }

    if (responsavelGrupoId) {
      await this.ensureGrupoElegivelResponsavel(responsavelGrupoId, empresaId);
      novoResponsavelGrupo = await this.ensureGrupoResponsavel(responsavelGrupoId);
    }

    const responsavelAnteriorNome = this.chamadoResponsavelLabel(chamado);
    const novoResponsavelNome = novoResponsavelUsuario
      ? this.usuarioLabel(novoResponsavelUsuario)
      : novoResponsavelGrupo?.nome ?? null;

    if (this.isTerminalStatus(chamado.status)) {
      throw new BadRequestException('Reabra o chamado antes de alterar o responsavel.');
    }

    const hasResponsavel = !!responsavelId || !!responsavelGrupoId;
    const nextStatus = hasResponsavel && ['ABERTO', 'EM_TRIAGEM'].includes(chamado.status)
      ? 'EM_ATENDIMENTO'
      : chamado.status;

    await this.updateChamadoWithHistory(
      chamado,
      user,
      {
        responsavelId,
        responsavelGrupoId,
        liderAtendimentoId: null,
        atendimentoAssumidoEm: null,
        status: nextStatus,
        versao: { increment: 1 }
      },
      [
        {
          evento,
          campo: 'responsavel',
          valorAnterior: responsavelAnteriorNome,
          valorNovo: novoResponsavelNome,
          observacao: hasResponsavel ? observacaoAlteracao : observacaoRemocao
        },
        ...(chamado.liderAtendimentoId
          ? [{
              evento: 'LIBERACAO_ATENDIMENTO',
              campo: 'liderAtendimento',
              valorAnterior: this.usuarioLabel(chamado.liderAtendimento),
              valorNovo: null,
              observacao: 'Lideranca temporaria liberada apos alteracao do responsavel.'
            }]
          : []),
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

    if (responsavelId) {
      await this.desativarAcompanhantesDoChamado(chamado, user, [responsavelId], 'Responsavel removido da lista de acompanhantes.');
    }

    return this.chamado(chamado.id, user);
  }

  async alterarStatusChamado(input: AlterarStatusChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'alterar_status');

    const chamado = await this.findChamadoRecordOrThrow(input.chamadoId, empresaId);
    const status = this.normalizeValue(input.status, STATUS, undefined, 'status');

    if (this.isTerminalStatus(status)) {
      throw new BadRequestException('Use as acoes especificas para resolver, encerrar ou arquivar chamados.');
    }

    this.assertTransition(chamado.status, status);

    await this.updateStatus(chamado, user, status, input.observacao ?? null);

    return this.chamado(chamado.id, user);
  }

  async alterarPrioridadeChamado(input: AlterarPrioridadeChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'alterar_prioridade');

    const chamado = await this.findChamadoRecordOrThrow(input.chamadoId, empresaId);
    const prioridade = await this.ensurePrioridadeChamado(empresaId, input.prioridadeId);

    if (prioridade.id === chamado.prioridadeId) {
      return this.chamado(chamado.id, user);
    }

    await this.updateChamadoWithHistory(
      chamado,
      user,
      {
        prioridadeId: prioridade.id,
        versao: { increment: 1 }
      },
      [{
        evento: 'ALTERACAO_PRIORIDADE',
        campo: 'prioridade',
        valorAnterior: chamado.prioridadeConfiguracao?.nome ?? null,
        valorNovo: prioridade.nome
      }]
    );

    return this.chamado(chamado.id, user);
  }

  async resolverChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'resolver_chamado');

    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);

    if (this.isClosedStatus(chamado.status)) {
      throw new BadRequestException('Chamado arquivado nao pode ser resolvido novamente.');
    }

    if (chamado.status !== 'RESOLVIDO') {
      await this.updateStatus(chamado, user, 'RESOLVIDO', observacao ?? null, { resolvidoEm: new Date(), liderAtendimentoId: null, atendimentoAssumidoEm: null });
    }

    return this.chamado(chamado.id, user);
  }

  async encerrarChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'encerrar_chamado');

    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);

    await this.assertUsuarioResponsavelPeloChamado(user, chamado);

    if (chamado.status !== 'RESOLVIDO') {
      throw new BadRequestException('Apenas chamados resolvidos podem ser arquivados.');
    }

    await this.updateStatus(chamado, user, 'ARQUIVADO', observacao ?? null, { encerradoEm: new Date(), liderAtendimentoId: null, atendimentoAssumidoEm: null });

    return this.chamado(chamado.id, user);
  }

  async arquivarChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);

    await this.assertCanArchiveChamado(user, chamado);

    if (chamado.status === 'ARQUIVADO') {
      return this.chamado(chamado.id, user);
    }

    await this.updateStatus(chamado, user, 'ARQUIVADO', observacao ?? 'Chamado arquivado.', {
      encerradoEm: chamado.encerradoEm ?? new Date(),
      liderAtendimentoId: null,
      atendimentoAssumidoEm: null
    });

    return this.chamado(chamado.id, user);
  }

  async reabrirChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    const chamado = await this.findChamadoRecordOrThrow(chamadoId, empresaId);

    if (this.isClosedStatus(chamado.status)) {
      this.assertCanUnarchiveChamado(user);
      await this.assertFeatureAction(user, FEATURES.arquivados, 'reabrir_chamado');
    } else if (chamado.solicitanteId === user.sub && chamado.status === 'RESOLVIDO') {
      await this.assertFeatureAction(user, FEATURES.meus, 'reabrir_proprio_chamado');
    } else {
      await this.assertFeatureAction(user, FEATURES.painel, 'reabrir_chamado');
    }

    if (!this.isTerminalStatus(chamado.status)) {
      throw new BadRequestException('Apenas chamados resolvidos ou arquivados podem ser reabertos.');
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


  async responsaveisChamado(user: JwtPayload, ativas = false): Promise<ChamadoResponsavelType[]> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.responsaveis, 'visualizar');

    const responsaveis = (await this.prisma.chamadoResponsavel.findMany({
      where: {
        empresaId,
        ...(ativas ? { ativo: true } : {})
      },
      include: this.responsavelInclude(),
      orderBy: [{ ativo: 'desc' }, { atualizadoEm: 'desc' }]
    })) as ChamadoResponsavelRecord[];

    return responsaveis
      .map((responsavel) => this.toResponsavelType(responsavel))
      .sort((a, b) => (a.responsavelNome || '').localeCompare(b.responsavelNome || ''));
  }

  async responsaveisFiltroChamado(user: JwtPayload): Promise<ChamadoResponsavelType[]> {
    const empresaId = this.assertCompanyContext(user);

    if (!(await this.canUseAnyChamadosFeature(user))) {
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
      .map((responsavel) => this.toResponsavelType(responsavel))
      .sort((a, b) => (a.responsavelNome || '').localeCompare(b.responsavelNome || ''));
  }
  async responsaveisChamadoOptions(user: JwtPayload): Promise<ChamadoResponsavelOptionsType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.responsaveis, 'visualizar');

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
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.responsaveis, 'incluir');
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

    return this.toResponsavelType(created);
  }

  async updateResponsavel(input: UpdateChamadoResponsavelInput, user: JwtPayload): Promise<ChamadoResponsavelType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.responsaveis, 'alterar');
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
      : this.responsavelRecordToPayload(current);

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

    return this.toResponsavelType(updated);
  }

  async deleteResponsavel(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.responsaveis, 'excluir');
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
  async tiposChamado(user: JwtPayload, ativas = true): Promise<ChamadoTipoType[]> {
    const empresaId = this.assertCompanyContext(user);

    if (!(await this.canUseAnyChamadosFeature(user))) {
      throw new ForbiddenException('Usuario sem acesso ao controle de chamados.');
    }

    await this.ensureDefaultChamadoConfiguracoes(empresaId);

    const tipos = (await (this.prisma as never as { chamadoTipo: { findMany: Function } }).chamadoTipo.findMany({
      where: { empresaId, ...(ativas ? { ativo: true } : {}) },
      orderBy: [{ ativo: 'desc' }, { ordem: 'asc' }, { nome: 'asc' }]
    })) as ChamadoConfiguracaoRecord[];

    return tipos.map((tipo) => this.toTipoType(tipo));
  }

  async createTipo(input: CreateChamadoTipoInput, user: JwtPayload): Promise<ChamadoTipoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.tipos, 'incluir');
    const created = (await (this.prisma as never as { chamadoTipo: { create: Function } }).chamadoTipo.create({ data: this.buildConfiguracaoData(empresaId, input) })) as ChamadoConfiguracaoRecord;
    return this.toTipoType(created);
  }

  async updateTipo(input: UpdateChamadoTipoInput, user: JwtPayload): Promise<ChamadoTipoType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.tipos, 'alterar');
    await this.ensureTipoRecord(input.id, empresaId);
    const updated = (await (this.prisma as never as { chamadoTipo: { update: Function } }).chamadoTipo.update({ where: { id: input.id }, data: this.buildConfiguracaoUpdateData(input) })) as ChamadoConfiguracaoRecord;
    return this.toTipoType(updated);
  }

  async deleteTipo(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.tipos, 'excluir');
    await this.ensureTipoRecord(id, empresaId);
    await (this.prisma as never as { chamadoTipo: { update: Function } }).chamadoTipo.update({ where: { id }, data: { ativo: false } });
    return true;
  }

  async prioridadesChamado(user: JwtPayload, ativas = true): Promise<ChamadoPrioridadeType[]> {
    const empresaId = this.assertCompanyContext(user);

    if (!(await this.canUseAnyChamadosFeature(user))) {
      throw new ForbiddenException('Usuario sem acesso ao controle de chamados.');
    }

    await this.ensureDefaultChamadoConfiguracoes(empresaId);

    const prioridades = (await (this.prisma as never as { chamadoPrioridade: { findMany: Function } }).chamadoPrioridade.findMany({
      where: { empresaId, ...(ativas ? { ativo: true } : {}) },
      orderBy: [{ ativo: 'desc' }, { ordem: 'asc' }, { nome: 'asc' }]
    })) as ChamadoConfiguracaoRecord[];

    return prioridades.map((prioridade) => this.toPrioridadeType(prioridade));
  }

  async createPrioridade(input: CreateChamadoPrioridadeInput, user: JwtPayload): Promise<ChamadoPrioridadeType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.prioridades, 'incluir');
    const created = (await (this.prisma as never as { chamadoPrioridade: { create: Function } }).chamadoPrioridade.create({ data: this.buildConfiguracaoData(empresaId, input) })) as ChamadoConfiguracaoRecord;
    return this.toPrioridadeType(created);
  }

  async updatePrioridade(input: UpdateChamadoPrioridadeInput, user: JwtPayload): Promise<ChamadoPrioridadeType> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.prioridades, 'alterar');
    await this.ensurePrioridadeRecord(input.id, empresaId);
    const updated = (await (this.prisma as never as { chamadoPrioridade: { update: Function } }).chamadoPrioridade.update({ where: { id: input.id }, data: this.buildConfiguracaoUpdateData(input) })) as ChamadoConfiguracaoRecord;
    return this.toPrioridadeType(updated);
  }

  async deletePrioridade(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.prioridades, 'excluir');
    await this.ensurePrioridadeRecord(id, empresaId);
    await (this.prisma as never as { chamadoPrioridade: { update: Function } }).chamadoPrioridade.update({ where: { id }, data: { ativo: false } });
    return true;
  }
  async atendentesDisponiveis(user: JwtPayload): Promise<AtendenteChamadoType[]> {
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.painel, 'atribuir_chamado');

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
    const empresaId = this.assertCompanyContext(user);
    await this.assertFeatureAction(user, FEATURES.abrir, 'incluir');

    return {
      usuarios: [],
      grupos: [],
      solucoes: await this.findSolucoesChamadoOptions(empresaId)
    };
  }

  async responsaveisParaAberturaChamado(user: JwtPayload, solucaoId: number, funcionalidadeId?: number | null): Promise<AtendenteChamadoType[]> {
    const empresaId = this.assertCompanyContext(user);
    const canSelectResponsavel =
      await this.canFeatureAction(user, FEATURES.abrir, 'incluir') ||
      await this.canFeatureAction(user, FEATURES.painel, 'atribuir_chamado') ||
      await this.canFeatureAction(user, FEATURES.painel, 'transferir_chamado');

    if (!canSelectResponsavel) {
      throw new ForbiddenException('Usuario sem permissao para selecionar responsaveis de chamado.');
    }

    const contexto = await this.resolveChamadoContext(solucaoId, funcionalidadeId ?? null);

    return this.findResponsaveisParaContexto(empresaId, contexto.solucaoId, contexto.funcionalidadeId);
  }

  async acompanhantesElegiveisChamado(user: JwtPayload, chamadoId?: string | null): Promise<ChamadoResponsavelUsuarioOptionType[]> {
    const empresaId = this.assertCompanyContext(user);

    if (chamadoId?.trim()) {
      const chamado = await this.findChamadoRecordOrThrow(chamadoId.trim(), empresaId);
      await this.assertCanViewChamado(user, chamado);

      return this.findUsuariosElegiveisAcompanhantes(empresaId, {
        solicitanteId: chamado.solicitanteId,
        responsavelId: chamado.responsavelId ?? null
      });
    }

    await this.assertFeatureAction(user, FEATURES.abrir, 'incluir');

    return this.findUsuariosElegiveisAcompanhantes(empresaId, {
      solicitanteId: user.sub,
      responsavelId: null
    });
  }

  async atualizarAcompanhantesChamado(input: AtualizarChamadoAcompanhantesInput, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.assertCompanyContext(user);
    const chamado = await this.findChamadoRecordOrThrow(input.chamadoId, empresaId);

    await this.assertCanManageAcompanhantes(user, chamado);

    if (this.isClosedStatus(chamado.status)) {
      throw new BadRequestException('Chamados arquivados precisam ser desarquivados antes de alterar acompanhantes.');
    }

    const acompanhantes = await this.resolveAcompanhantesPayload(empresaId, input.usuarioIds ?? [], {
      solicitanteId: chamado.solicitanteId,
      responsavelId: chamado.responsavelId ?? null
    });
    const nextIds = new Set(acompanhantes.map((acompanhante) => acompanhante.id));
    const existing = (await (this.prisma as never as { chamadoAcompanhante: { findMany: Function } }).chamadoAcompanhante.findMany({
      where: { chamadoId: chamado.id, empresaId },
      include: { usuario: { select: usuarioResumoSelect }, adicionadoPor: { select: usuarioResumoSelect } }
    })) as ChamadoAcompanhanteRecord[];
    const existingByUser = new Map(existing.map((item) => [item.usuarioId, item]));
    const active = existing.filter((item) => item.ativo);
    const toDeactivate = active.filter((item) => !nextIds.has(item.usuarioId));
    const toActivateOrCreate = acompanhantes.filter((item) => !existingByUser.get(item.id)?.ativo);
    const now = new Date();

    if (!toDeactivate.length && !toActivateOrCreate.length) {
      return this.chamado(chamado.id, user);
    }

    await this.prisma.$transaction(async (tx) => {
      const db = tx as never as {
        chamado: { update: Function };
        chamadoAcompanhante: { update: Function; updateMany: Function; create: Function };
        chamadoHistorico: { create: Function };
      };

      if (toDeactivate.length) {
        await db.chamadoAcompanhante.updateMany({
          where: { chamadoId: chamado.id, empresaId, usuarioId: { in: toDeactivate.map((item) => item.usuarioId) } },
          data: { ativo: false, atualizadoEm: now }
        });
      }

      for (const acompanhante of toActivateOrCreate) {
        const previous = existingByUser.get(acompanhante.id);

        if (previous) {
          await db.chamadoAcompanhante.update({
            where: { id: previous.id },
            data: { ativo: true, adicionadoPorId: user.sub, atualizadoEm: now }
          });
        } else {
          await db.chamadoAcompanhante.create({
            data: {
              chamadoId: chamado.id,
              empresaId,
              usuarioId: acompanhante.id,
              adicionadoPorId: user.sub,
              ativo: true
            }
          });
        }
      }

      await db.chamado.update({
        where: { id: chamado.id },
        data: { versao: { increment: 1 } }
      });

      if (toActivateOrCreate.length) {
        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId,
            usuarioId: user.sub,
            evento: 'ACOMPANHANTES',
            campo: 'acompanhantes',
            valorNovo: toActivateOrCreate.map((acompanhante) => this.usuarioLabel(acompanhante)).filter(Boolean).join(', '),
            observacao: 'Acompanhantes adicionados ao chamado.'
          }
        });
      }

      if (toDeactivate.length) {
        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId,
            usuarioId: user.sub,
            evento: 'ACOMPANHANTES',
            campo: 'acompanhantes',
            valorAnterior: toDeactivate.map((acompanhante) => this.usuarioLabel(acompanhante.usuario)).filter(Boolean).join(', '),
            observacao: 'Acompanhantes removidos do chamado.'
          }
        });
      }
    });

    return this.chamado(chamado.id, user);
  }

  private async findSolucoesChamadoOptions(empresaId?: number): Promise<ChamadoResponsavelOptionsType['solucoes']> {
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

  private async resolveChamadoContext(solucaoIdInput: number, funcionalidadeIdInput?: number | null): Promise<{ solucaoId: number; funcionalidadeId: number | null }> {
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

  private async findResponsaveisParaContexto(empresaId: number, solucaoId: number, funcionalidadeId: number | null): Promise<AtendenteChamadoType[]> {
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
      .map((responsavel) => this.responsavelRecordToAtendente(responsavel))
      .filter((responsavel): responsavel is AtendenteChamadoType => !!responsavel)
      .sort((a, b) => (a.nome || a.email || '').localeCompare(b.nome || b.email || ''));
  }

  private async resolveResponsavelAbertura(
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

    if (filtro?.prioridadeId) {
      where.prioridadeId = filtro.prioridadeId;
    }

    if (filtro?.solicitanteId) {
      where.solicitanteId = filtro.solicitanteId;
    }

    if (filtro?.responsavelId) {
      where.responsavelId = filtro.responsavelId;
    }

    if (filtro?.responsavelGrupoId) {
      where.responsavelGrupoId = filtro.responsavelGrupoId;
    }

    if (filtro?.categoriaId) {
      where.categoriaId = filtro.categoriaId;
    }

    if (filtro?.criadoDe || filtro?.criadoAte) {
      where.criadoEm = {
        ...(filtro.criadoDe ? { gte: new Date(filtro.criadoDe) } : {}),
        ...(filtro.criadoAte ? { lte: this.endOfDay(filtro.criadoAte) } : {})
      };
    }

    const termo = filtro?.termo?.trim();

    if (termo) {
      const numero = Number(termo.replace('#', ''));
      const searchOr = [
        { titulo: { contains: termo } },
        { descricao: { contains: termo } },
        ...(Number.isFinite(numero) && numero > 0 ? [{ numero }] : [])
      ];

      if (where.OR) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : []),
          { OR: where.OR },
          { OR: searchOr }
        ];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
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

  private responsavelRecordToPayload(responsavel: ChamadoResponsavelRecord): ResponsavelSolucaoPayload[] {
    return (responsavel.solucoes ?? [])
      .filter((solucao) => solucao.ativo)
      .map((solucao) => ({
        solucaoId: solucao.solucaoId,
        responsavelGeral: solucao.responsavelGeral,
        funcionalidadeIds: solucao.responsavelGeral
          ? []
          : (solucao.funcionalidades ?? [])
              .filter((funcionalidade) => funcionalidade.ativo)
              .map((funcionalidade) => funcionalidade.funcionalidadeId)
      }));
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

  private async ensureGrupoElegivelResponsavel(grupoId: number, empresaId: number): Promise<void> {
    const grupos = await this.findGruposElegiveisResponsaveis(empresaId);

    if (!grupos.some((grupo) => grupo.id === grupoId)) {
      throw new BadRequestException('Grupo selecionado nao possui usuarios vinculados a empresa ativa ou nao possui acesso ao Controle de Chamados.');
    }
  }

  private async desativarAcompanhantesDoChamado(
    chamado: ChamadoRecord,
    user: JwtPayload,
    usuarioIds: string[],
    observacao: string
  ): Promise<void> {
    const ids = [...new Set(usuarioIds.filter(Boolean))];

    if (!ids.length) {
      return;
    }

    const ativos = (await (this.prisma as never as { chamadoAcompanhante: { findMany: Function } }).chamadoAcompanhante.findMany({
      where: { chamadoId: chamado.id, empresaId: chamado.empresaId, usuarioId: { in: ids }, ativo: true },
      include: { usuario: { select: usuarioResumoSelect } }
    })) as ChamadoAcompanhanteRecord[];

    if (!ativos.length) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const db = tx as never as { chamado: { update: Function }; chamadoAcompanhante: { updateMany: Function }; chamadoHistorico: { create: Function } };

      await db.chamadoAcompanhante.updateMany({
        where: { chamadoId: chamado.id, empresaId: chamado.empresaId, usuarioId: { in: ativos.map((item) => item.usuarioId) }, ativo: true },
        data: { ativo: false, atualizadoEm: new Date() }
      });

      await db.chamado.update({
        where: { id: chamado.id },
        data: { versao: { increment: 1 } }
      });

      await db.chamadoHistorico.create({
        data: {
          chamadoId: chamado.id,
          empresaId: chamado.empresaId,
          usuarioId: user.sub,
          evento: 'ACOMPANHANTES',
          campo: 'acompanhantes',
          valorAnterior: ativos.map((item) => this.usuarioLabel(item.usuario)).filter(Boolean).join(', '),
          observacao
        }
      });
    });
  }
  private async findUsuariosElegiveisAcompanhantes(
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

  private async resolveAcompanhantesPayload(
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

  private async isAcompanhanteAtivo(chamadoId: string, usuarioId: string): Promise<boolean> {
    const acompanhante = await (this.prisma as never as { chamadoAcompanhante: { findFirst: Function } }).chamadoAcompanhante.findFirst({
      where: { chamadoId, usuarioId, ativo: true },
      select: { id: true }
    });

    return !!acompanhante;
  }

  private async isUsuarioResponsavelOuLiderDoChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<boolean> {
    if (chamado.responsavelId && chamado.responsavelId === user.sub) {
      return true;
    }

    if (chamado.liderAtendimentoId && chamado.liderAtendimentoId === user.sub) {
      return true;
    }

    if (chamado.responsavelGrupoId) {
      const vinculo = await this.prisma.empresaUsuario.findFirst({
        where: {
          empresaId: chamado.empresaId,
          usuarioId: user.sub,
          usuario: { grupoId: chamado.responsavelGrupoId }
        },
        select: { id: true }
      });

      return !!vinculo;
    }

    return false;
  }

  private async assertCanManageAcompanhantes(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (chamado.solicitanteId === user.sub) {
      await this.assertFeatureAction(user, FEATURES.meus, 'visualizar');
      return;
    }

    if (await this.isUsuarioResponsavelOuLiderDoChamado(user, chamado)) {
      return;
    }

    if (
      await this.canFeatureAction(user, FEATURES.painel, 'gerenciar_acompanhantes') ||
      await this.canFeatureAction(user, FEATURES.painel, 'atribuir_chamado')
    ) {
      return;
    }

    throw new ForbiddenException('Usuario sem permissao para gerenciar acompanhantes deste chamado.');
  }
  private async findUsuariosElegiveisResponsaveis(empresaId: number): Promise<Array<UsuarioResumoRecord & { grupoNome?: string | null }>> {
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
      .filter((usuario) => this.grupoPossuiAcessoControleChamados(usuario.grupo))
      .sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email))
      .map((usuario) => ({
        id: usuario.id,
        nome: usuario.nome ?? null,
        login: usuario.login ?? null,
        email: usuario.email,
        grupoNome: usuario.grupo?.nome ?? null
      }));
  }

  private async findGruposElegiveisResponsaveis(empresaId: number): Promise<Array<GrupoResumoRecord & { usuariosCount: number }>> {
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
      .filter((grupo) => this.grupoPossuiAcessoControleChamados(grupo))
      .filter((grupo) => (grupo.usuarios ?? []).length > 0)
      .map((grupo) => ({
        id: grupo.id,
        nome: grupo.nome,
        descricao: grupo.descricao ?? null,
        usuariosCount: grupo.usuarios?.length ?? 0
      }));
  }

  private grupoPossuiAcessoControleChamados(grupo?: {
    acessoEcommerce?: boolean | null;
    acessoProjetos?: boolean | null;
    acessoHoras?: boolean | null;
    acessoConfigurador?: boolean | null;
    solucoes?: Array<{ solucao?: { slug: string } | null }>;
    funcionalidades?: Array<{ funcionalidade?: { solucao?: { slug: string } | null } | null }>;
  } | null): boolean {
    return !!grupo && (
      this.hasFullAccessGroup(grupo) ||
      (grupo.solucoes ?? []).some((item) => item.solucao?.slug === SOLUTION_SLUG) ||
      (grupo.funcionalidades ?? []).some((item) => item.funcionalidade?.solucao?.slug === SOLUTION_SLUG)
    );
  }

  private responsavelRecordToAtendente(responsavel: ChamadoResponsavelRecord): AtendenteChamadoType | null {
    if (responsavel.tipo === 'GRUPO') {
      if (!responsavel.grupo) {
        return null;
      }

      return {
        id: `GRUPO:${responsavel.grupo.id}`,
        tipo: 'GRUPO',
        usuarioId: null,
        grupoId: responsavel.grupo.id,
        nome: responsavel.grupo.nome,
        login: null,
        email: null
      };
    }

    if (!responsavel.usuario) {
      return null;
    }

    return {
      id: `USUARIO:${responsavel.usuario.id}`,
      tipo: 'USUARIO',
      usuarioId: responsavel.usuario.id,
      grupoId: null,
      nome: responsavel.usuario.nome ?? null,
      login: responsavel.usuario.login ?? null,
      email: responsavel.usuario.email
    };
  }

  private async ensureUsuarioPertenceAoGrupoNaEmpresa(usuarioId: string, empresaId: number, grupoId: number): Promise<void> {
    const vinculo = await this.prisma.empresaUsuario.findFirst({
      where: {
        empresaId,
        usuarioId,
        usuario: { grupoId }
      },
      select: { id: true }
    });

    if (!vinculo) {
      throw new ForbiddenException('Este chamado esta vinculado a um grupo do qual voce nao faz parte.');
    }
  }

  private toResponsavelType(responsavel: ChamadoResponsavelRecord): ChamadoResponsavelType {
    const activeSolucoes = (responsavel.solucoes ?? []).filter((solucao) => solucao.ativo);
    const solucoes = activeSolucoes.length ? activeSolucoes : (responsavel.solucoes ?? []);

    return {
      id: responsavel.id,
      empresaId: responsavel.empresaId,
      tipo: responsavel.tipo || 'USUARIO',
      usuarioId: responsavel.usuarioId ?? null,
      usuarioNome: responsavel.usuario ? this.usuarioLabel(responsavel.usuario) : null,
      usuarioEmail: responsavel.usuario?.email ?? null,
      grupoId: responsavel.grupoId ?? null,
      grupoNome: responsavel.grupo?.nome ?? null,
      responsavelNome: this.responsavelLabel(responsavel),
      ativo: responsavel.ativo,
      solucoes: solucoes.map((solucao) => ({
        id: solucao.id,
        solucaoId: solucao.solucaoId,
        solucaoNome: solucao.solucao?.nome ?? '-',
        responsavelGeral: solucao.responsavelGeral,
        ativo: solucao.ativo,
        funcionalidades: (solucao.funcionalidades ?? [])
          .filter((funcionalidade) => funcionalidade.ativo)
          .map((funcionalidade) => ({
            id: funcionalidade.id,
            funcionalidadeId: funcionalidade.funcionalidadeId,
            funcionalidadeNome: funcionalidade.funcionalidade?.label || funcionalidade.funcionalidade?.titulo || '-',
            ativo: funcionalidade.ativo
          }))
      })),
      criadoEm: responsavel.criadoEm,
      atualizadoEm: responsavel.atualizadoEm
    };
  }
  private async ensureDefaultChamadoConfiguracoes(empresaId: number): Promise<void> {
    await this.solucoesService.ensureDefaultChamadoConfiguracoesForEmpresa(empresaId, true);
  }
  private async ensureTipoChamado(empresaId: number, id: number | null | undefined): Promise<ChamadoConfiguracaoRecord> {
    if (!id || !Number.isInteger(Number(id))) {
      throw new BadRequestException('Selecione o tipo de chamado.');
    }

    const tipo = await (this.prisma as never as { chamadoTipo: { findFirst: Function } }).chamadoTipo.findFirst({
      where: { id: Number(id), empresaId, ativo: true }
    }) as ChamadoConfiguracaoRecord | null;

    if (!tipo) {
      throw new BadRequestException('Tipo de chamado invalido ou inativo.');
    }

    return tipo;
  }

  private async ensurePrioridadeChamado(empresaId: number, id: number | null | undefined): Promise<ChamadoConfiguracaoRecord> {
    if (!id || !Number.isInteger(Number(id))) {
      throw new BadRequestException('Selecione a prioridade do chamado.');
    }

    const prioridade = await (this.prisma as never as { chamadoPrioridade: { findFirst: Function } }).chamadoPrioridade.findFirst({
      where: { id: Number(id), empresaId, ativo: true }
    }) as ChamadoConfiguracaoRecord | null;

    if (!prioridade) {
      throw new BadRequestException('Prioridade de chamado invalida ou inativa.');
    }

    return prioridade;
  }

  private async ensureTipoRecord(id: number, empresaId: number): Promise<ChamadoConfiguracaoRecord> {
    const tipo = await (this.prisma as never as { chamadoTipo: { findFirst: Function } }).chamadoTipo.findFirst({
      where: { id, empresaId }
    }) as ChamadoConfiguracaoRecord | null;

    if (!tipo) {
      throw new NotFoundException('Tipo de chamado nao encontrado.');
    }

    return tipo;
  }

  private async ensurePrioridadeRecord(id: number, empresaId: number): Promise<ChamadoConfiguracaoRecord> {
    const prioridade = await (this.prisma as never as { chamadoPrioridade: { findFirst: Function } }).chamadoPrioridade.findFirst({
      where: { id, empresaId }
    }) as ChamadoConfiguracaoRecord | null;

    if (!prioridade) {
      throw new NotFoundException('Prioridade de chamado nao encontrada.');
    }

    return prioridade;
  }

  private buildConfiguracaoData(empresaId: number, input: { nome: string; descricao?: string | null; cor?: string | null; ordem?: number; ativo?: boolean }) {
    const nome = this.requiredText(input.nome, 'nome');

    return {
      empresaId,
      nome,
      descricao: input.descricao?.trim() || null,
      cor: input.cor?.trim() || null,
      ordem: input.ordem ?? 0,
      ativo: input.ativo ?? true
    };
  }

  private buildConfiguracaoUpdateData(input: { nome?: string | null; descricao?: string | null; cor?: string | null; ordem?: number | null; ativo?: boolean | null }) {
    return {
      ...(input.nome !== undefined ? { nome: this.requiredText(input.nome ?? '', 'nome') } : {}),
      ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
      ...(input.cor !== undefined ? { cor: input.cor?.trim() || null } : {}),
      ...(input.ordem !== undefined && input.ordem !== null ? { ordem: input.ordem } : {}),
      ...(input.ativo !== undefined && input.ativo !== null ? { ativo: input.ativo } : {})
    };
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


  private async ensureGrupoResponsavel(grupoId: number): Promise<GrupoResumoRecord> {
    const grupo = await this.prisma.grupoUsuario.findFirst({
      where: { id: grupoId },
      select: { id: true, nome: true, descricao: true }
    }) as GrupoResumoRecord | null;

    if (!grupo) {
      throw new BadRequestException('Grupo responsavel nao encontrado.');
    }

    return grupo;
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
          : status === 'ARQUIVADO'
            ? 'ARQUIVAMENTO'
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

  private isTerminalStatus(status?: string | null): boolean {
    return TERMINAL_STATUSES.includes(status as never);
  }

  private isClosedStatus(status?: string | null): boolean {
    return CLOSED_STATUSES.includes(status as never);
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


  private assertCanOperateAtendimentoAtual(user: JwtPayload, chamado: ChamadoRecord): void {
    if (!chamado.liderAtendimentoId || chamado.liderAtendimentoId === user.sub || this.isSystemAdmin(user)) {
      return;
    }

    throw new BadRequestException(`Este chamado ja esta em atendimento por ${this.usuarioLabel(chamado.liderAtendimento) || 'outro usuario'}.`);
  }


  private async assertCanAttachFiles(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (chamado.solicitanteId === user.sub) {
      if (
        await this.canFeatureAction(user, FEATURES.meus, 'responder_proprio_chamado') ||
        await this.canFeatureAction(user, FEATURES.meus, 'visualizar') ||
        await this.canFeatureAction(user, FEATURES.abrir, 'incluir')
      ) {
        return;
      }

      throw new ForbiddenException('Usuario sem permissao para anexar arquivos neste chamado.');
    }

    if (await this.isAcompanhanteAtivo(chamado.id, user.sub) && await this.canUseAnyChamadosFeature(user)) {
      return;
    }

    await this.assertFeatureAction(user, FEATURES.painel, 'responder_chamado');
    this.assertCanOperateAtendimentoAtual(user, chamado);
  }

  private validateAnexoFile(file: ChamadoUploadFile): void {
    const extension = extname(file?.originalname || '').toLowerCase();

    if (!file?.buffer?.length || !file.size) {
      throw new BadRequestException('Arquivo de anexo vazio ou invalido.');
    }

    if (file.size > MAX_ANEXO_SIZE_BYTES) {
      throw new BadRequestException('Cada anexo deve ter no maximo 10 MB.');
    }

    if (!ALLOWED_ANEXO_MIME_TYPES.has(file.mimetype) || !ALLOWED_ANEXO_EXTENSIONS.has(extension)) {
      throw new BadRequestException('Tipo de arquivo nao permitido para anexo.');
    }
  }

  private async assertCanViewChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (this.isClosedStatus(chamado.status) && await this.canFeatureAction(user, FEATURES.arquivados, 'visualizar')) {
      return;
    }

    if (chamado.solicitanteId === user.sub) {
      await this.assertFeatureAction(user, FEATURES.meus, 'visualizar');
      return;
    }

    if (await this.isAcompanhanteAtivo(chamado.id, user.sub) && await this.canUseAnyChamadosFeature(user)) {
      return;
    }

    await this.assertFeatureAction(user, FEATURES.painel, 'visualizar_fila');
  }

  private async assertCanRespondChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (chamado.solicitanteId === user.sub && await this.canFeatureAction(user, FEATURES.meus, 'responder_proprio_chamado')) {
      return;
    }

    if (await this.isAcompanhanteAtivo(chamado.id, user.sub) && await this.canUseAnyChamadosFeature(user)) {
      return;
    }

    await this.assertFeatureAction(user, FEATURES.painel, 'responder_chamado');
  }

  private async assertAnyFeatureAction(user: JwtPayload, featureSlug: string, actions: string[]): Promise<void> {
    for (const action of actions) {
      if (await this.canFeatureAction(user, featureSlug, action)) {
        return;
      }
    }

    throw new ForbiddenException('Usuario sem permissao para executar esta acao.');
  }

  private async canUseAnyChamadosFeature(user: JwtPayload): Promise<boolean> {
    const candidates: Array<[string, string]> = [
      [FEATURES.abrir, 'visualizar'],
      [FEATURES.abrir, 'incluir'],
      [FEATURES.meus, 'visualizar'],
      [FEATURES.painel, 'visualizar_fila'],
      [FEATURES.arquivados, 'visualizar'],
      [FEATURES.categorias, 'visualizar'],
      [FEATURES.responsaveis, 'visualizar']
    ];

    for (const [feature, action] of candidates) {
      if (await this.canFeatureAction(user, feature, action)) {
        return true;
      }
    }

    return false;
  }

  private async assertCanArchiveChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    await this.assertUsuarioResponsavelPeloChamado(user, chamado);

    if (await this.canFeatureAction(user, FEATURES.painel, 'encerrar_chamado')) {
      return;
    }

    if (chamado.solicitanteId === user.sub && await this.canFeatureAction(user, FEATURES.meus, 'excluir')) {
      return;
    }

    throw new ForbiddenException('Usuario sem permissao para arquivar este chamado.');
  }

  private assertCanUnarchiveChamado(user: JwtPayload): void {
    if (this.isSystemAdmin(user) || this.hasFullAccessGroup(user.grupo)) {
      return;
    }

    throw new ForbiddenException('Apenas administradores podem desarquivar chamados.');
  }

  private async assertUsuarioResponsavelPeloChamado(user: JwtPayload, chamado: ChamadoRecord): Promise<void> {
    if (chamado.responsavelId) {
      if (chamado.responsavelId === user.sub) {
        return;
      }

      throw new ForbiddenException('Apenas o responsavel atual pelo chamado pode arquivar.');
    }

    if (chamado.liderAtendimentoId) {
      if (chamado.liderAtendimentoId === user.sub) {
        return;
      }

      throw new ForbiddenException('Apenas o responsavel atual pelo chamado pode arquivar.');
    }

    if (chamado.responsavelGrupoId) {
      await this.ensureUsuarioPertenceAoGrupoNaEmpresa(user.sub, chamado.empresaId, chamado.responsavelGrupoId);
      return;
    }

    throw new ForbiddenException('Apenas o responsavel atual pelo chamado pode arquivar.');
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

  private endOfDay(value: string): Date {
    const date = new Date(value);

    date.setHours(23, 59, 59, 999);

    return date;
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
      responsavelGrupoId: chamado.responsavelGrupoId ?? null,
      responsavelGrupoNome: chamado.responsavelGrupo?.nome ?? null,
      liderAtendimentoId: chamado.liderAtendimentoId ?? null,
      liderAtendimentoNome: this.usuarioLabel(chamado.liderAtendimento),
      atendimentoAssumidoEm: chamado.atendimentoAssumidoEm ?? null,
      categoriaId: chamado.categoriaId ?? null,
      categoriaNome: chamado.categoria?.nome ?? null,
      solucaoId: chamado.solucaoId ?? null,
      solucaoNome: chamado.solucao?.nome ?? null,
      funcionalidadeId: chamado.funcionalidadeId ?? null,
      funcionalidadeNome: chamado.funcionalidade?.label || chamado.funcionalidade?.titulo || null,
      titulo: chamado.titulo,
      descricao: chamado.descricao,
      tipoId: chamado.tipoId,
      tipoNome: chamado.tipoConfiguracao?.nome ?? '-',
      tipoCor: chamado.tipoConfiguracao?.cor ?? null,
      prioridadeId: chamado.prioridadeId,
      prioridadeNome: chamado.prioridadeConfiguracao?.nome ?? '-',
      prioridadeCor: chamado.prioridadeConfiguracao?.cor ?? null,
      status: chamado.status,
      criadoEm: chamado.criadoEm,
      atualizadoEm: chamado.atualizadoEm,
      primeiraRespostaEm: chamado.primeiraRespostaEm ?? null,
      resolvidoEm: chamado.resolvidoEm ?? null,
      encerradoEm: chamado.encerradoEm ?? null,
      versao: chamado.versao,
      mensagens: (chamado.mensagens ?? []).map((mensagem) => this.toMensagemType(mensagem)),
      anexos: (chamado.anexos ?? []).map((anexo) => this.toAnexoType(anexo)),
      acompanhantes: (chamado.acompanhantes ?? []).map((acompanhante) => this.toAcompanhanteType(acompanhante)),
      historico: (chamado.historico ?? []).map((historico) => this.toHistoricoType(historico))
    };
  }



  private toAcompanhanteType(acompanhante: ChamadoAcompanhanteRecord): ChamadoAcompanhanteType {
    return {
      id: acompanhante.id,
      chamadoId: acompanhante.chamadoId,
      usuarioId: acompanhante.usuarioId,
      usuarioNome: this.usuarioLabel(acompanhante.usuario),
      usuarioLogin: acompanhante.usuario?.login ?? null,
      usuarioEmail: acompanhante.usuario?.email ?? null,
      adicionadoPorId: acompanhante.adicionadoPorId ?? null,
      adicionadoPorNome: this.usuarioLabel(acompanhante.adicionadoPor),
      ativo: acompanhante.ativo,
      criadoEm: acompanhante.criadoEm,
      atualizadoEm: acompanhante.atualizadoEm
    };
  }
  private toAnexoType(anexo: ChamadoAnexoRecord): ChamadoAnexoType {
    return {
      id: anexo.id,
      chamadoId: anexo.chamadoId,
      mensagemId: anexo.mensagemId ?? null,
      autorId: anexo.autorId,
      autorNome: this.usuarioLabel(anexo.autor),
      nomeOriginal: anexo.nomeOriginal,
      mimeType: anexo.mimeType,
      tamanho: anexo.tamanho,
      downloadUrl: `/chamados/${anexo.chamadoId}/anexos/${anexo.id}/download`,
      criadoEm: anexo.criadoEm
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
      criadoEm: mensagem.criadoEm,
      anexos: (mensagem.anexos ?? []).map((anexo) => this.toAnexoType(anexo))
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
  private toTipoType(tipo: ChamadoConfiguracaoRecord): ChamadoTipoType {
    return {
      id: tipo.id,
      empresaId: tipo.empresaId,
      nome: tipo.nome,
      descricao: tipo.descricao ?? null,
      cor: tipo.cor ?? null,
      ordem: tipo.ordem,
      ativo: tipo.ativo,
      criadoEm: tipo.criadoEm,
      atualizadoEm: tipo.atualizadoEm
    };
  }

  private toPrioridadeType(prioridade: ChamadoConfiguracaoRecord): ChamadoPrioridadeType {
    return {
      id: prioridade.id,
      empresaId: prioridade.empresaId,
      nome: prioridade.nome,
      descricao: prioridade.descricao ?? null,
      cor: prioridade.cor ?? null,
      ordem: prioridade.ordem,
      ativo: prioridade.ativo,
      criadoEm: prioridade.criadoEm,
      atualizadoEm: prioridade.atualizadoEm
    };
  }


  private responsavelLabel(responsavel?: ChamadoResponsavelRecord | null): string | null {
    if (!responsavel) {
      return null;
    }

    if (responsavel.tipo === 'GRUPO') {
      return responsavel.grupo?.nome ?? null;
    }

    return this.usuarioLabel(responsavel.usuario);
  }

  private chamadoResponsavelLabel(chamado: ChamadoRecord): string | null {
    return chamado.responsavelGrupo?.nome || this.usuarioLabel(chamado.responsavel);
  }
  private usuarioLabel(usuario?: UsuarioResumoRecord | null): string | null {
    if (!usuario) {
      return null;
    }

    return usuario.nome || usuario.login || usuario.email;
  }
}
