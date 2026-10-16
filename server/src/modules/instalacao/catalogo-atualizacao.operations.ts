import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { normalizeAndValidatePassword } from '../../common/security/password.policy';
import { mergeCatalogoField } from '../solucoes/policies/catalogo-lifecycle.policy';
import {
  catalogoActionSnapshot,
  catalogoFeatureSnapshot,
  catalogoSolutionSnapshot
} from '../solucoes/utils/catalogo-snapshot.util';
import {
  CatalogoProdutoManifest,
  FuncionalidadeProdutoDefinition,
  SolucaoProdutoDefinition
} from './manifesto/catalogo-produto';

type Snapshot = Record<string, unknown>;
type EntidadeCatalogo = 'SOLUCAO' | 'FUNCIONALIDADE' | 'ACAO';
type Relation = { solucaoId: number } | { funcionalidadeId: number } | { funcionalidadeAcaoId: number };

export type ResumoConvergenciaCatalogo = {
  solucoesCriadas: number;
  funcionalidadesCriadas: number;
  acoesCriadas: number;
  agrupamentosCriados: number;
  versoesRegistradas: number;
  rascunhosPropostos: number;
  senhaLegadaAtualizada: boolean;
  duplicidadeMesclada: boolean;
};

@Injectable()
export class CatalogoAtualizacaoOperations {
  constructor(private readonly configService: ConfigService) {}

  async convergirManifesto(
    database: Prisma.TransactionClient,
    manifesto: CatalogoProdutoManifest,
    atualizacaoId: string
  ): Promise<ResumoConvergenciaCatalogo> {
    const resumo: ResumoConvergenciaCatalogo = {
      solucoesCriadas: 0,
      funcionalidadesCriadas: 0,
      acoesCriadas: 0,
      agrupamentosCriados: 0,
      versoesRegistradas: 0,
      rascunhosPropostos: 0,
      senhaLegadaAtualizada: false,
      duplicidadeMesclada: false
    };

    resumo.duplicidadeMesclada = await this.mesclarCadastroSolucoesDuplicado(database, atualizacaoId);

    for (const definicaoSolucao of manifesto.solucoes) {
      const solucao = await this.garantirSolucao(
        database,
        definicaoSolucao,
        manifesto.versao,
        atualizacaoId,
        resumo
      );
      const funcionalidades = new Map<string, { id: number }>();

      for (const definicaoFuncionalidade of definicaoSolucao.funcionalidades) {
        const funcionalidade = await this.garantirFuncionalidade(
          database,
          solucao.id,
          definicaoFuncionalidade,
          manifesto.versao,
          atualizacaoId,
          resumo
        );
        funcionalidades.set(definicaoFuncionalidade.slug, funcionalidade);

        for (const definicaoAcao of definicaoFuncionalidade.acoes) {
          await this.garantirAcao(
            database,
            funcionalidade.id,
            definicaoAcao,
            manifesto.versao,
            atualizacaoId,
            resumo
          );
        }

        if (funcionalidade.criada) {
          await this.aplicarAcessoInicial(database, solucao.id, funcionalidade.id, definicaoFuncionalidade);
        }
      }

      for (const definicaoAgrupamento of definicaoSolucao.agrupamentos) {
        let agrupamento = await database.funcionalidadeAgrupamento.findUnique({
          where: { solucaoId_slug: { solucaoId: solucao.id, slug: definicaoAgrupamento.slug } }
        });
        if (!agrupamento) {
          agrupamento = await database.funcionalidadeAgrupamento.create({
            data: {
              chaveTecnica: `agrupamento.${definicaoSolucao.slug}.${definicaoAgrupamento.slug}`,
              solucaoId: solucao.id,
              slug: definicaoAgrupamento.slug,
              titulo: definicaoAgrupamento.titulo,
              label: definicaoAgrupamento.label,
              descricao: definicaoAgrupamento.descricao,
              ordem: definicaoAgrupamento.ordem,
              ativo: true,
              padraoSistema: true
            }
          });
          resumo.agrupamentosCriados += 1;
          await this.auditar(database, 'AGRUPAMENTO', agrupamento.id, null, JSON.stringify(agrupamento), atualizacaoId);
        }

        for (const [indice, slug] of definicaoAgrupamento.funcionalidades.entries()) {
          const funcionalidade = funcionalidades.get(slug);
          if (!funcionalidade) {
            throw new Error(`A funcionalidade ${definicaoSolucao.slug}.${slug} nao existe no manifesto congelado.`);
          }
          await database.funcionalidade.updateMany({
            where: { id: funcionalidade.id, agrupamentoId: null },
            data: { agrupamentoId: agrupamento.id, ordemNoAgrupamento: indice + 1 }
          });
        }
      }
    }

    resumo.senhaLegadaAtualizada = await this.atualizarSenhaLegada(database);
    return resumo;
  }

