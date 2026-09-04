import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type AnyRecord = Record<string, any>;

type ProjetoFeedEvento = {
  entidade: string;
  entidadeId: string;
  dados?: string | null;
};

type ProjetoFeedProjeto = {
  id: string;
  chave: string;
  nome: string;
};

type EventoComDados = ProjetoFeedEvento & {
  dadosConvertidos: AnyRecord | null;
};

type ProjetoFeedReferencias = {
  registros: Map<string, string>;
  contextos: Map<string, string>;
};

@Injectable()
export class ProjetoFeedRegistroService {
  constructor(private readonly prisma: PrismaService) {}

  async resolver(
    projeto: ProjetoFeedProjeto,
    empresaId: number,
    eventos: ProjetoFeedEvento[]
  ): Promise<ProjetoFeedReferencias> {
    const eventosComDados = eventos.map((evento) => ({
      ...evento,
      dadosConvertidos: this.parseDados(evento.dados)
    }));
    const idsPorEntidade = this.idsPorEntidade(eventosComDados);

    const resultados = await Promise.all([
      this.buscarQuando(idsPorEntidade.get('ITEM'), () => this.prisma.projetoItem.findMany({
        where: { empresaId, projetoId: projeto.id, id: { in: [...(idsPorEntidade.get('ITEM') ?? [])] } },
        select: { id: true, chave: true, titulo: true, paiId: true }
      })),
      this.buscarQuando(idsPorEntidade.get('DEPENDENCIA'), () => this.prisma.projetoItemDependencia.findMany({
        where: { empresaId, projetoId: projeto.id, id: { in: [...(idsPorEntidade.get('DEPENDENCIA') ?? [])] } },
        select: { id: true, bloqueadorId: true, bloqueadoId: true }
      })),
      this.buscarQuando(idsPorEntidade.get('SPRINT'), () => this.prisma.projetoSprint.findMany({
        where: { empresaId, projetoId: projeto.id, id: { in: [...(idsPorEntidade.get('SPRINT') ?? [])] } },
        select: { id: true, nome: true }
      })),
      this.buscarQuando(idsPorEntidade.get('MARCO'), () => this.prisma.projetoMarco.findMany({
        where: { empresaId, projetoId: projeto.id, id: { in: [...(idsPorEntidade.get('MARCO') ?? [])] } },
        select: { id: true, nome: true }
      })),
      this.buscarQuando(idsPorEntidade.get('ENTREGA'), () => this.prisma.projetoEntrega.findMany({
        where: { empresaId, projetoId: projeto.id, id: { in: [...(idsPorEntidade.get('ENTREGA') ?? [])] } },
        select: { id: true, nome: true, marcoId: true }
      })),
      this.buscarQuando(idsPorEntidade.get('RECURSO'), () => this.prisma.recurso.findMany({
        where: { empresaId, id: { in: [...(idsPorEntidade.get('RECURSO') ?? [])] } },
        select: { id: true, usuarioId: true }
      })),

      this.buscarQuando(idsPorEntidade.get('ORCAMENTO'), () => this.prisma.projetoOrcamento.findMany({
        where: { empresaId, projetoId: projeto.id, id: { in: [...(idsPorEntidade.get('ORCAMENTO') ?? [])] } },
        select: { id: true }
      })),
      this.buscarQuando(idsPorEntidade.get('ORCAMENTO_CATEGORIA'), () => this.prisma.projetoOrcamentoCategoria.findMany({
        where: { empresaId, projetoId: projeto.id, id: { in: [...(idsPorEntidade.get('ORCAMENTO_CATEGORIA') ?? [])] } },
        select: { id: true, nome: true }
      })),
      this.buscarQuando(idsPorEntidade.get('CUSTO'), () => this.prisma.projetoCusto.findMany({
        where: { empresaId, projetoId: projeto.id, id: { in: [...(idsPorEntidade.get('CUSTO') ?? [])] } },
        select: { id: true, descricao: true, categoriaId: true }
      })),
      this.buscarQuando(idsPorEntidade.get('COMENTARIO'), () => this.prisma.projetoComentario.findMany({
        where: { empresaId, projetoId: projeto.id, id: { in: [...(idsPorEntidade.get('COMENTARIO') ?? [])] } },
        select: { id: true, conteudo: true, atualizacaoId: true, itemId: true }
      })),
      this.buscarQuando(idsPorEntidade.get('ANEXO'), () => this.prisma.projetoAnexo.findMany({
        where: { empresaId, projetoId: projeto.id, id: { in: [...(idsPorEntidade.get('ANEXO') ?? [])] } },
        select: { id: true, nomeOriginal: true, atualizacaoId: true, comentarioId: true }
      }))
    ]) as AnyRecord[][];
    const [itensIniciais = [], dependencias = [], sprints = [], marcos = [], entregas = [], recursosIniciais = [],
      orcamentos = [], categorias = [], custos = [], comentarios = [], anexos = []] = resultados;

    const comentarioIds = new Set<string>(comentarios.map((item) => item.id));
    anexos.forEach((item) => this.adicionarTexto(comentarioIds, item.comentarioId));
    const comentariosAdicionais = comentarioIds.size === comentarios.length ? [] : await this.prisma.projetoComentario.findMany({
      where: { empresaId, projetoId: projeto.id, id: { in: [...comentarioIds] } },
      select: { id: true, conteudo: true, atualizacaoId: true, itemId: true }
    });
    const comentarioPorId = new Map<string, AnyRecord>([...comentarios, ...comentariosAdicionais].map((item) => [item.id, item]));

    const atualizacaoIds = new Set<string>(idsPorEntidade.get('ATUALIZACAO') ?? []);
    comentarioPorId.forEach((item) => this.adicionarTexto(atualizacaoIds, item.atualizacaoId));
    anexos.forEach((item) => this.adicionarTexto(atualizacaoIds, item.atualizacaoId));
    const atualizacoes = atualizacaoIds.size ? await this.prisma.projetoAtualizacao.findMany({
      where: { empresaId, projetoId: projeto.id, id: { in: [...atualizacaoIds] } },
      select: { id: true, conteudo: true }
    }) : [];
    const atualizacaoPorId = new Map<string, AnyRecord>(atualizacoes.map((item) => [item.id, item]));

    const itemIds = new Set<string>(itensIniciais.map((item) => item.id));
    itensIniciais.forEach((item) => this.adicionarTexto(itemIds, item.paiId));
    dependencias.forEach((item) => {
      itemIds.add(item.bloqueadorId);
      itemIds.add(item.bloqueadoId);
    });
    comentarioPorId.forEach((item) => this.adicionarTexto(itemIds, item.itemId));
    eventosComDados.filter((item) => item.entidade === 'DEPENDENCIA').forEach((item) => {
      this.adicionarTexto(itemIds, this.valor(item.dadosConvertidos, 'bloqueadorId'));
      this.adicionarTexto(itemIds, this.valor(item.dadosConvertidos, 'bloqueadoId'));
    });
    const itensAdicionais = itemIds.size === itensIniciais.length ? [] : await this.prisma.projetoItem.findMany({
      where: { empresaId, projetoId: projeto.id, id: { in: [...itemIds] } },
      select: { id: true, chave: true, titulo: true, paiId: true }
    });
    const itens = new Map<string, AnyRecord>([...itensIniciais, ...itensAdicionais].map((item) => [item.id, item]));
    await this.completarAncestrais(itens, empresaId, projeto.id);

    const marcoIds = new Set<string>(marcos.map((item) => item.id));
    entregas.forEach((item) => this.adicionarTexto(marcoIds, item.marcoId));
    const marcosAdicionais = marcoIds.size === marcos.length ? [] : await this.prisma.projetoMarco.findMany({
      where: { empresaId, projetoId: projeto.id, id: { in: [...marcoIds] } },
      select: { id: true, nome: true }
    });
    const marcoPorId = new Map<string, AnyRecord>([...marcos, ...marcosAdicionais].map((item) => [item.id, item]));

    const categoriaIds = new Set<string>(categorias.map((item) => item.id));
    custos.forEach((item) => this.adicionarTexto(categoriaIds, item.categoriaId));
    eventosComDados.filter((item) => item.entidade === 'CUSTO').forEach((item) => this.adicionarTexto(categoriaIds, this.valor(item.dadosConvertidos, 'categoriaId')));
    const categoriasAdicionais = categoriaIds.size === categorias.length ? [] : await this.prisma.projetoOrcamentoCategoria.findMany({
      where: { empresaId, projetoId: projeto.id, id: { in: [...categoriaIds] } },
      select: { id: true, nome: true }
    });
    const categoriaPorId = new Map<string, AnyRecord>([...categorias, ...categoriasAdicionais].map((item) => [item.id, item]));

    const projetoRecursoIds = new Set<string>();
    eventosComDados.forEach((item) => this.adicionarTexto(projetoRecursoIds, this.valor(item.dadosConvertidos, 'projetoRecursoId')));
    const projetosRecursos = projetoRecursoIds.size ? await this.prisma.projetoRecurso.findMany({
      where: { empresaId, projetoId: projeto.id, id: { in: [...projetoRecursoIds] } },
      select: { id: true, recursoId: true }
    }) : [];
    const projetoRecursoPorId = new Map<string, AnyRecord>(projetosRecursos.map((item) => [item.id, item]));

    const recursoIds = new Set<string>([
      ...recursosIniciais.map((item) => item.id),
      ...projetosRecursos.map((item) => item.recursoId)
    ]);
    const recursosAdicionais = recursoIds.size === recursosIniciais.length ? [] : await this.prisma.recurso.findMany({
      where: { empresaId, id: { in: [...recursoIds] } },
      select: { id: true, usuarioId: true }
    });
    const recursos = new Map<string, AnyRecord>([...recursosIniciais, ...recursosAdicionais].map((item) => [item.id, item]));

    const usuarioIds = new Set<string>([...recursos.values()].map((item) => item.usuarioId));
    eventosComDados.forEach((item) => this.adicionarTexto(usuarioIds, this.valor(item.dadosConvertidos, 'usuarioId')));
    const usuarios = usuarioIds.size ? await this.prisma.usuario.findMany({
      where: { id: { in: [...usuarioIds] } },
      select: { id: true, nome: true, login: true, email: true }
    }) : [];
    const usuarioPorId = new Map<string, AnyRecord>(usuarios.map((item) => [item.id, item]));

    const registros = new Map<string, string>();
    registros.set(this.chave('PROJETO', projeto.id), `${projeto.chave} — ${projeto.nome}`);
    itens.forEach((item) => registros.set(this.chave('ITEM', item.id), `${item.chave} — ${item.titulo}`));
    dependencias.forEach((item) => {
      const bloqueador = itens.get(item.bloqueadorId);
      const bloqueado = itens.get(item.bloqueadoId);
      if (bloqueador && bloqueado) registros.set(this.chave('DEPENDENCIA', item.id), `${bloqueador.chave} — ${bloqueador.titulo} → ${bloqueado.chave} — ${bloqueado.titulo}`);
    });
    sprints.forEach((item) => registros.set(this.chave('SPRINT', item.id), item.nome));
    marcoPorId.forEach((item) => registros.set(this.chave('MARCO', item.id), item.nome));
    entregas.forEach((item) => registros.set(this.chave('ENTREGA', item.id), item.nome));
    recursos.forEach((item) => {
      const nome = this.usuarioLabel(usuarioPorId.get(item.usuarioId));
      if (nome) registros.set(this.chave('RECURSO', item.id), nome);
    });

    orcamentos.forEach((item) => registros.set(this.chave('ORCAMENTO', item.id), `Orçamento — ${projeto.chave} — ${projeto.nome}`));
    categoriaPorId.forEach((item) => registros.set(this.chave('ORCAMENTO_CATEGORIA', item.id), item.nome));
    custos.forEach((item) => registros.set(this.chave('CUSTO', item.id), item.descricao));
    comentarioPorId.forEach((item) => registros.set(this.chave('COMENTARIO', item.id), this.resumo(item.conteudo)));
    anexos.forEach((item) => registros.set(this.chave('ANEXO', item.id), item.nomeOriginal));

    const projetoContexto = `${projeto.chave} — ${projeto.nome}`;
    const contextos = new Map<string, string>(eventosComDados.map((item) => [this.chave(item.entidade, item.entidadeId), projetoContexto]));
    itens.forEach((item) => {
      contextos.set(
        this.chave('ITEM', item.id),
        this.trilha(projetoContexto, ...this.cadeiaItem(item, itens, false))
      );
    });
    dependencias.forEach((item) => contextos.set(this.chave('DEPENDENCIA', item.id), projetoContexto));
    sprints.forEach((item) => contextos.set(this.chave('SPRINT', item.id), projetoContexto));
    marcoPorId.forEach((item) => contextos.set(this.chave('MARCO', item.id), projetoContexto));
    entregas.forEach((item) => contextos.set(this.chave('ENTREGA', item.id), this.trilha(projetoContexto, item.marcoId ? marcoPorId.get(item.marcoId)?.nome : '')));
    recursos.forEach((item) => contextos.set(this.chave('RECURSO', item.id), projetoContexto));

    orcamentos.forEach((item) => contextos.set(this.chave('ORCAMENTO', item.id), projetoContexto));
    categoriaPorId.forEach((item) => contextos.set(this.chave('ORCAMENTO_CATEGORIA', item.id), this.trilha(projetoContexto, 'Orçamento')));
    custos.forEach((item) => contextos.set(this.chave('CUSTO', item.id), this.trilha(projetoContexto, 'Orçamento', item.categoriaId ? categoriaPorId.get(item.categoriaId)?.nome : '')));
    atualizacaoPorId.forEach((item) => contextos.set(this.chave('ATUALIZACAO', item.id), projetoContexto));
    comentarioPorId.forEach((item) => {
      const contextoPai = item.itemId
        ? this.trilha(
            projetoContexto,
            ...this.cadeiaItem(itens.get(item.itemId), itens, true)
          )
        : item.atualizacaoId
          ? this.trilha(projetoContexto, this.atualizacaoLabel(atualizacaoPorId.get(item.atualizacaoId)))
          : projetoContexto;
      contextos.set(this.chave('COMENTARIO', item.id), contextoPai);
    });
    anexos.forEach((item) => {
      if (item.comentarioId) {
        const comentario = comentarioPorId.get(item.comentarioId);
        const pai = contextos.get(this.chave('COMENTARIO', item.comentarioId)) ?? projetoContexto;
        contextos.set(this.chave('ANEXO', item.id), this.trilha(pai, comentario ? `Comentário: ${this.resumo(comentario.conteudo)}` : ''));
      } else if (item.atualizacaoId) {
        contextos.set(this.chave('ANEXO', item.id), this.trilha(projetoContexto, this.atualizacaoLabel(atualizacaoPorId.get(item.atualizacaoId))));
      } else {
        contextos.set(this.chave('ANEXO', item.id), projetoContexto);
      }
    });

    for (const evento of eventosComDados) {
      const chave = this.chave(evento.entidade, evento.entidadeId);
      if (!registros.has(chave)) {
        const nome = this.nomeDosDados(evento, projeto, itens, projetoRecursoPorId, recursos, usuarioPorId);
        if (nome) registros.set(chave, nome);
      }
      if (evento.entidade === 'CUSTO') {
        const categoriaId = String(this.valor(evento.dadosConvertidos, 'categoriaId') ?? '');
        contextos.set(chave, this.trilha(projetoContexto, 'Orçamento', categoriaId ? categoriaPorId.get(categoriaId)?.nome : ''));
      }
      if (evento.entidade === 'ANEXO' && evento.entidadeId.includes(',')) {
        const ids = evento.entidadeId.split(',').map((id) => id.trim());
        const nomes = ids.map((id) => registros.get(this.chave('ANEXO', id))).filter(Boolean);
        const primeiroContexto = ids.map((id) => contextos.get(this.chave('ANEXO', id))).find(Boolean);
        if (nomes.length) registros.set(chave, nomes.join(', '));
        if (primeiroContexto) contextos.set(chave, primeiroContexto);
      }
    }

    return { registros, contextos };
  }

