import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isPrismaUniqueConstraintViolation } from '../../common/persistence/bootstrap-concurrency.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ProdutoAtualizacaoDefinition } from './atualizacoes/produto-atualizacao';
import { PRODUTO_ATUALIZACOES } from './atualizacoes/produto-atualizacoes.registry';
import { CatalogoAtualizacaoOperations } from './catalogo-atualizacao.operations';

export type ProdutoAtualizacaoPendente = Pick<ProdutoAtualizacaoDefinition, 'id' | 'descricao'>;

@Injectable()
export class ProdutoAtualizacaoService {
  private readonly logger = new Logger(ProdutoAtualizacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogo: CatalogoAtualizacaoOperations
  ) {}

  async listarPendentes(): Promise<ProdutoAtualizacaoPendente[]> {
    const aplicadas = await this.prisma.produtoAtualizacao.findMany({ select: { id: true } });
    const ids = new Set(aplicadas.map((item) => item.id));
    return PRODUTO_ATUALIZACOES.filter((item) => !ids.has(item.id));
  }

  async listarDesconhecidas(): Promise<string[]> {
    const conhecidas = new Set(PRODUTO_ATUALIZACOES.map((item) => item.id));
    const aplicadas = await this.prisma.produtoAtualizacao.findMany({ select: { id: true } });
    return aplicadas.map((item) => item.id).filter((id) => !conhecidas.has(id));
  }

  async registrarIncorporadasNaInstalacao(
    database: Prisma.TransactionClient,
    aplicadaEm: Date
  ): Promise<void> {
    if (!PRODUTO_ATUALIZACOES.length) return;
    await database.produtoAtualizacao.createMany({
      data: PRODUTO_ATUALIZACOES.map((atualizacao) => ({
        id: atualizacao.id,
        descricao: atualizacao.descricao,
        modo: 'INCORPORADA_NA_INSTALACAO',
        aplicadaEm,
        duracaoMs: 0,
        resumo: JSON.stringify({ incorporadaAoManifesto: true })
      }))
    });
  }

  async aplicarPendentes(): Promise<{ aplicadas: string[]; incorporadas: string[] }> {
    const instalacao = await this.prisma.sistemaInstalacao.findUnique({ where: { id: 1 } });
    if (!instalacao) {
      throw new Error('Banco sem marca de instalacao. Execute a instalacao ou npm run banco:transicao primeiro.');
    }

    const resultado = { aplicadas: [] as string[], incorporadas: [] as string[] };
    for (const atualizacao of await this.listarPendentes()) {
      const definicao = PRODUTO_ATUALIZACOES.find((item) => item.id === atualizacao.id)!;
      const inicio = Date.now();
      try {
        await this.prisma.$transaction(async (database) => {
          const existente = await database.produtoAtualizacao.findUnique({ where: { id: definicao.id } });
          if (existente) return;

          if (instalacao.origem !== 'BANCO_EXISTENTE') {
            await database.produtoAtualizacao.create({
              data: {
                id: definicao.id,
                descricao: definicao.descricao,
                modo: 'INCORPORADA_NA_INSTALACAO',
                duracaoMs: Date.now() - inicio,
                resumo: JSON.stringify({ incorporadaAoManifesto: true })
              }
            });
            resultado.incorporadas.push(definicao.id);
            return;
          }

          const resumo = await definicao.aplicar({ database, catalogo: this.catalogo });
          await database.produtoAtualizacao.create({
            data: {
              id: definicao.id,
              descricao: definicao.descricao,
              modo: 'APLICADA',
              duracaoMs: Date.now() - inicio,
              resumo: JSON.stringify(resumo)
            }
          });
          resultado.aplicadas.push(definicao.id);
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 120_000,
          timeout: 120_000
        });
      } catch (error) {
        if (!isPrismaUniqueConstraintViolation(error)) throw error;
        const registradaPorOutraInstancia = await this.prisma.produtoAtualizacao.findUnique({
          where: { id: definicao.id }, select: { id: true }
        });
        if (!registradaPorOutraInstancia) throw error;
      }
    }

    for (const id of resultado.aplicadas) this.logger.log(`Atualizacao de produto aplicada: ${id}.`);
    for (const id of resultado.incorporadas) this.logger.log(`Atualizacao incorporada pela instalacao: ${id}.`);
    if (!resultado.aplicadas.length && !resultado.incorporadas.length) {
      this.logger.log('Nenhuma atualizacao de produto pendente.');
    }
    return resultado;
  }
}