  async aposentarFuncionalidade(
    database: Prisma.TransactionClient,
    funcionalidadeId: number,
    atualizacaoId: string
  ): Promise<void> {
    const atual = await database.funcionalidade.findUniqueOrThrow({ where: { id: funcionalidadeId } });
    if (atual.statusPublicacao === 'DESPUBLICADA' && !atual.ativo) return;
    const atualizada = await database.funcionalidade.update({
      where: { id: funcionalidadeId },
      data: { ativo: false, statusPublicacao: 'DESPUBLICADA', revisaoCatalogo: { increment: 1 } }
    });
    await Promise.all([
      database.grupoFuncionalidadeAcao.deleteMany({ where: { funcionalidadeAcao: { funcionalidadeId } } }),
      database.grupoFuncionalidade.deleteMany({ where: { funcionalidadeId } }),
      database.empresaFuncionalidade.deleteMany({ where: { funcionalidadeId } })
    ]);
    await this.auditar(
      database,
      'FUNCIONALIDADE',
      funcionalidadeId,
      JSON.stringify(catalogoFeatureSnapshot(atual)),
      JSON.stringify(catalogoFeatureSnapshot(atualizada)),
      atualizacaoId
    );
  }

  async aposentarAcao(
    database: Prisma.TransactionClient,
    acaoId: number,
    atualizacaoId: string
  ): Promise<void> {
    const atual = await database.funcionalidadeAcao.findUniqueOrThrow({ where: { id: acaoId } });
    if (atual.statusPublicacao === 'DESPUBLICADA' && !atual.ativo) return;
    const atualizada = await database.funcionalidadeAcao.update({
      where: { id: acaoId },
      data: { ativo: false, statusPublicacao: 'DESPUBLICADA', revisaoCatalogo: { increment: 1 } }
    });
    await database.grupoFuncionalidadeAcao.deleteMany({ where: { funcionalidadeAcaoId: acaoId } });
    await this.auditar(
      database,
      'ACAO',
      acaoId,
      JSON.stringify(catalogoActionSnapshot(atual)),
      JSON.stringify(catalogoActionSnapshot(atualizada)),
      atualizacaoId
    );
  }

  async aposentarSolucao(
    database: Prisma.TransactionClient,
    solucaoId: number,
    atualizacaoId: string
  ): Promise<void> {
    const atual = await database.solucao.findUniqueOrThrow({ where: { id: solucaoId } });
    const funcionalidades = await database.funcionalidade.findMany({
      where: { solucaoId }, select: { id: true }
    });
    for (const funcionalidade of funcionalidades) {
      await this.aposentarFuncionalidade(database, funcionalidade.id, atualizacaoId);
    }
    const atualizada = await database.solucao.update({
      where: { id: solucaoId },
      data: { ativo: false, statusPublicacao: 'DESPUBLICADA', revisaoCatalogo: { increment: 1 } }
    });
    await Promise.all([
      database.grupoSolucao.deleteMany({ where: { solucaoId } }),
      database.empresaSolucao.deleteMany({ where: { solucaoId } })
    ]);
    await this.auditar(
      database,
      'SOLUCAO',
      solucaoId,
      JSON.stringify(catalogoSolutionSnapshot(atual)),
      JSON.stringify(catalogoSolutionSnapshot(atualizada)),
      atualizacaoId
    );
  }

