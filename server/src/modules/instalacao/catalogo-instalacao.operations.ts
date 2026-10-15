import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CATALOGO_PRODUTO,
  SolucaoProdutoDefinition
} from './manifesto/catalogo-produto';
import {
  catalogoActionSnapshot,
  catalogoFeatureSnapshot,
  catalogoSolutionSnapshot
} from '../solucoes/utils/catalogo-snapshot.util';

export type CatalogoInstalado = {
  solucoes: Array<{ id: number; slug: string; ativo: boolean }>;
  funcionalidades: Array<{ id: number; solucaoId: number; slug: string; ativo: boolean }>;
  acoes: Array<{ id: number; funcionalidadeId: number; ativo: boolean }>;
};

@Injectable()
export class CatalogoInstalacaoOperations {
  async criarCatalogo(
    database: Prisma.TransactionClient,
    publicadoEm: Date
  ): Promise<CatalogoInstalado> {
    const instalado: CatalogoInstalado = {
      solucoes: [],
      funcionalidades: [],
      acoes: []
    };

    for (const definicao of CATALOGO_PRODUTO.solucoes) {
      await this.criarSolucao(database, definicao, publicadoEm, instalado);
    }

    return instalado;
  }

  private async criarSolucao(
    database: Prisma.TransactionClient,
    definicao: SolucaoProdutoDefinition,
    publicadoEm: Date,
    instalado: CatalogoInstalado
  ): Promise<void> {
    const solucao = await database.solucao.create({
      data: {
        // Chave técnica estável: a mesma em todas as instalações, ao contrário do UUID gerado por padrão.
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
        versaoDefinicao: CATALOGO_PRODUTO.versao,
        statusPublicacao: 'PUBLICADA',
        publicadoEm
      }
    });
    instalado.solucoes.push({ id: solucao.id, slug: solucao.slug, ativo: solucao.ativo });

    const snapshotSolucao = JSON.stringify(catalogoSolutionSnapshot(solucao));
    await this.registrarVersao(database, {
      entidade: 'SOLUCAO',
      entidadeId: solucao.id,
      publicadoEm,
      snapshot: snapshotSolucao,
      relation: { solucaoId: solucao.id }
    });

    const funcionalidadePorSlug = new Map<string, number>();
    for (const definicaoFuncionalidade of definicao.funcionalidades) {
      const funcionalidade = await database.funcionalidade.create({
        data: {
          chaveTecnica: definicaoFuncionalidade.registryKey,
          solucaoId: solucao.id,
          slug: definicaoFuncionalidade.slug,
          titulo: definicaoFuncionalidade.titulo,
          label: definicaoFuncionalidade.label,
          descricao: definicaoFuncionalidade.descricao,
          ordem: definicaoFuncionalidade.ordem,
          ativo: definicaoFuncionalidade.ativo,
          registryKey: definicaoFuncionalidade.registryKey,
          providerKey: definicaoFuncionalidade.providerKey,
          providerVersion: definicaoFuncionalidade.providerVersion,
          somenteAdminSistema: definicaoFuncionalidade.somenteAdminSistema,
          padraoSistema: true,
          versaoDefinicao: CATALOGO_PRODUTO.versao,
          statusPublicacao: 'PUBLICADA',
          publicadoEm
        }
      });
      funcionalidadePorSlug.set(funcionalidade.slug, funcionalidade.id);
      instalado.funcionalidades.push({
        id: funcionalidade.id,
        solucaoId: funcionalidade.solucaoId,
        slug: funcionalidade.slug,
        ativo: funcionalidade.ativo
      });

      const snapshotFuncionalidade = JSON.stringify(catalogoFeatureSnapshot(funcionalidade));
      await this.registrarVersao(database, {
        entidade: 'FUNCIONALIDADE',
        entidadeId: funcionalidade.id,
        publicadoEm,
        snapshot: snapshotFuncionalidade,
        relation: { funcionalidadeId: funcionalidade.id }
      });

      for (const definicaoAcao of definicaoFuncionalidade.acoes) {
        const consumidor = definicaoAcao.configuracao ?? definicaoAcao.chave;
        const acao = await database.funcionalidadeAcao.create({
          data: {
            funcionalidadeId: funcionalidade.id,
            chave: definicaoAcao.chave,
            nome: definicaoAcao.nome,
            descricao: definicaoAcao.descricao ?? null,
            ordem: definicaoAcao.ordem,
            ativo: definicaoAcao.ativo,
            acaoPadrao: definicaoAcao.acaoPadrao ?? false,
            configuracao: definicaoAcao.configuracao ?? null,
            consumerKey: consumidor,
            consumerVersion: 1,
            versaoDefinicao: CATALOGO_PRODUTO.versao,
            statusPublicacao: 'PUBLICADA',
            publicadoEm
          }
        });
        instalado.acoes.push({
          id: acao.id,
          funcionalidadeId: acao.funcionalidadeId,
          ativo: acao.ativo
        });

        const snapshotAcao = JSON.stringify(catalogoActionSnapshot(acao));
        await this.registrarVersao(database, {
          entidade: 'ACAO',
          entidadeId: acao.id,
          publicadoEm,
          snapshot: snapshotAcao,
          relation: { funcionalidadeAcaoId: acao.id }
        });
      }
    }

    for (const definicaoAgrupamento of definicao.agrupamentos) {
      const agrupamento = await database.funcionalidadeAgrupamento.create({
        data: {
          chaveTecnica: `agrupamento.${definicao.slug}.${definicaoAgrupamento.slug}`,
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

      for (const [ordem, slug] of definicaoAgrupamento.funcionalidades.entries()) {
        const funcionalidadeId = funcionalidadePorSlug.get(slug);
        if (!funcionalidadeId) {
          throw new Error(
            `A funcionalidade ${definicao.slug}.${slug} nao existe no manifesto do produto.`
          );
        }
        await database.funcionalidade.update({
          where: { id: funcionalidadeId },
          data: {
            agrupamentoId: agrupamento.id,
            ordemNoAgrupamento: ordem + 1
          }
        });
      }
    }
  }

  private async registrarVersao(
    database: Prisma.TransactionClient,
    input: {
      entidade: 'SOLUCAO' | 'FUNCIONALIDADE' | 'ACAO';
      entidadeId: number;
      publicadoEm: Date;
      snapshot: string;
      relation: { solucaoId: number } | { funcionalidadeId: number } | { funcionalidadeAcaoId: number };
    }
  ): Promise<void> {
    const versao = await database.catalogoVersao.create({
      data: {
        ...input.relation,
        numero: 1,
        estado: 'PUBLICADA',
        origem: 'PRODUTO',
        revisao: 1,
        versaoDefinicao: CATALOGO_PRODUTO.versao,
        snapshot: input.snapshot,
        baselineSnapshot: input.snapshot,
        publicadoEm: input.publicadoEm
      }
    });

    await database.catalogoAuditoria.create({
      data: {
        versaoId: versao.id,
        entidade: input.entidade,
        entidadeId: input.entidadeId,
        evento: 'INSTALACAO_REGISTRADA',
        depois: input.snapshot,
        motivo: `Manifesto do produto v${CATALOGO_PRODUTO.versao}.`
      }
    });
  }
}
