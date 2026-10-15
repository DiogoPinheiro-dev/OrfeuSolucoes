import { Injectable } from '@nestjs/common';
import { isPrismaUniqueConstraintViolation } from '../../common/persistence/bootstrap-concurrency.util';
import { DADOS_INICIAIS_PRODUTO } from '../instalacao/manifesto/dados-iniciais';
import { CONTROLE_CHAMADOS_PRODUTO } from '../instalacao/manifesto/catalogo-produto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChamadoConfiguracaoPadraoService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureForEmpresa(empresaId: number, force = false): Promise<void> {
    if (!force && !(await this.possuiContrato(empresaId))) {
      return;
    }

    for (const tipo of DADOS_INICIAIS_PRODUTO.chamados.tipos) {
      await this.ensureDefaultConfiguracao(
        (this.prisma as never as { chamadoTipo: ChamadoConfiguracaoDelegate }).chamadoTipo,
        empresaId,
        tipo
      );
    }

    for (const prioridade of DADOS_INICIAIS_PRODUTO.chamados.prioridades) {
      await this.ensureDefaultConfiguracao(
        (this.prisma as never as { chamadoPrioridade: ChamadoConfiguracaoDelegate }).chamadoPrioridade,
        empresaId,
        prioridade
      );
    }
  }

  private async ensureDefaultConfiguracao(
    delegate: ChamadoConfiguracaoDelegate,
    empresaId: number,
    configuracao: DefaultChamadoConfiguracao
  ): Promise<void> {
    const existing = await delegate.findFirst({
      where: { empresaId, nome: configuracao.nome },
      select: { id: true }
    }) as { id: number } | null;

    if (existing) {
      return;
    }

    try {
      await delegate.create({
        data: {
          empresaId,
          nome: configuracao.nome,
          descricao: null,
          cor: configuracao.cor,
          ordem: configuracao.ordem,
          ativo: true
        }
      });
    } catch (error) {
      if (!isPrismaUniqueConstraintViolation(error)) {
        throw error;
      }
    }
  }

  private async possuiContrato(empresaId: number): Promise<boolean> {
    const acessoSolucao = await this.prisma.empresaSolucao.findFirst({
      where: {
        empresaId,
        solucao: { slug: CONTROLE_CHAMADOS_PRODUTO.slug }
      },
      select: { id: true }
    });

    if (acessoSolucao) {
      return true;
    }

    const acessoFuncionalidade = await this.prisma.empresaFuncionalidade.findFirst({
      where: {
        empresaId,
        funcionalidade: { solucao: { slug: CONTROLE_CHAMADOS_PRODUTO.slug } }
      },
      select: { id: true }
    });
    return !!acessoFuncionalidade;
  }
}

type ChamadoConfiguracaoDelegate = {
  findFirst: Function;
  create: Function;
};

type DefaultChamadoConfiguracao = {
  nome: string;
  cor: string;
  ordem: number;
};