  private async garantirSolucao(
    database: Prisma.TransactionClient,
    definicao: SolucaoProdutoDefinition,
    versaoManifesto: number,
    atualizacaoId: string,
    resumo: ResumoConvergenciaCatalogo
  ) {
    let solucao = await database.solucao.findUnique({ where: { slug: definicao.slug } });
    const criada = !solucao;
    if (!solucao) {
      solucao = await database.solucao.create({
        data: {
          chaveTecnica: `solucao.${definicao.slug}`,
          slug: definicao.slug,
          nome: definicao.nome,
          descricao: definicao.descricao,
          eyebrow: definicao.eyebrow,
          ordem: definicao.ordem,
          ativo: definicao.ativo,
          exibirNoHub: definicao.exibirNoHub,
          somenteAdminSistema: definicao.somenteAdminSistema,
          padraoSistema: true,
          versaoDefinicao: versaoManifesto,
          statusPublicacao: 'PUBLICADA',
          publicadoEm: new Date()
        }
      });
      resumo.solucoesCriadas += 1;
    }
    const efetivo = catalogoSolutionSnapshot(solucao) as unknown as Snapshot;
    const baseline = catalogoSolutionSnapshot(definicao) as unknown as Snapshot;
    const resultado = await this.garantirDefinicao(
      database,
      'SOLUCAO',
      solucao.id,
      { solucaoId: solucao.id },
      efetivo,
      baseline,
      versaoManifesto,
      atualizacaoId
    );
    resumo.versoesRegistradas += resultado.versaoRegistrada ? 1 : 0;
    resumo.rascunhosPropostos += resultado.rascunhoProposto ? 1 : 0;
    return { ...solucao, criada };
  }

  private async garantirFuncionalidade(
    database: Prisma.TransactionClient,
    solucaoId: number,
    definicao: FuncionalidadeProdutoDefinition,
    versaoManifesto: number,
    atualizacaoId: string,
    resumo: ResumoConvergenciaCatalogo
  ) {
    let funcionalidade = await database.funcionalidade.findUnique({
      where: { solucaoId_slug: { solucaoId, slug: definicao.slug } }
    });
    const criada = !funcionalidade;
    if (!funcionalidade) {
      funcionalidade = await database.funcionalidade.create({
        data: {
          chaveTecnica: definicao.registryKey,
          solucaoId,
          slug: definicao.slug,
          titulo: definicao.titulo,
          label: definicao.label,
          descricao: definicao.descricao,
          ordem: definicao.ordem,
          ativo: definicao.ativo,
          registryKey: definicao.registryKey,
          providerKey: definicao.providerKey,
          providerVersion: definicao.providerVersion,
          somenteAdminSistema: definicao.somenteAdminSistema,
          padraoSistema: true,
          versaoDefinicao: versaoManifesto,
          statusPublicacao: 'PUBLICADA',
          publicadoEm: new Date()
        }
      });
      resumo.funcionalidadesCriadas += 1;
    }
    const efetivo = catalogoFeatureSnapshot(funcionalidade) as unknown as Snapshot;
    const baseline = catalogoFeatureSnapshot({ ...definicao, solucaoId }) as unknown as Snapshot;
    const resultado = await this.garantirDefinicao(
      database,
      'FUNCIONALIDADE',
      funcionalidade.id,
      { funcionalidadeId: funcionalidade.id },
      efetivo,
      baseline,
      versaoManifesto,
      atualizacaoId
    );
    resumo.versoesRegistradas += resultado.versaoRegistrada ? 1 : 0;
    resumo.rascunhosPropostos += resultado.rascunhoProposto ? 1 : 0;
    return { ...funcionalidade, criada };
  }

