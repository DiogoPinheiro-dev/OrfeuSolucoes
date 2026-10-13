import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import {
  EnviarProjetoApontamentosInput,
  SalvarProjetoApontamentoInput,
  VersionarProjetoApontamentoInput
} from './dto/projeto-apontamento.input';
import { ProjetoApontamentoType } from './dto/projeto-apontamento.type';
import {
  assertLimiteDiarioApontamentos,
  assertMinutosApontamento,
  normalizeDescricaoApontamento
} from './policies/projeto-apontamento-limite.policy';
import {
  ProjetoApontamentoDestino,
  resolveProjetoApontamentoTransicao
} from './policies/projeto-apontamento-status.policy';
import { formatCalendarDate } from './policies/projeto-input.policy';
import {
  ProjetoApontamentoAuthorizationService,
  ProjetoApontamentoContexto
} from './projeto-apontamento-authorization.service';
import { ProjetoApontamentoPeriodoService } from './projeto-apontamento-periodo.service';
import { ProjetoApontamentoQueryService } from './projeto-apontamento-query.service';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import {
  ProjetoApontamentoOperacao,
  ProjetoApontamentoRecord,
  ProjetoApontamentoStatus
} from './types/projeto-apontamento.types';
import { ProjetoSituacao } from './types/projeto.types';

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;
const APONTAMENTO_NAO_ENCONTRADO = 'Apontamento não encontrado.';
const VERSAO_DESATUALIZADA = 'O apontamento foi alterado em outra tela ou por outra pessoa. Atualize os dados.';

type DadosDoApontamento = Pick<ProjetoApontamentoRecord, 'dataTrabalho' | 'minutos' | 'descricao' | 'faturavel'> & {
  itemId: string | null;
};

