import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { existsSync } from 'node:fs';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateProjetoAtualizacaoInput, CreateProjetoComentarioInput, ExcluirProjetoComentarioInput, UpdateProjetoAtualizacaoInput, UpdateProjetoComentarioInput } from './dto/projeto-comunicacao.input';
import { ProjetoAnexoType, ProjetoAtualizacaoType, ProjetoComentarioType, ProjetoComunicacaoPainelType, ProjetoComunicacaoProjetoType, ProjetoFeedItemType } from './dto/projeto-comunicacao.type';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoAnexoStorageService } from './projeto-anexo-storage.service';
import { ProjetoComunicacaoAuthorizationService, ProjetoComunicacaoContexto } from './projeto-comunicacao-authorization.service';
import { MAX_PROJETO_ANEXO_FILES, validateProjetoAnexoFile } from './policies/projeto-anexo.policy';
import { ProjetoUploadFile } from './types/projeto-comunicacao.types';
import { ProjetoSaude } from './types/projeto.types';

const ANEXO_INCLUDE = { autor: true };
const ATUALIZACAO_INCLUDE = {
  autor: true,
  historico: { include: { editor: true }, orderBy: { criadoEm: 'desc' as const } },
  anexos: { where: { excluidoEm: null }, include: ANEXO_INCLUDE, orderBy: { criadoEm: 'asc' as const } }
};
const COMENTARIO_INCLUDE = {
  autor: true, item: true, atualizacao: true,
  anexos: { where: { excluidoEm: null }, include: ANEXO_INCLUDE, orderBy: { criadoEm: 'asc' as const } }
};

type AnyRecord = Record<string, any>;