  chave(entidade: string, entidadeId: string): string {
    return `${entidade}:${entidadeId}`;
  }

  resumo(value: unknown, limite = 140): string {
    const texto = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
    if (!texto) return '';
    return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
  }

  private idsPorEntidade(eventos: EventoComDados[]): Map<string, Set<string>> {
    const resultado = new Map<string, Set<string>>();
    eventos.forEach((evento) => {
      const ids = evento.entidade === 'ANEXO' ? evento.entidadeId.split(',') : [evento.entidadeId];
      ids.map((id) => id.trim()).filter(Boolean).forEach((id) => {
        if (!resultado.has(evento.entidade)) resultado.set(evento.entidade, new Set());
        resultado.get(evento.entidade)!.add(id);
      });
    });
    return resultado;
  }

  private async buscarQuando<T>(ids: Set<string> | undefined, buscar: () => PromiseLike<T[]>): Promise<T[]> {
    return ids?.size ? buscar() : [];
  }

  private async completarAncestrais(
    itens: Map<string, AnyRecord>,
    empresaId: number,
    projetoId: string
  ): Promise<void> {
    const consultados = new Set<string>();
    while (true) {
      const paisAusentes = new Set<string>();
      itens.forEach((item) => {
        if (
          item.paiId &&
          !itens.has(item.paiId) &&
          !consultados.has(item.paiId)
        ) {
          paisAusentes.add(item.paiId);
        }
      });
      if (!paisAusentes.size) return;
      paisAusentes.forEach((id) => consultados.add(id));

      const pais = await this.prisma.projetoItem.findMany({
        where: {
          empresaId,
          projetoId,
          id: { in: [...paisAusentes] }
        },
        select: { id: true, chave: true, titulo: true, paiId: true }
      });
      pais.forEach((item) => itens.set(item.id, item));
    }
  }