  private async garantirAcao(
    database: Prisma.TransactionClient,
    funcionalidadeId: number,
    definicao: FuncionalidadeProdutoDefinition['acoes'][number],
    versaoManifesto: number,
    atualizacaoId: string,
    resumo: ResumoConvergenciaCatalogo
  ): Promise<void> {
    let acao = await database.funcionalidadeAcao.findUnique({
      where: { funcionalidadeId_chave: { funcionalidadeId, chave: definicao.chave } }
    });
    const criada = !acao;
    if (!acao) {
      acao = await database.funcionalidadeAcao.create({
        data: {
          funcionalidadeId,
          chave: definicao.chave,
          nome: definicao.nome,
          descricao: definicao.descricao ?? null,
          ordem: definicao.ordem,
          ativo: definicao.ativo,
          acaoPadrao: definicao.acaoPadrao ?? false,
          configuracao: definicao.configuracao ?? null,
          consumerKey: definicao.configuracao ?? definicao.chave,
          consumerVersion: 1,
          versaoDefinicao: versaoManifesto,
          statusPublicacao: 'PUBLICADA',
          publicadoEm: new Date()
        }
      });
      resumo.acoesCriadas += 1;
      const grupos = await database.grupoFuncionalidade.findMany({
        where: { funcionalidadeId }, select: { grupoId: true }
      });
      if (grupos.length) {
        await database.grupoFuncionalidadeAcao.createMany({
          data: grupos.map((grupo) => ({ grupoId: grupo.grupoId, funcionalidadeAcaoId: acao!.id, permitido: false }))
        });
      }
    }
    // A migration da 24.2 preencheu o consumidor das acoes legadas sem reescrever
    // snapshots historicos. A 0001 nao transforma essa diferenca tecnica em dezenas
    // de rascunhos; ela versiona a acao somente quando a adiciona ao catalogo.
    if (!criada) return;

    const consumidor = definicao.configuracao ?? definicao.chave;
    const efetivo = catalogoActionSnapshot(acao) as unknown as Snapshot;
    const baseline = catalogoActionSnapshot({
      funcionalidadeId,
      chave: definicao.chave,
      nome: definicao.nome,
      descricao: definicao.descricao ?? null,
      ordem: definicao.ordem,
      ativo: definicao.ativo,
      configuracao: definicao.configuracao ?? null,
      consumerKey: consumidor,
      consumerVersion: 1
    }) as unknown as Snapshot;
    const resultado = await this.garantirDefinicao(
      database,
      'ACAO',
      acao.id,
      { funcionalidadeAcaoId: acao.id },
      efetivo,
      baseline,
      versaoManifesto,
      atualizacaoId,
      criada
    );
    resumo.versoesRegistradas += resultado.versaoRegistrada ? 1 : 0;
    resumo.rascunhosPropostos += resultado.rascunhoProposto ? 1 : 0;
  }

  private async garantirDefinicao(
    database: Prisma.TransactionClient,
    entidade: EntidadeCatalogo,
    entidadeId: number,
    relation: Relation,
    efetivo: Snapshot,
    novoBaseline: Snapshot,
    versaoManifesto: number,
    atualizacaoId: string,
    registrarDefinicaoAusente = true
  ): Promise<{ versaoRegistrada: boolean; rascunhoProposto: boolean }> {
    const publicada = await database.catalogoVersao.findFirst({
      where: { ...relation, estado: 'PUBLICADA' }
    });
    const baselineSerializado = JSON.stringify(novoBaseline);
    if (!publicada) {
      if (!registrarDefinicaoAusente) {
        return { versaoRegistrada: false, rascunhoProposto: false };
      }
      const versao = await database.catalogoVersao.create({
        data: {
          ...relation,
          numero: 1,
          estado: 'PUBLICADA',
          origem: 'PRODUTO',
          revisao: 1,
          versaoDefinicao: versaoManifesto,
          snapshot: JSON.stringify(efetivo),
          baselineSnapshot: baselineSerializado,
          publicadoEm: new Date()
        }
      });
      await this.auditar(database, entidade, entidadeId, null, versao.snapshot, atualizacaoId, versao.id);
      return { versaoRegistrada: true, rascunhoProposto: false };
    }

    const rascunhoAtual = await database.catalogoVersao.findFirst({
      where: { ...relation, estado: 'RASCUNHO' }
    });
    const baselineAnterior = this.parse(
      rascunhoAtual?.baselineSnapshot ?? publicada.baselineSnapshot ?? publicada.snapshot
    );
    if (this.equal(baselineAnterior, novoBaseline)) {
      return { versaoRegistrada: false, rascunhoProposto: false };
    }

    const atual = rascunhoAtual ? this.parse(rascunhoAtual.snapshot) : efetivo;
    const mesclado: Snapshot = { ...atual };
    const conflitos: Array<{ campo: string; anterior: unknown; customizado: unknown; novo: unknown }> = [];
    for (const [campo, novo] of Object.entries(novoBaseline)) {
      const resultado = mergeCatalogoField(baselineAnterior[campo], atual[campo], novo);
      mesclado[campo] = resultado.value;
      if (resultado.conflict) {
        conflitos.push({ campo, anterior: baselineAnterior[campo], customizado: atual[campo], novo });
      }
    }

    const snapshotMesclado = JSON.stringify(mesclado);
    if (rascunhoAtual && rascunhoAtual.baselineSnapshot === baselineSerializado && rascunhoAtual.snapshot === snapshotMesclado) {
      return { versaoRegistrada: false, rascunhoProposto: false };
    }

    const ultima = await database.catalogoVersao.findFirst({ where: relation, orderBy: { numero: 'desc' } });
    const rascunho = rascunhoAtual
      ? await database.catalogoVersao.update({
          where: { id: rascunhoAtual.id },
          data: {
            snapshot: snapshotMesclado,
            baselineSnapshot: baselineSerializado,
            versaoDefinicao: versaoManifesto,
            revisao: { increment: 1 }
          }
        })
      : await database.catalogoVersao.create({
          data: {
            ...relation,
            numero: (ultima?.numero ?? 0) + 1,
            estado: 'RASCUNHO',
            origem: 'PRODUTO',
            revisao: 1,
            versaoDefinicao: versaoManifesto,
            snapshot: snapshotMesclado,
            baselineSnapshot: baselineSerializado,
            motivo: `Atualizacao da definicao pelo passo ${atualizacaoId}.`
          }
        });

    await database.catalogoConflito.deleteMany({ where: { versaoId: rascunho.id, estado: 'PENDENTE' } });
    for (const conflito of conflitos) {
      await database.catalogoConflito.create({
        data: {
          versaoId: rascunho.id,
          campo: conflito.campo,
          baselineAnterior: this.value(conflito.anterior),
          valorCustomizado: this.value(conflito.customizado),
          baselineNovo: this.value(conflito.novo)
        }
      });
    }
    await this.auditar(
      database,
      entidade,
      entidadeId,
      rascunhoAtual?.snapshot ?? publicada.snapshot,
      rascunho.snapshot,
      atualizacaoId,
      rascunho.id
    );
    return { versaoRegistrada: false, rascunhoProposto: true };
  }

