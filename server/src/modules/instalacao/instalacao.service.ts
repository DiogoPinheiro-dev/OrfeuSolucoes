import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { hash } from 'bcrypt';
import { isPrismaUniqueConstraintViolation } from '../../common/persistence/bootstrap-concurrency.util';
import { normalizeAndValidatePassword } from '../../common/security/password.policy';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogoActionConsumerRegistry } from '../solucoes/catalogo-action-consumer.registry';
import { CatalogoProviderRegistry } from '../solucoes/catalogo-provider.registry';
import { CatalogoInstalacaoOperations } from './catalogo-instalacao.operations';
import { CATALOGO_PRODUTO } from './manifesto/catalogo-produto';
import { DADOS_INICIAIS_PRODUTO } from './manifesto/dados-iniciais';

export type InstalacaoSubidaResultado = {
  estado: 'INSTALADA_AGORA' | 'JA_INSTALADA';
  origem: 'INSTALACAO' | 'BANCO_EXISTENTE';
  incompatibilidades: string[];
};

@Injectable()
export class InstalacaoService {
  private readonly logger = new Logger(InstalacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly catalogoOperations: CatalogoInstalacaoOperations,
    private readonly providerRegistry: CatalogoProviderRegistry,
    private readonly actionConsumerRegistry: CatalogoActionConsumerRegistry
  ) {}

  async verificarSubida(): Promise<InstalacaoSubidaResultado> {
    const marca = await this.prisma.sistemaInstalacao.findUnique({ where: { id: 1 } });

    if (marca) {
      const incompatibilidades = await this.conferirCompatibilidade();
      return {
        estado: 'JA_INSTALADA',
        origem: marca.origem as 'INSTALACAO' | 'BANCO_EXISTENTE',
        incompatibilidades
      };
    }

    const contagens = await this.contarDadosPrincipais(this.prisma);
    if (this.possuiDados(contagens)) {
      const marcaConcorrente = await this.prisma.sistemaInstalacao.findUnique({ where: { id: 1 } });
      if (marcaConcorrente) {
        const incompatibilidades = await this.conferirCompatibilidade();
        return {
          estado: 'JA_INSTALADA',
          origem: marcaConcorrente.origem as 'INSTALACAO' | 'BANCO_EXISTENTE',
          incompatibilidades
        };
      }
      throw new Error(
        'Banco com dados e sem marca de instalacao. Execute npm run banco:transicao antes de iniciar o backend.'
      );
    }

    return this.instalar();
  }

  async instalar(): Promise<InstalacaoSubidaResultado> {
    const senhaHash = await hash(this.senhaInicial(), 10);
    const empresaNome = this.configService.get<string>('INSTALACAO_EMPRESA_NOME')
      ?? DADOS_INICIAIS_PRODUTO.empresa.nome;
    const inicio = Date.now();

    try {
      await this.prisma.$transaction(async (database) => {
        const instaladoEm = new Date();
        await database.sistemaInstalacao.create({
          data: {
            id: 1,
            origem: 'INSTALACAO',
            versaoManifesto: CATALOGO_PRODUTO.versao,
            instaladoEm
          }
        });

        const contagens = await this.contarDadosPrincipais(database);
        if (this.possuiDados(contagens)) {
          throw new Error(
            'A instalacao foi recusada porque o banco deixou de estar vazio durante a verificacao transacional.'
          );
        }

        const catalogo = await this.catalogoOperations.criarCatalogo(database, instaladoEm);
        const empresa = await database.empresa.create({
          data: {
            ...DADOS_INICIAIS_PRODUTO.empresa,
            nome: empresaNome
          }
        });
        const grupo = await database.grupoUsuario.create({
          data: { ...DADOS_INICIAIS_PRODUTO.grupoAdministradores }
        });
        const usuario = await database.usuario.create({
          data: {
            ...DADOS_INICIAIS_PRODUTO.usuarioAdministrador,
            senhaHash,
            grupoId: grupo.id
          }
        });

        await database.empresaUsuario.create({
          data: { empresaId: empresa.id, usuarioId: usuario.id }
        });

        const solucoesAtivas = catalogo.solucoes.filter((solucao) => solucao.ativo);
        const funcionalidadesAtivas = catalogo.funcionalidades.filter((funcionalidade) => funcionalidade.ativo);
        const acoesAtivas = catalogo.acoes.filter((acao) => acao.ativo);

        if (solucoesAtivas.length) {
          await database.empresaSolucao.createMany({
            data: solucoesAtivas.map((solucao) => ({ empresaId: empresa.id, solucaoId: solucao.id }))
          });
          await database.grupoSolucao.createMany({
            data: solucoesAtivas.map((solucao) => ({ grupoId: grupo.id, solucaoId: solucao.id }))
          });
        }

        if (funcionalidadesAtivas.length) {
          await database.empresaFuncionalidade.createMany({
            data: funcionalidadesAtivas.map((funcionalidade) => ({
              empresaId: empresa.id,
              funcionalidadeId: funcionalidade.id
            }))
          });
          await database.grupoFuncionalidade.createMany({
            data: funcionalidadesAtivas.map((funcionalidade) => ({
              grupoId: grupo.id,
              funcionalidadeId: funcionalidade.id,
              podeVisualizar: true,
              podeIncluir: true,
              podeAlterar: true,
              podeExcluir: true
            }))
          });
        }

        if (acoesAtivas.length) {
          await database.grupoFuncionalidadeAcao.createMany({
            data: acoesAtivas.map((acao) => ({
              grupoId: grupo.id,
              funcionalidadeAcaoId: acao.id,
              permitido: true
            }))
          });
        }

        await database.chamadoTipo.createMany({
          data: DADOS_INICIAIS_PRODUTO.chamados.tipos.map((tipo) => ({
            empresaId: empresa.id,
            nome: tipo.nome,
            descricao: null,
            cor: tipo.cor,
            ordem: tipo.ordem,
            ativo: true
          }))
        });
        await database.chamadoPrioridade.createMany({
          data: DADOS_INICIAIS_PRODUTO.chamados.prioridades.map((prioridade) => ({
            empresaId: empresa.id,
            nome: prioridade.nome,
            descricao: null,
            cor: prioridade.cor,
            ordem: prioridade.ordem,
            ativo: true
          }))
        });

        await database.sistemaInstalacao.update({
          where: { id: 1 },
          data: { duracaoMs: Date.now() - inicio }
        });
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 120_000,
        timeout: 120_000
      });
    } catch (error) {
      if (!isPrismaUniqueConstraintViolation(error)) {
        throw error;
      }

      const marcaConcorrente = await this.prisma.sistemaInstalacao.findUnique({ where: { id: 1 } });
      if (!marcaConcorrente) {
        throw error;
      }
      const incompatibilidades = await this.conferirCompatibilidade();
      return {
        estado: 'JA_INSTALADA',
        origem: marcaConcorrente.origem as 'INSTALACAO' | 'BANCO_EXISTENTE',
        incompatibilidades
      };
    }

    this.logger.log(`Instalacao inicial concluida com o manifesto v${CATALOGO_PRODUTO.versao}.`);
    return {
      estado: 'INSTALADA_AGORA',
      origem: 'INSTALACAO',
      incompatibilidades: []
    };
  }