  private cadeiaItem(
    item: AnyRecord | undefined,
    itens: Map<string, AnyRecord>,
    incluirItem: boolean
  ): string[] {
    const partes: string[] = [];
    const visitados = new Set<string>();
    let atual = incluirItem ? item : item?.paiId ? itens.get(item.paiId) : undefined;

    while (atual && !visitados.has(atual.id)) {
      visitados.add(atual.id);
      partes.unshift(`${atual.chave} — ${atual.titulo}`);
      atual = atual.paiId ? itens.get(atual.paiId) : undefined;
    }
    return partes;
  }

  private nomeDosDados(
    evento: EventoComDados,
    projeto: ProjetoFeedProjeto,
    itens: Map<string, AnyRecord>,
    projetoRecursoPorId: Map<string, AnyRecord>,
    recursos: Map<string, AnyRecord>,
    usuarios: Map<string, AnyRecord>
  ): string {
    const dados = evento.dadosConvertidos;
    if (!dados) return '';
    const registro = this.resumo(this.valor(dados, 'registro'));
    if (registro) return registro;
    if (evento.entidade === 'PROJETO') return `${projeto.chave} — ${projeto.nome}`;
    if (evento.entidade === 'ITEM') {
      const chave = this.resumo(this.valor(dados, 'chave'));
      const titulo = this.resumo(this.valor(dados, 'titulo'));
      return [chave, titulo].filter(Boolean).join(' — ');
    }
    if (evento.entidade === 'DEPENDENCIA') {
      const bloqueador = itens.get(String(this.valor(dados, 'bloqueadorId') ?? ''));
      const bloqueado = itens.get(String(this.valor(dados, 'bloqueadoId') ?? ''));
      return bloqueador && bloqueado ? `${bloqueador.chave} — ${bloqueador.titulo} → ${bloqueado.chave} — ${bloqueado.titulo}` : '';
    }
    if (['SPRINT', 'MARCO', 'ENTREGA', 'ORCAMENTO_CATEGORIA'].includes(evento.entidade)) {
      return this.resumo(this.valor(dados, 'nome'));
    }
    if (evento.entidade === 'CUSTO') return this.resumo(this.valor(dados, 'descricao'));
    if (evento.entidade === 'RECURSO') return this.usuarioLabel(usuarios.get(String(this.valor(dados, 'usuarioId') ?? '')));
    if (evento.entidade === 'ORCAMENTO') return `Orçamento — ${projeto.chave} — ${projeto.nome}`;
    if (evento.entidade === 'ANEXO') return this.resumo(this.valor(dados, 'nomeOriginal'));
    return this.resumo(this.valor(dados, 'nome')) || this.resumo(this.valor(dados, 'titulo')) || this.resumo(this.valor(dados, 'descricao'));
  }