  private async aplicarAcessoInicial(
    database: Prisma.TransactionClient,
    solucaoId: number,
    funcionalidadeId: number,
    definicao: FuncionalidadeProdutoDefinition
  ): Promise<void> {
    if (definicao.copiarAcessoDe) {
      const origem = await database.funcionalidade.findUnique({
        where: { solucaoId_slug: { solucaoId, slug: definicao.copiarAcessoDe } }
      });
      if (!origem) throw new Error(`A funcionalidade de origem ${definicao.copiarAcessoDe} nao existe.`);
      const [grupos, empresas, responsaveis, acoesOrigem, acoesDestino] = await Promise.all([
        database.grupoFuncionalidade.findMany({ where: { funcionalidadeId: origem.id } }),
        database.empresaFuncionalidade.findMany({ where: { funcionalidadeId: origem.id }, select: { empresaId: true } }),
        database.chamadoResponsavelFuncionalidade.findMany({ where: { funcionalidadeId: origem.id }, select: { responsavelSolucaoId: true, ativo: true } }),
        database.funcionalidadeAcao.findMany({ where: { funcionalidadeId: origem.id }, select: { id: true, chave: true } }),
        database.funcionalidadeAcao.findMany({ where: { funcionalidadeId }, select: { id: true, chave: true } })
      ]);
      if (grupos.length) await database.grupoFuncionalidade.createMany({ data: grupos.map((grupo) => ({ grupoId: grupo.grupoId, funcionalidadeId, podeVisualizar: grupo.podeVisualizar, podeIncluir: grupo.podeIncluir, podeAlterar: grupo.podeAlterar, podeExcluir: grupo.podeExcluir })) });
      if (empresas.length) await database.empresaFuncionalidade.createMany({ data: empresas.map((empresa) => ({ empresaId: empresa.empresaId, funcionalidadeId })) });
      if (responsaveis.length) await database.chamadoResponsavelFuncionalidade.createMany({ data: responsaveis.map((responsavel) => ({ ...responsavel, funcionalidadeId })) });
      const permissoes = acoesOrigem.length ? await database.grupoFuncionalidadeAcao.findMany({ where: { funcionalidadeAcaoId: { in: acoesOrigem.map((acao) => acao.id) } } }) : [];
      const chaveOrigem = new Map(acoesOrigem.map((acao) => [acao.id, acao.chave]));
      const idDestino = new Map(acoesDestino.map((acao) => [acao.chave, acao.id]));
      for (const permissao of permissoes) {
        const destinoId = idDestino.get(chaveOrigem.get(permissao.funcionalidadeAcaoId) ?? '');
        if (destinoId) await database.grupoFuncionalidadeAcao.upsert({
          where: { grupoId_funcionalidadeAcaoId: { grupoId: permissao.grupoId, funcionalidadeAcaoId: destinoId } },
          update: { permitido: permissao.permitido },
          create: { grupoId: permissao.grupoId, funcionalidadeAcaoId: destinoId, permitido: permissao.permitido }
        });
      }
      return;
    }

    const empresas = await database.empresaSolucao.findMany({ where: { solucaoId }, select: { empresaId: true } });
    if (empresas.length) await database.empresaFuncionalidade.createMany({ data: empresas.map((empresa) => ({ empresaId: empresa.empresaId, funcionalidadeId })) });
    if (definicao.acessoInicial === 'SOMENTE_ADMINISTRADORES') return;

    const grupos = await database.grupoSolucao.findMany({
      where: { solucaoId }, include: { grupo: true }
    });
    if (grupos.length) {
      await database.grupoFuncionalidade.createMany({
        data: grupos.map(({ grupoId, grupo }) => ({
          grupoId,
          funcionalidadeId,
          podeVisualizar: grupo.podeVisualizar,
          podeIncluir: grupo.podeIncluir,
          podeAlterar: grupo.podeAlterar,
          podeExcluir: grupo.podeExcluir
        }))
      });
      const acoes = await database.funcionalidadeAcao.findMany({
        where: { funcionalidadeId }, select: { id: true }
      });
      if (acoes.length) {
        await database.grupoFuncionalidadeAcao.createMany({
          data: grupos.flatMap(({ grupoId }) =>
            acoes.map((acao) => ({ grupoId, funcionalidadeAcaoId: acao.id, permitido: false }))
          )
        });
      }
    }
  }

