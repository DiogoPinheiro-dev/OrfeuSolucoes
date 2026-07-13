import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ChamadoResponsavelFuncionalidadeRecord,
  ChamadoResponsavelSolucaoRecord,
  ResponsavelSolucaoPayload
} from './types/chamado-record.types';

@Injectable()
export class ChamadoResponsavelVinculoService {
  constructor(private readonly prisma: PrismaService) {}

  async normalizeResponsavelSolucoes(inputSolucoes: Array<{ solucaoId: number; responsavelGeral?: boolean | null; funcionalidadeIds?: number[] | null }>): Promise<ResponsavelSolucaoPayload[]> {
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


  async syncResponsavelSolucoes(tx: any, responsavelId: number, solucoes: ResponsavelSolucaoPayload[]): Promise<void> {
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

}