@Injectable()
export class ProjetoComunicacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoComunicacaoAuthorizationService,
    private readonly auditoria: ProjetoAuditoriaService,
    private readonly storage: ProjetoAnexoStorageService
  ) {}

  async projetos(user: JwtPayload): Promise<ProjetoComunicacaoProjetoType[]> {
    const empresaId = await this.authorization.assertListCompany(user);
    const where = this.authorization.isSystemAdmin(user)
      ? { empresaId }
      : { empresaId, OR: [{ responsavelId: user.sub }, { membros: { some: { usuarioId: user.sub } } }] };
    return this.prisma.projeto.findMany({ where, select: { id: true, chave: true, nome: true, arquivadoEm: true }, orderBy: [{ arquivadoEm: 'asc' }, { nome: 'asc' }] });
  }
  async painel(projetoId: string, user: JwtPayload): Promise<ProjetoComunicacaoPainelType> {
    const contexto = await this.authorization.assertReadContext(projetoId, user);
    const [atualizacoes, comentarios, eventos, itensDisponiveis, permissoes] = await Promise.all([
      this.prisma.projetoAtualizacao.findMany({ where: { projetoId, empresaId: contexto.empresaId }, include: ATUALIZACAO_INCLUDE, orderBy: { criadoEm: 'desc' }, take: 100 }),
      this.prisma.projetoComentario.findMany({ where: { projetoId, empresaId: contexto.empresaId, excluidoEm: null }, include: COMENTARIO_INCLUDE, orderBy: { criadoEm: 'desc' }, take: 200 }),
      this.prisma.projetoEvento.findMany({ where: { projetoId, empresaId: contexto.empresaId }, include: { usuario: true }, orderBy: { criadoEm: 'desc' }, take: 100 }),
      this.prisma.projetoItem.findMany({ where: { projetoId, empresaId: contexto.empresaId, arquivadoEm: null }, select: { id: true, chave: true, titulo: true }, orderBy: [{ ordemBacklog: 'asc' }, { numero: 'asc' }] }),
      this.authorization.effectivePermissions(contexto, user)
    ]);
    const mappedUpdates = atualizacoes.map((item) => this.toAtualizacao(item as AnyRecord, user, permissoes));
    const mappedComments = comentarios.map((item) => this.toComentario(item as AnyRecord, user, permissoes));
    const communicationEventIds = new Set([
      ...mappedUpdates.map((item) => `ATUALIZACAO:${item.id}`),
      ...mappedComments.map((item) => `COMENTARIO:${item.id}`)
    ]);
    const latestEventByEntity = new Map<string, AnyRecord>();
    for (const event of eventos as AnyRecord[]) {
      const key = `${event.entidade}:${event.entidadeId}`;
      const current = latestEventByEntity.get(key);
      const eventTime = new Date(event.criadoEm).getTime();
      const currentTime = current ? new Date(current.criadoEm).getTime() : -1;
      if (!current || eventTime > currentTime || (eventTime === currentTime && this.eventPriority(event.evento) > this.eventPriority(current.evento))) {
        latestEventByEntity.set(key, event);
      }
    }
    const feed: ProjetoFeedItemType[] = [
      ...mappedUpdates.map((item) => ({ id: `ATUALIZACAO:${item.id}`, tipo: 'ATUALIZACAO', entidadeId: item.id,
        conteudo: item.conteudo, autor: item.autor, saudePercebida: item.saudePercebida, contexto: null,
        ...this.communicationDetails(item as AnyRecord, latestEventByEntity.get(`ATUALIZACAO:${item.id}`), 'ATUALIZACAO'),
        editado: item.versao > 1, anexos: item.anexos, criadoEm: item.criadoEm })),
      ...mappedComments.map((item) => ({ id: `COMENTARIO:${item.id}`, tipo: 'COMENTARIO', entidadeId: item.id,
        conteudo: item.conteudo, autor: item.autor, saudePercebida: null, contexto: item.contexto,
        ...this.communicationDetails(item as AnyRecord, latestEventByEntity.get(`COMENTARIO:${item.id}`), 'COMENTARIO'),
        editado: !!item.editadoEm, anexos: item.anexos, criadoEm: item.criadoEm })),
      ...eventos.filter((item) => !communicationEventIds.has(`${item.entidade}:${item.entidadeId}`)).map((item) => ({
        id: `EVENTO:${item.id}`, tipo: 'EVENTO', entidadeId: item.entidadeId,
        conteudo: this.eventDescription(item.entidade, item.evento), autor: item.usuario as any,
        ...this.auditDetails(item.entidade, item.evento, item.dados, item.usuario as AnyRecord),
        saudePercebida: null, contexto: item.entidade, editado: false, anexos: [], criadoEm: item.criadoEm
      }))
    ].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime()).slice(0, 200);
    return { atualizacoes: mappedUpdates, comentarios: mappedComments, feed, itensDisponiveis, permissoes,
      ultimaAtualizacaoEm: mappedUpdates[0]?.criadoEm ?? null };
  }

  async createAtualizacao(input: CreateProjetoAtualizacaoInput, user: JwtPayload): Promise<ProjetoAtualizacaoType> {
    const contexto = await this.authorization.assertReadContext(input.projetoId, user);
    await this.authorization.assertUpdate(contexto, user, 'incluir');
    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.projetoAtualizacao.create({ data: { empresaId: contexto.empresaId, projetoId: input.projetoId,
        autorId: user.sub, conteudo: input.conteudo.trim(), saudePercebida: input.saudePercebida ?? null }, include: ATUALIZACAO_INCLUDE });
      await this.audit(tx, contexto, user, 'ATUALIZACAO', created.id, 'PUBLICADA', { saudePercebida: input.saudePercebida ?? null });
      return created;
    });
    const permissions = await this.authorization.effectivePermissions(contexto, user);
    return this.toAtualizacao(record as AnyRecord, user, permissions);
  }

  async updateAtualizacao(input: UpdateProjetoAtualizacaoInput, user: JwtPayload): Promise<ProjetoAtualizacaoType> {
    const current = await this.prisma.projetoAtualizacao.findUnique({ where: { id: input.id } });
    if (!current) throw new NotFoundException('Atualizacao do projeto nao encontrada.');
    const contexto = await this.authorization.assertReadContext(current.projetoId, user);
    if (current.autorId === user.sub) await this.authorization.assertUpdate(contexto, user, 'alterar');
    else await this.authorization.assertModerate(contexto, user);
    if (current.versao !== input.versao) throw new ConflictException('A atualizacao foi alterada por outro usuario. Recarregue o feed.');
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.projetoAtualizacaoHistorico.create({ data: { atualizacaoId: current.id, editorId: user.sub,
        conteudoAnterior: current.conteudo, saudePercebidaAnterior: current.saudePercebida, versaoAnterior: current.versao } });
      const changed = await tx.projetoAtualizacao.updateMany({ where: { id: current.id, empresaId: contexto.empresaId, versao: input.versao },
        data: { conteudo: input.conteudo.trim(), saudePercebida: input.saudePercebida ?? null, versao: { increment: 1 } } });
      if (!changed.count) throw new ConflictException('A atualizacao foi alterada por outro usuario. Recarregue o feed.');
      await this.audit(tx, contexto, user, 'ATUALIZACAO', current.id, 'EDITADA', {
        conteudo: { anterior: current.conteudo, novo: input.conteudo.trim() },
        saudePercebida: { anterior: current.saudePercebida, novo: input.saudePercebida ?? null }
      });
      return tx.projetoAtualizacao.findUniqueOrThrow({ where: { id: current.id }, include: ATUALIZACAO_INCLUDE });
    });
    return this.toAtualizacao(updated as AnyRecord, user, await this.authorization.effectivePermissions(contexto, user));
  }

  async createComentario(input: CreateProjetoComentarioInput, user: JwtPayload): Promise<ProjetoComentarioType> {
    const contexto = await this.authorization.assertReadContext(input.projetoId, user);
    await this.authorization.assertComment(contexto, user);
    await this.assertCommentTarget(contexto, input.atualizacaoId, input.itemId);
    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.projetoComentario.create({ data: { empresaId: contexto.empresaId, projetoId: input.projetoId,
        autorId: user.sub, conteudo: input.conteudo.trim(), atualizacaoId: input.atualizacaoId ?? null, itemId: input.itemId ?? null }, include: COMENTARIO_INCLUDE });
      await this.audit(tx, contexto, user, 'COMENTARIO', created.id, 'PUBLICADO');
      return created;
    });
    return this.toComentario(record as AnyRecord, user, await this.authorization.effectivePermissions(contexto, user));
  }

  async updateComentario(input: UpdateProjetoComentarioInput, user: JwtPayload): Promise<ProjetoComentarioType> {
    const current = await this.prisma.projetoComentario.findUnique({ where: { id: input.id } });
    if (!current || current.excluidoEm) throw new NotFoundException('Comentario nao encontrado.');
    const contexto = await this.authorization.assertReadContext(current.projetoId, user);
    if (current.autorId === user.sub) await this.authorization.assertComment(contexto, user);
    else await this.authorization.assertModerate(contexto, user);
    if (current.versao !== input.versao) throw new ConflictException('O comentario foi alterado por outro usuario. Recarregue o feed.');
    const changed = await this.prisma.projetoComentario.updateMany({ where: { id: current.id, versao: input.versao, excluidoEm: null },
      data: { conteudo: input.conteudo.trim(), editadoEm: new Date(), versao: { increment: 1 } } });
    if (!changed.count) throw new ConflictException('O comentario foi alterado por outro usuario. Recarregue o feed.');
    const updated = await this.prisma.projetoComentario.findUniqueOrThrow({ where: { id: current.id }, include: COMENTARIO_INCLUDE });
    await this.prisma.$transaction((tx) => this.audit(tx, contexto, user, 'COMENTARIO', current.id, 'EDITADO', {
      conteudo: { anterior: current.conteudo, novo: input.conteudo.trim() }
    }));
    return this.toComentario(updated as AnyRecord, user, await this.authorization.effectivePermissions(contexto, user));
  }

  async excluirComentario(input: ExcluirProjetoComentarioInput, user: JwtPayload): Promise<ProjetoComentarioType> {
    const current = await this.prisma.projetoComentario.findUnique({ where: { id: input.id }, include: COMENTARIO_INCLUDE });
    if (!current || current.excluidoEm) throw new NotFoundException('Comentario nao encontrado.');
    const contexto = await this.authorization.assertReadContext(current.projetoId, user);
    if (current.autorId === user.sub) await this.authorization.assertComment(contexto, user);
    else await this.authorization.assertModerate(contexto, user);
    const changed = await this.prisma.projetoComentario.updateMany({ where: { id: current.id, versao: input.versao, excluidoEm: null },
      data: { excluidoEm: new Date(), excluidoPorId: user.sub, versao: { increment: 1 } } });
    if (!changed.count) throw new ConflictException('O comentario foi alterado por outro usuario. Recarregue o feed.');
    await this.prisma.$transaction((tx) => this.audit(tx, contexto, user, 'COMENTARIO', current.id, 'EXCLUIDO'));
    return this.toComentario({ ...(current as AnyRecord), excluidoEm: new Date(), versao: current.versao + 1 }, user,
      await this.authorization.effectivePermissions(contexto, user));
  }

  async adicionarAnexos(projetoId: string, files: ProjetoUploadFile[], user: JwtPayload,
    atualizacaoId?: string | null, comentarioId?: string | null): Promise<ProjetoAnexoType[]> {
    const contexto = await this.authorization.assertReadContext(projetoId, user);
    await this.authorization.assertManageAttachments(contexto, user);
    if (!files.length) throw new BadRequestException('Selecione ao menos um arquivo para anexar.');
    if (files.length > MAX_PROJETO_ANEXO_FILES) throw new BadRequestException(`Informe no maximo ${MAX_PROJETO_ANEXO_FILES} anexos por envio.`);
    files.forEach(validateProjetoAnexoFile);
    await this.assertAttachmentTarget(contexto, atualizacaoId, comentarioId);
    const created: ProjetoAnexoType[] = [];
    for (const file of files) {
      const saved = await this.storage.save(projetoId, file);
      try {
        const record = await this.prisma.projetoAnexo.create({ data: { empresaId: contexto.empresaId, projetoId, autorId: user.sub,
          atualizacaoId: atualizacaoId ?? null, comentarioId: comentarioId ?? null, ...saved }, include: ANEXO_INCLUDE });
        created.push(this.toAnexo(record as AnyRecord));
      } catch (error) { await this.storage.remove(saved.caminho); throw error; }
    }
    await this.prisma.$transaction((tx) => this.audit(tx, contexto, user, 'ANEXO', created.map((item) => item.id).join(','), 'ENVIADO', { quantidade: created.length }));
    return created;
  }

  async prepararDownload(projetoId: string, anexoId: string, user: JwtPayload) {
    const contexto = await this.authorization.assertReadContext(projetoId, user);
    const anexo = await this.prisma.projetoAnexo.findFirst({ where: { id: anexoId, projetoId, empresaId: contexto.empresaId, excluidoEm: null } });
    if (!anexo) throw new NotFoundException('Anexo nao encontrado.');
    const caminhoAbsoluto = this.storage.resolve(anexo.caminho);
    if (!existsSync(caminhoAbsoluto)) throw new NotFoundException('Arquivo do anexo nao encontrado no armazenamento.');
    return { caminhoAbsoluto, nomeOriginal: anexo.nomeOriginal, mimeType: anexo.mimeType };
  }

  async excluirAnexo(projetoId: string, anexoId: string, user: JwtPayload): Promise<void> {
    const contexto = await this.authorization.assertReadContext(projetoId, user);
    const anexo = await this.prisma.projetoAnexo.findFirst({ where: { id: anexoId, projetoId, empresaId: contexto.empresaId, excluidoEm: null } });
    if (!anexo) throw new NotFoundException('Anexo nao encontrado.');
    await this.authorization.assertManageAttachments(contexto, user);
    if (anexo.autorId !== user.sub && !this.authorization.isSystemAdmin(user)) {
      try { await this.authorization.assertModerate(contexto, user); }
      catch (error) { if (error instanceof ForbiddenException) throw new ForbiddenException('Apenas o autor ou um moderador pode excluir este anexo.'); throw error; }
    }
    await this.prisma.projetoAnexo.update({ where: { id: anexo.id }, data: { excluidoEm: new Date(), excluidoPorId: user.sub } });
    await this.storage.remove(anexo.caminho);
    await this.prisma.$transaction((tx) => this.audit(tx, contexto, user, 'ANEXO', anexo.id, 'EXCLUIDO'));
  }

  private async assertCommentTarget(contexto: ProjetoComunicacaoContexto, atualizacaoId?: string | null, itemId?: string | null): Promise<void> {
    if (atualizacaoId && itemId) throw new BadRequestException('O comentario deve possuir somente um alvo.');
    if (atualizacaoId) {
      const target = await this.prisma.projetoAtualizacao.findFirst({ where: { id: atualizacaoId, projetoId: contexto.projeto.id, empresaId: contexto.empresaId } });
      if (!target) throw new BadRequestException('Atualizacao nao encontrada neste projeto.');
    }
    if (itemId) {
      const target = await this.prisma.projetoItem.findFirst({ where: { id: itemId, projetoId: contexto.projeto.id, empresaId: contexto.empresaId } });
      if (!target) throw new BadRequestException('Item nao encontrado neste projeto.');
      if (target.arquivadoEm) throw new BadRequestException('Itens arquivados nao podem receber comentarios.');
    }
  }

  private async assertAttachmentTarget(contexto: ProjetoComunicacaoContexto, atualizacaoId?: string | null, comentarioId?: string | null): Promise<void> {
    if (atualizacaoId && comentarioId) throw new BadRequestException('O anexo deve possuir somente um alvo.');
    if (atualizacaoId) {
      const target = await this.prisma.projetoAtualizacao.findFirst({ where: { id: atualizacaoId, projetoId: contexto.projeto.id, empresaId: contexto.empresaId } });
      if (!target) throw new BadRequestException('Atualizacao nao encontrada neste projeto.');
    }
    if (comentarioId) {
      const target = await this.prisma.projetoComentario.findFirst({ where: { id: comentarioId, projetoId: contexto.projeto.id, empresaId: contexto.empresaId, excluidoEm: null } });
      if (!target) throw new BadRequestException('Comentario nao encontrado neste projeto.');
    }
  }

  private toAtualizacao(item: AnyRecord, user: JwtPayload, permissions: any): ProjetoAtualizacaoType {
    return { id: item.id, projetoId: item.projetoId, conteudo: item.conteudo, saudePercebida: item.saudePercebida as ProjetoSaude | null,
      versao: item.versao, autor: item.autor, anexos: (item.anexos || []).map((anexo: AnyRecord) => this.toAnexo(anexo)),
      historico: (item.historico || []).map((entry: AnyRecord) => ({ id: entry.id, conteudoAnterior: entry.conteudoAnterior,
        saudePercebidaAnterior: entry.saudePercebidaAnterior as ProjetoSaude | null, versaoAnterior: entry.versaoAnterior,
        editor: entry.editor, criadoEm: entry.criadoEm })),
      podeEditar: (item.autorId === user.sub && permissions.podeEditarAtualizacao) || permissions.podeModerar,
      criadoEm: item.criadoEm, atualizadoEm: item.atualizadoEm };
  }

  private toComentario(item: AnyRecord, user: JwtPayload, permissions: any): ProjetoComentarioType {
    const own = item.autorId === user.sub;
    return { id: item.id, projetoId: item.projetoId, conteudo: item.conteudo, atualizacaoId: item.atualizacaoId,
      itemId: item.itemId, itemChave: item.item?.chave ?? null,
      contexto: item.item ? `${item.item.chave} — ${item.item.titulo}` : item.atualizacao ? 'Atualizacao do projeto' : 'Projeto',
      versao: item.versao, autor: item.autor, anexos: (item.anexos || []).map((anexo: AnyRecord) => this.toAnexo(anexo)),
      podeEditar: !item.excluidoEm && ((own && permissions.podeComentar) || permissions.podeModerar),
      podeExcluir: !item.excluidoEm && ((own && permissions.podeComentar) || permissions.podeModerar),
      editadoEm: item.editadoEm, criadoEm: item.criadoEm };
  }

  private toAnexo(item: AnyRecord): ProjetoAnexoType {
    return { id: item.id, projetoId: item.projetoId, nomeOriginal: item.nomeOriginal, mimeType: item.mimeType,
      tamanho: item.tamanho, downloadUrl: `/projetos/${item.projetoId}/anexos/${item.id}/download`, autor: item.autor, criadoEm: item.criadoEm };
  }

  private communicationDetails(item: AnyRecord, audit: AnyRecord | undefined, entidade: string) {
    const editado = entidade === 'ATUALIZACAO' ? Number(item.versao) > 1 : !!item.editadoEm;
    const evento = audit?.evento ?? (editado ? (entidade === 'ATUALIZACAO' ? 'EDITADA' : 'EDITADO') : (entidade === 'ATUALIZACAO' ? 'PUBLICADA' : 'PUBLICADO'));
    let alteracoes = this.changesFromData(this.parseAuditData(audit?.dados));
    if (!alteracoes.length && editado && entidade === 'ATUALIZACAO' && item.historico?.length) {
      const anterior = item.historico[0];
      if (anterior.conteudoAnterior !== item.conteudo) alteracoes.push({ campo: 'Conteúdo', valorAnterior: anterior.conteudoAnterior, valorNovo: item.conteudo });
      if (anterior.saudePercebidaAnterior !== item.saudePercebida) alteracoes.push({ campo: 'Saúde percebida', valorAnterior: this.formatAuditValue(anterior.saudePercebidaAnterior), valorNovo: this.formatAuditValue(item.saudePercebida) });
    }
    if (!alteracoes.length && !editado) alteracoes = [{ campo: 'Conteúdo', valorAnterior: null, valorNovo: item.conteudo }];
    return { evento, entidade, funcionalidade: 'Comunicação do projeto', autorAcao: audit?.usuario ?? item.autor ?? null, alteracoes };
  }

  private auditDetails(entidade: string, evento: string, dados: string | null, usuario: AnyRecord | null) {
    const financeiros = new Set(['ORCAMENTO', 'ORCAMENTO_CATEGORIA', 'CUSTO']);
    return {
      evento,
      entidade,
      funcionalidade: this.featureLabel(entidade),
      autorAcao: (usuario ?? null) as any,
      alteracoes: financeiros.has(entidade) ? [] : this.changesFromData(this.parseAuditData(dados))
    };
  }

  private parseAuditData(value: string | null | undefined): AnyRecord | null {
    if (!value) return null;
    try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null; }
    catch { return null; }
  }

  private changesFromData(data: AnyRecord | null): Array<{ campo: string; valorAnterior: string | null; valorNovo: string | null }> {
    if (!data) return [];
    const before = data.antes ?? data.anterior;
    const after = data.depois ?? data.novo;
    if (before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)) {
      return Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
        .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
        .map((key) => ({ campo: this.fieldLabel(key), valorAnterior: this.formatAuditValue(before[key]), valorNovo: this.formatAuditValue(after[key]) }));
    }
    return Object.entries(data).flatMap(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value) && ('anterior' in value || 'novo' in value)) {
        if (JSON.stringify(value.anterior) === JSON.stringify(value.novo)) return [];
        return [{ campo: this.fieldLabel(key), valorAnterior: this.formatAuditValue(value.anterior), valorNovo: this.formatAuditValue(value.novo) }];
      }
      return [{ campo: this.fieldLabel(key), valorAnterior: null, valorNovo: this.formatAuditValue(value) }];
    });
  }

  private fieldLabel(value: string): string {
    const labels: Record<string, string> = { conteudo: 'Conteúdo', saudePercebida: 'Saúde percebida', inicioEm: 'Início', fimEm: 'Fim',
      inicioPrevistoEm: 'Início previsto', fimPrevistoEm: 'Fim previsto', status: 'Status', situacao: 'Situação', responsavelId: 'Responsável',
      capacidadeMinutos: 'Capacidade', alocacaoMinutos: 'Alocação', quantidade: 'Quantidade', motivo: 'Motivo' };
    if (labels[value]) return labels[value];
    const humanized = value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').trim();
    return humanized ? humanized.charAt(0).toUpperCase() + humanized.slice(1).toLowerCase() : value;
  }

  private formatAuditValue(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    const labels: Record<string, string> = { EM_DIA: 'Em dia', EM_RISCO: 'Em risco', ATRASADO: 'Atrasado', true: 'Sim', false: 'Não' };
    const text = typeof value === 'string' ? value : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return labels[text] ?? text;
  }

  private featureLabel(entidade: string): string {
    const labels: Record<string, string> = {
      ATUALIZACAO: 'Comunicação do projeto', COMENTARIO: 'Comunicação do projeto', ANEXO: 'Comunicação do projeto',
      PROJETO: 'Cadastro de projetos', ITEM: 'Backlog de demandas', DEPENDENCIA: 'Cronograma e dependências', CRONOGRAMA: 'Cronograma e dependências',
      SPRINT: 'Sprints', MARCO: 'Marcos e entregas', ENTREGA: 'Marcos e entregas',
      CAPACIDADE: 'Grade de capacitação', ALOCACAO: 'Grade de capacitação', RECURSO: 'Cadastro de recursos',
      ORCAMENTO: 'Orçamento do projeto', ORCAMENTO_CATEGORIA: 'Orçamento do projeto', CUSTO: 'Orçamento do projeto'
    };
    return labels[entidade] ?? 'Gestão operacional de projetos';
  }
  private eventDescription(entity: string, event: string): string {
    const labels: Record<string, string> = { CRIADO: 'Registro criado', CRIADA: 'Registro criado', ALTERADO: 'Registro alterado', ALTERADA: 'Registro alterado',
      ARQUIVADO: 'Registro arquivado', ARQUIVADA: 'Registro arquivado', REATIVADO: 'Registro reativado', REATIVADA: 'Registro reativado',
      INICIADA: 'Sprint iniciada', CONCLUIDA: 'Atividade concluida', CANCELADA: 'Atividade cancelada', DATAS_ALTERADAS: 'Datas do cronograma alteradas' };
    return `${labels[event] || event.replace(/_/g, ' ').toLowerCase()} · ${entity.replace(/_/g, ' ').toLowerCase()}`;
  }

  private eventPriority(event: string): number {
    if (/^(EDITAD|ALTERAD|EXCLUID|ARQUIVAD|REATIVAD|DESALOCAD|DESATIVAD)/.test(event)) return 30;
    if (/^(PUBLICAD|CRIAD|ALOCAD|ATIVAD|VINCULAD)/.test(event)) return 10;
    return 20;
  }
  private audit(tx: Prisma.TransactionClient, contexto: ProjetoComunicacaoContexto, user: JwtPayload,
    entidade: string, entidadeId: string, evento: string, dados?: unknown): Promise<unknown> {
    return this.auditoria.registrar(tx, { empresaId: contexto.empresaId, projetoId: contexto.projeto.id,
      usuarioId: user.sub, entidade, entidadeId, evento, dados });
  }
}