  private async mesclarCadastroSolucoesDuplicado(
    database: Prisma.TransactionClient,
    atualizacaoId: string
  ): Promise<boolean> {
    const configurador = await database.solucao.findUnique({ where: { slug: 'configurador' }, select: { id: true } });
    if (!configurador) return false;
    const duplicada = await database.funcionalidade.findUnique({
      where: { solucaoId_slug: { solucaoId: configurador.id, slug: 'cadastro-de-soluções' } }
    });
    if (!duplicada) return false;
    const alvo = await database.funcionalidade.findUnique({
      where: { solucaoId_slug: { solucaoId: configurador.id, slug: 'cadastro-de-solucoes' } }
    });
    if (!alvo) {
      const renomeada = await database.funcionalidade.update({
        where: { id: duplicada.id }, data: { slug: 'cadastro-de-solucoes' }
      });
      await this.auditar(
        database,
        'FUNCIONALIDADE',
        renomeada.id,
        JSON.stringify(catalogoFeatureSnapshot(duplicada)),
        JSON.stringify(catalogoFeatureSnapshot(renomeada)),
        atualizacaoId
      );
      return true;
    }

    const [grupos, empresas, responsaveis, acoesDuplicadas] = await Promise.all([
      database.grupoFuncionalidade.findMany({ where: { funcionalidadeId: duplicada.id } }),
      database.empresaFuncionalidade.findMany({ where: { funcionalidadeId: duplicada.id } }),
      database.chamadoResponsavelFuncionalidade.findMany({ where: { funcionalidadeId: duplicada.id } }),
      database.funcionalidadeAcao.findMany({ where: { funcionalidadeId: duplicada.id } })
    ]);
    for (const grupo of grupos) {
      await database.grupoFuncionalidade.upsert({
        where: { grupoId_funcionalidadeId: { grupoId: grupo.grupoId, funcionalidadeId: alvo.id } },
        update: {},
        create: {
          grupoId: grupo.grupoId,
          funcionalidadeId: alvo.id,
          podeVisualizar: grupo.podeVisualizar,
          podeIncluir: grupo.podeIncluir,
          podeAlterar: grupo.podeAlterar,
          podeExcluir: grupo.podeExcluir
        }
      });
    }
    for (const empresa of empresas) {
      await database.empresaFuncionalidade.upsert({
        where: { empresaId_funcionalidadeId: { empresaId: empresa.empresaId, funcionalidadeId: alvo.id } },
        update: {},
        create: { empresaId: empresa.empresaId, funcionalidadeId: alvo.id }
      });
    }
    for (const responsavel of responsaveis) {
      await database.chamadoResponsavelFuncionalidade.upsert({
        where: {
          responsavelSolucaoId_funcionalidadeId: {
            responsavelSolucaoId: responsavel.responsavelSolucaoId,
            funcionalidadeId: alvo.id
          }
        },
        update: {},
        create: {
          responsavelSolucaoId: responsavel.responsavelSolucaoId,
          funcionalidadeId: alvo.id,
          ativo: responsavel.ativo
        }
      });
    }
    await Promise.all([
      database.chamado.updateMany({ where: { funcionalidadeId: duplicada.id }, data: { funcionalidadeId: alvo.id } }),
      database.catalogoVersao.updateMany({ where: { funcionalidadeId: duplicada.id }, data: { funcionalidadeId: alvo.id } }),
      database.catalogoAuditoria.updateMany({
        where: { entidade: 'FUNCIONALIDADE', entidadeId: duplicada.id },
        data: { entidadeId: alvo.id }
      })
    ]);

    for (const acaoDuplicada of acoesDuplicadas) {
      const acaoAlvo = await database.funcionalidadeAcao.findUnique({
        where: { funcionalidadeId_chave: { funcionalidadeId: alvo.id, chave: acaoDuplicada.chave } }
      });
      if (!acaoAlvo) {
        await database.funcionalidadeAcao.update({
          where: { id: acaoDuplicada.id }, data: { funcionalidadeId: alvo.id }
        });
        continue;
      }
      const permissoes = await database.grupoFuncionalidadeAcao.findMany({
        where: { funcionalidadeAcaoId: acaoDuplicada.id }
      });
      for (const permissao of permissoes) {
        await database.grupoFuncionalidadeAcao.upsert({
          where: {
            grupoId_funcionalidadeAcaoId: {
              grupoId: permissao.grupoId,
              funcionalidadeAcaoId: acaoAlvo.id
            }
          },
          update: {},
          create: {
            grupoId: permissao.grupoId,
            funcionalidadeAcaoId: acaoAlvo.id,
            permitido: permissao.permitido
          }
        });
      }
      await Promise.all([
        database.catalogoVersao.updateMany({
          where: { funcionalidadeAcaoId: acaoDuplicada.id },
          data: { funcionalidadeAcaoId: acaoAlvo.id }
        }),
        database.catalogoAuditoria.updateMany({
          where: { entidade: 'ACAO', entidadeId: acaoDuplicada.id },
          data: { entidadeId: acaoAlvo.id }
        })
      ]);
      await database.funcionalidadeAcao.delete({ where: { id: acaoDuplicada.id } });
    }
    await this.auditar(
      database,
      'FUNCIONALIDADE',
      alvo.id,
      JSON.stringify(catalogoFeatureSnapshot(duplicada)),
      JSON.stringify(catalogoFeatureSnapshot(alvo)),
      atualizacaoId
    );
    await database.funcionalidade.delete({ where: { id: duplicada.id } });
    return true;
  }