  private trilha(...partes: Array<string | null | undefined>): string {
    return partes.filter((item): item is string => !!item?.trim()).join(' › ');
  }

  private atualizacaoLabel(item: AnyRecord | undefined): string {
    const resumo = this.resumo(item?.conteudo);
    return resumo ? `Atualização: ${resumo}` : '';
  }

  private nomeRecursoProjeto(
    projetoRecursoId: string,
    projetoRecursos: Map<string, AnyRecord>,
    recursos: Map<string, AnyRecord>,
    usuarios: Map<string, AnyRecord>
  ): string {
    const recursoId = projetoRecursos.get(projetoRecursoId)?.recursoId;
    const usuarioId = recursoId ? recursos.get(recursoId)?.usuarioId : null;
    return usuarioId ? this.usuarioLabel(usuarios.get(usuarioId)) : '';
  }

  private usuarioLabel(usuario: AnyRecord | undefined): string {
    return usuario?.nome || usuario?.login || usuario?.email || '';
  }

  private valor(dados: AnyRecord | null, campo: string): unknown {
    const value = dados?.[campo];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('novo' in value) return value.novo;
      if ('depois' in value) return value.depois;
      if ('anterior' in value) return value.anterior;
    }
    return value;
  }

  private adicionarTexto(destino: Set<string>, value: unknown): void {
    if (typeof value === 'string' && value.trim()) destino.add(value.trim());
  }

  private parseDados(value: string | null | undefined): AnyRecord | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}