/** Casos de uso do autor sobre os próprios apontamentos de horas. */
@Injectable()
export class ProjetoApontamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoApontamentoAuthorizationService,
    private readonly query: ProjetoApontamentoQueryService,
    private readonly periodo: ProjetoPeriodoService,
    private readonly periodos: ProjetoApontamentoPeriodoService,
    private readonly auditoria: ProjetoAuditoriaService
  ) {}

  async salvar(input: SalvarProjetoApontamentoInput, user: JwtPayload): Promise<ProjetoApontamentoType> {
    const empresaId = await this.authorization.assertAcaoDoAutor(user, input.id ? ProjetoAcao.ALTERAR : ProjetoAcao.INCLUIR);
    const contexto = await this.authorization.projetoParaLancar(input.projetoId, user, empresaId);
    const dataTrabalho = this.periodo.assertDataTrabalho(input.data);
    const minutos = assertMinutosApontamento(input.minutos);
    const descricao = normalizeDescricaoApontamento(input.descricao);
    const filtroItens = input.itemId ? await this.authorization.filtroItensParaLancar(user, contexto) : {};

    const id = await this.emTransacao(async (tx) => {
      const atual = input.id ? await this.proprio(tx, input.id, user, contexto) : null;
      await this.transicionar(tx, contexto, ProjetoApontamentoOperacao.SALVAR, atual, { projetoId: contexto.projeto.id, dataTrabalho });
      const dados: DadosDoApontamento = {
        itemId: await this.itemDoApontamento(tx, input.itemId ?? null, atual, filtroItens),
        dataTrabalho,
        minutos,
        descricao,
        faturavel: input.faturavel
      };
      await this.assertLimiteDiario(tx, contexto, user, dados, atual?.id);

      if (!atual) {
        const criado = await tx.projetoApontamento.create({
          data: { ...dados, empresaId, projetoId: contexto.projeto.id, usuarioId: user.sub }
        });
        await this.registrar(tx, contexto, user, criado.id, 'CRIADO', this.retrato(criado));
        return criado.id;
      }

      await this.atualizarVersao(tx, atual.id, input.versao, dados);
      await this.registrar(tx, contexto, user, atual.id, 'ALTERADO', {
        antes: this.retrato(atual),
        depois: this.retrato({ ...atual, ...dados })
      });
      return atual.id;
    });

    return this.apontamentoDoAutor(id, user, empresaId);
  }

  async excluir(input: VersionarProjetoApontamentoInput, user: JwtPayload): Promise<boolean> {
    const contexto = await this.contextoDoProprio(input.id, user, ProjetoAcao.EXCLUIR);

    await this.emTransacao(async (tx) => {
      const atual = await this.proprio(tx, input.id, user, contexto);
      await this.transicionar(tx, contexto, ProjetoApontamentoOperacao.EXCLUIR, atual);
      const { count } = await tx.projetoApontamento.deleteMany({ where: { id: atual.id, versao: input.versao } });
      if (count !== 1) {
        throw new ConflictException(VERSAO_DESATUALIZADA);
      }
      await this.registrar(tx, contexto, user, atual.id, 'EXCLUIDO', this.retrato(atual));
    });

    return true;
  }

  async descartar(input: VersionarProjetoApontamentoInput, user: JwtPayload): Promise<boolean> {
    const contexto = await this.contextoDoProprio(input.id, user, ProjetoAcao.EXCLUIR);

    await this.emTransacao(async (tx) => {
      const atual = await this.proprio(tx, input.id, user, contexto);
      await this.transicionar(tx, contexto, ProjetoApontamentoOperacao.DESCARTAR, atual);
      await this.atualizarVersao(tx, atual.id, input.versao, { arquivadoEm: new Date(), arquivadoPorId: user.sub });
      await this.registrar(tx, contexto, user, atual.id, 'DESCARTADO', { motivo: atual.motivo ?? null });
    });

    return true;
  }

  /** Envia os apontamentos para aprovação, todos ou nenhum. */
  async enviar(input: EnviarProjetoApontamentosInput, user: JwtPayload): Promise<ProjetoApontamentoType[]> {
    const empresaId = await this.authorization.assertAcaoDoAutor(user, ProjetoAcao.ALTERAR);
    const ids = input.apontamentos.map((apontamento) => apontamento.id);
    const referencias = await this.prisma.projetoApontamento.findMany({
      where: { id: { in: ids }, empresaId, usuarioId: user.sub },
      select: { id: true, projetoId: true }
    });
    if (referencias.length !== ids.length) {
      throw new NotFoundException(APONTAMENTO_NAO_ENCONTRADO);
    }

    const contextos = new Map<string, ProjetoApontamentoContexto>();
    for (const projetoId of new Set(referencias.map((referencia) => referencia.projetoId))) {
      contextos.set(projetoId, await this.authorization.projetoParaLancar(projetoId, user, empresaId));
    }

    await this.emTransacao(async (tx) => {
      const atuais = await tx.projetoApontamento.findMany({ where: { id: { in: ids }, empresaId, usuarioId: user.sub } });
      const emCompetenciaFechada = await this.periodos.emCompetenciaFechada(atuais, tx);
      const enviadoEm = new Date();

      for (const { id, versao } of input.apontamentos) {
        const atual = atuais.find((apontamento) => apontamento.id === id);
        const contexto = atual ? contextos.get(atual.projetoId) : undefined;
        if (!atual || !contexto) {
          throw new NotFoundException(APONTAMENTO_NAO_ENCONTRADO);
        }

        const status = this.destino(contexto, ProjetoApontamentoOperacao.ENVIAR, atual, emCompetenciaFechada.has(atual));
        await this.atualizarVersao(tx, id, versao, { status, enviadoEm });
        await this.registrar(tx, contexto, user, id, 'ENVIADO', { statusAnterior: atual.status });
      }
    });

    return this.query.doAutor(ids, user, empresaId);
  }

  /** Devolve um apontamento enviado para rascunho, antes da decisão. */
  async recolher(input: VersionarProjetoApontamentoInput, user: JwtPayload): Promise<ProjetoApontamentoType> {
    const contexto = await this.contextoDoProprio(input.id, user, ProjetoAcao.ALTERAR);

    await this.emTransacao(async (tx) => {
      const atual = await this.proprio(tx, input.id, user, contexto);
      const status = await this.transicionar(tx, contexto, ProjetoApontamentoOperacao.RECOLHER, atual);
      await this.atualizarVersao(tx, atual.id, input.versao, { status });
      await this.registrar(tx, contexto, user, atual.id, 'RECOLHIDO', { statusAnterior: atual.status });
    });

    return this.apontamentoDoAutor(input.id, user, contexto.empresaId);
  }

  private async contextoDoProprio(id: string, user: JwtPayload, acao: string): Promise<ProjetoApontamentoContexto> {
    const empresaId = await this.authorization.assertAcaoDoAutor(user, acao);
    const referencia = await this.prisma.projetoApontamento.findFirst({
      where: { id, empresaId, usuarioId: user.sub },
      select: { projetoId: true }
    });
    if (!referencia) {
      throw new NotFoundException(APONTAMENTO_NAO_ENCONTRADO);
    }

    return this.authorization.projetoParaLancar(referencia.projetoId, user, empresaId);
  }

  private async proprio(
    tx: Prisma.TransactionClient,
    id: string,
    user: JwtPayload,
    contexto: ProjetoApontamentoContexto
  ): Promise<ProjetoApontamentoRecord> {
    const apontamento = await tx.projetoApontamento.findFirst({
      where: { id, empresaId: contexto.empresaId, projetoId: contexto.projeto.id, usuarioId: user.sub }
    });
    if (!apontamento) {
      throw new NotFoundException(APONTAMENTO_NAO_ENCONTRADO);
    }

    return apontamento;
  }

  /** Aplica a tabela de transições com a competência lida dentro da transação; ao salvar, vale também a do novo dia. */
  private async transicionar<O extends ProjetoApontamentoOperacao>(
    tx: Prisma.TransactionClient,
    contexto: ProjetoApontamentoContexto,
    operacao: O,
    atual: ProjetoApontamentoRecord | null,
    novoDia?: { projetoId: string; dataTrabalho: Date }
  ): Promise<ProjetoApontamentoDestino<O>> {
    const consultados = [...(atual ? [atual] : []), ...(novoDia ? [novoDia] : [])];
    const emCompetenciaFechada = await this.periodos.emCompetenciaFechada(consultados, tx);

    return this.destino(contexto, operacao, atual, emCompetenciaFechada.size > 0);
  }

  private destino<O extends ProjetoApontamentoOperacao>(
    contexto: ProjetoApontamentoContexto,
    operacao: O,
    atual: ProjetoApontamentoRecord | null,
    competenciaFechada: boolean
  ): ProjetoApontamentoDestino<O> {
    return resolveProjetoApontamentoTransicao({
      operacao,
      status: (atual?.status as ProjetoApontamentoStatus | undefined) ?? null,
      descartado: !!atual?.arquivadoEm,
      atorEhAutor: true,
      situacaoProjeto: contexto.projeto.situacao as ProjetoSituacao,
      competenciaFechada
    });
  }

  /** Mantém o item já associado, mesmo que ele tenha sido arquivado depois; um item novo precisa estar disponível. */
  private async itemDoApontamento(
    tx: Prisma.TransactionClient,
    itemId: string | null,
    atual: ProjetoApontamentoRecord | null,
    filtroItens: Prisma.ProjetoItemWhereInput
  ): Promise<string | null> {
    if (!itemId || itemId === atual?.itemId) {
      return itemId;
    }

    const item = await tx.projetoItem.findFirst({ where: { ...filtroItens, id: itemId }, select: { id: true } });
    if (!item) {
      throw new BadRequestException('Selecione um item ativo deste projeto que esteja no seu escopo.');
    }

    return item.id;
  }

  private async assertLimiteDiario(
    tx: Prisma.TransactionClient,
    contexto: ProjetoApontamentoContexto,
    user: JwtPayload,
    dados: DadosDoApontamento,
    idAtual?: string
  ): Promise<void> {
    const doDia = await tx.projetoApontamento.findMany({
      where: {
        empresaId: contexto.empresaId,
        usuarioId: user.sub,
        arquivadoEm: null,
        dataTrabalho: { gte: dados.dataTrabalho, lt: new Date(dados.dataTrabalho.getTime() + UM_DIA_EM_MS) }
      },
      select: { id: true, minutos: true }
    });

    assertLimiteDiarioApontamentos(doDia, { id: idAtual, minutos: dados.minutos });
  }

  private async atualizarVersao(
    tx: Prisma.TransactionClient,
    id: string,
    versao: number | null | undefined,
    dados: Prisma.ProjetoApontamentoUncheckedUpdateManyInput
  ): Promise<void> {
    if (!versao) {
      throw new BadRequestException('Informe a versão para alterar o apontamento.');
    }

    const { count } = await tx.projetoApontamento.updateMany({
      where: { id, versao },
      data: { ...dados, versao: { increment: 1 } }
    });
    if (count !== 1) {
      throw new ConflictException(VERSAO_DESATUALIZADA);
    }
  }

  private async apontamentoDoAutor(id: string, user: JwtPayload, empresaId: number): Promise<ProjetoApontamentoType> {
    const [apontamento] = await this.query.doAutor([id], user, empresaId);
    if (!apontamento) {
      throw new NotFoundException(APONTAMENTO_NAO_ENCONTRADO);
    }

    return apontamento;
  }

  private registrar(
    tx: Prisma.TransactionClient,
    contexto: ProjetoApontamentoContexto,
    user: JwtPayload,
    apontamentoId: string,
    evento: string,
    dados: unknown
  ): Promise<unknown> {
    return this.auditoria.registrar(tx, {
      empresaId: contexto.empresaId,
      projetoId: contexto.projeto.id,
      usuarioId: user.sub,
      entidade: 'APONTAMENTO',
      entidadeId: apontamentoId,
      evento,
      dados
    });
  }

  private retrato(apontamento: Pick<ProjetoApontamentoRecord, 'itemId' | 'dataTrabalho' | 'minutos' | 'descricao' | 'faturavel' | 'status'>) {
    return {
      itemId: apontamento.itemId ?? null,
      dataTrabalho: formatCalendarDate(apontamento.dataTrabalho),
      minutos: apontamento.minutos,
      descricao: apontamento.descricao,
      faturavel: apontamento.faturavel,
      status: apontamento.status
    };
  }

  /**
   * Transação serializável: a soma diária e a competência são lidas e gravadas sem corrida. Quando o SQL Server
   * escolhe esta transação como vítima de um impasse, a pessoa recebe um conflito em vez de um erro genérico.
   */
  private async emTransacao<T>(operacao: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(operacao, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034') {
        throw new ConflictException('Outra operação alterou os seus apontamentos ao mesmo tempo. Atualize os dados e tente de novo.');
      }
      throw error;
    }
  }
}