  private async atualizarSenhaLegada(database: Prisma.TransactionClient): Promise<boolean> {
    const administrador = await database.usuario.findFirst({
      where: { padraoSistema: true },
      select: { id: true, senhaHash: true }
    });
    if (!administrador) return false;
    const legada = await compare('admin', administrador.senhaHash) || await compare('admin123', administrador.senhaHash);
    if (!legada) return false;
    const configurada = this.configService.get<string>('INITIAL_ADMIN_PASSWORD');
    if (!configurada) {
      throw new Error('INITIAL_ADMIN_PASSWORD is required to secure the legacy administrator.');
    }
    const senha = normalizeAndValidatePassword(configurada);
    await database.usuario.update({
      where: { id: administrador.id },
      data: { senhaHash: await hash(senha, 10), deveAlterarSenha: true, sessaoVersao: { increment: 1 } }
    });
    return true;
  }

  private auditar(
    database: Prisma.TransactionClient,
    entidade: string,
    entidadeId: number,
    antes: string | null,
    depois: string | null,
    atualizacaoId: string,
    versaoId?: string
  ) {
    return database.catalogoAuditoria.create({
      data: { versaoId, entidade, entidadeId, evento: 'ATUALIZACAO_PRODUTO', antes, depois, motivo: atualizacaoId }
    });
  }

  private parse(valor: string): Snapshot { return JSON.parse(valor) as Snapshot; }
  private equal(esquerda: Snapshot, direita: Snapshot): boolean { return JSON.stringify(esquerda) === JSON.stringify(direita); }
  private value(valor: unknown): string | null { return valor === undefined || valor === null ? null : JSON.stringify(valor); }
}