  /**
   * Confere, só lendo, se cada tela publicada tem componente e cada ação publicada tem regra no código.
   * O log traz um resumo e uma linha por problema, com solução, tela e ação, para o suporte localizar cada caso.
   */
  private async conferirCompatibilidade(): Promise<string[]> {
    const publicada = { ativo: true, statusPublicacao: 'PUBLICADA' };
    const [funcionalidades, acoes] = await Promise.all([
      this.prisma.funcionalidade.findMany({
        where: publicada,
        select: { titulo: true, providerKey: true, providerVersion: true, solucao: { select: { slug: true } } },
        orderBy: [{ solucaoId: 'asc' }, { ordem: 'asc' }]
      }),
      this.prisma.funcionalidadeAcao.findMany({
        where: { ...publicada, funcionalidade: publicada },
        select: {
          chave: true,
          consumerKey: true,
          consumerVersion: true,
          funcionalidade: { select: { titulo: true, solucao: { select: { slug: true } } } }
        },
        orderBy: [{ funcionalidadeId: 'asc' }, { ordem: 'asc' }]
      })
    ]);
    const valor = (texto: string | null | undefined) => (texto?.trim() ? texto : 'vazio');
    const incompatibilidades = [
      ...funcionalidades
        .filter((funcionalidade) => !this.providerRegistry.isCompatible(
          funcionalidade.providerKey,
          funcionalidade.providerVersion
        ))
        .map((funcionalidade) =>
          `Tela sem componente compativel: ${funcionalidade.solucao.slug} > ${funcionalidade.titulo} ` +
          `(provider: ${valor(funcionalidade.providerKey)}, versao: ${funcionalidade.providerVersion ?? 'vazia'}).`),
      ...acoes
        .filter((acao) => !this.actionConsumerRegistry.isCompatible(
          acao.consumerKey,
          acao.consumerVersion
        ))
        .map((acao) =>
          `Acao sem regra compativel: ${acao.funcionalidade.solucao.slug} > ${acao.funcionalidade.titulo} > ${acao.chave} ` +
          `(consumidor: ${valor(acao.consumerKey)}, versao: ${acao.consumerVersion ?? 'vazia'}).`)
    ];

    if (!incompatibilidades.length) {
      this.logger.log('Conferencia do catalogo: telas e acoes publicadas compativeis com o codigo.');
      return incompatibilidades;
    }

    this.logger.warn(`Conferencia do catalogo: ${incompatibilidades.length} problema(s) encontrado(s); detalhes nas linhas abaixo.`);
    for (const incompatibilidade of incompatibilidades) {
      this.logger.warn(incompatibilidade);
    }
    return incompatibilidades;
  }

  private async contarDadosPrincipais(
    database: PrismaService | Prisma.TransactionClient
  ): Promise<[number, number, number, number, number]> {
    return Promise.all([
      database.empresa.count(),
      database.usuario.count(),
      database.grupoUsuario.count(),
      database.solucao.count(),
      database.funcionalidade.count()
    ]);
  }

  private possuiDados(contagens: number[]): boolean {
    return contagens.some((contagem) => contagem > 0);
  }

  private senhaInicial(): string {
    const configurada = this.configService.get<string>('INITIAL_ADMIN_PASSWORD');
    if (!configurada) {
      throw new Error('INITIAL_ADMIN_PASSWORD is required to install the initial administrator.');
    }
    return normalizeAndValidatePassword(configurada);
  }
}
