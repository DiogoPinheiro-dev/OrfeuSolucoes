import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SolucoesService } from '../solucoes/solucoes.service';

@Injectable()
export class EmpresaAcessoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly solucoesService: SolucoesService
  ) {}

  async syncCompanyAccess(empresaId: number, solucaoIds: number[] = [], funcionalidadeIds?: number[]): Promise<void> {
    await this.solucoesService.syncCompanyAccess(
      empresaId,
      solucaoIds,
      await this.resolveFuncionalidadeIds(solucaoIds, funcionalidadeIds)
    );
  }

  async ensureDefaultChamadoConfiguracoes(empresaId: number): Promise<void> {
    await this.solucoesService.ensureDefaultChamadoConfiguracoesForEmpresa(empresaId);
  }

  async findCompanyAccess(empresaId: number) {
    return this.solucoesService.findCompanyAccess(empresaId);
  }

  async findCompanySolutionSummaries(empresaId: number) {
    return this.solucoesService.findCompanySolutionSummaries(empresaId);
  }

  async userBelongsToCompany(usuarioId: string, empresaId: number): Promise<boolean> {
    const vinculo = await this.prisma.empresaUsuario.findFirst({
      where: {
        empresaId,
        usuarioId
      }
    });

    return !!vinculo;
  }

  private async resolveFuncionalidadeIds(solucaoIds: number[] = [], funcionalidadeIds?: number[]): Promise<number[]> {
    if (funcionalidadeIds?.length) {
      return funcionalidadeIds;
    }

    if (!solucaoIds.length) {
      return [];
    }

    const solucoes = await this.solucoesService.findAll();

    return solucoes
      .filter((solucao) => solucaoIds.includes(solucao.id))
      .flatMap((solucao) => solucao.funcionalidades.map((funcionalidade) => funcionalidade.id));
  }
}