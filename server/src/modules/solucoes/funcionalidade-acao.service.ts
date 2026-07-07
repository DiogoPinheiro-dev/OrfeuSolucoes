import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_ACTIONS } from './constants/solucao.constants';
import { FuncionalidadeAcaoInput } from './dto/funcionalidade-acao.input';
import { FuncionalidadePermissao, GrupoAccessDefaults } from './types/permissao.types';
import { FuncionalidadeAcaoRecord } from './types/solucao-record.types';
import { comparableActionKey, legacyActionAllowed, normalizeActionKey, withLegacyPermissions } from './utils/acao-permissao.util';

@Injectable()
export class FuncionalidadeAcaoService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeActionInputs(acoes?: FuncionalidadeAcaoInput[]): FuncionalidadeAcaoInput[] {
    const byKey = new Map<string, FuncionalidadeAcaoInput>();

    for (const acao of [...DEFAULT_ACTIONS, ...(acoes ?? [])]) {
      const chave = normalizeActionKey(acao.chave);

      if (!chave) {
        continue;
      }

      byKey.set(chave, {
        ...acao,
        chave,
        nome: acao.nome.trim(),
        descricao: acao.descricao?.trim() || null,
        configuracao: acao.configuracao?.trim() || null,
        ordem: acao.ordem ?? 0,
        ativo: acao.ativo ?? true,
        acaoPadrao: acao.acaoPadrao ?? DEFAULT_ACTIONS.some((item) => item.chave === chave)
      });
    }

    return [...byKey.values()];
  }

  async syncFuncionalidadeAcoes(funcionalidadeId: number, acoes?: FuncionalidadeAcaoInput[]): Promise<void> {
    const normalized = this.normalizeActionInputs(acoes);
    const submittedIds = normalized.map((acao) => acao.id).filter((id): id is number => !!id);
    const submittedKeys = normalized.map((acao) => acao.chave).filter(Boolean);
    const submittedConfigs = normalized.map((acao) => acao.configuracao).filter((configuracao): configuracao is string => !!configuracao);
    const existingActions = (await (this.prisma as never as { funcionalidadeAcao: { findMany: Function } }).funcionalidadeAcao.findMany({
      where: { funcionalidadeId },
      select: { id: true, chave: true, configuracao: true }
    })) as Pick<FuncionalidadeAcaoRecord, 'id' | 'chave' | 'configuracao'>[];

    for (const acao of normalized) {
      const data = {
        funcionalidadeId,
        chave: acao.chave,
        nome: acao.nome,
        descricao: acao.descricao ?? null,
        ordem: acao.ordem ?? 0,
        ativo: acao.ativo ?? true,
        acaoPadrao: acao.acaoPadrao ?? false,
        configuracao: acao.configuracao ?? null
      };

      if (acao.id) {
        await (this.prisma as never as { funcionalidadeAcao: { update: Function } }).funcionalidadeAcao.update({
          where: { id: acao.id },
          data
        });
      } else {
        const comparableKey = comparableActionKey(acao.chave);
        const comparableConfig = comparableActionKey(acao.configuracao);
        const existingAction = existingActions.find((item) =>
          item.chave === acao.chave ||
          (!!acao.configuracao && item.configuracao === acao.configuracao) ||
          comparableActionKey(item.chave) === comparableKey ||
          (!!comparableConfig && comparableActionKey(item.configuracao) === comparableConfig)
        );

        if (existingAction) {
          await (this.prisma as never as { funcionalidadeAcao: { update: Function } }).funcionalidadeAcao.update({
            where: { id: existingAction.id },
            data
          });
        } else {
          await (this.prisma as never as { funcionalidadeAcao: { upsert: Function } }).funcionalidadeAcao.upsert({
            where: { funcionalidadeId_chave: { funcionalidadeId, chave: acao.chave } },
            update: data,
            create: data
          });
        }
      }
    }

    await (this.prisma as never as { funcionalidadeAcao: { deleteMany: Function } }).funcionalidadeAcao.deleteMany({
      where: {
        funcionalidadeId,
        acaoPadrao: false,
        NOT: [
          ...(submittedIds.length ? [{ id: { in: submittedIds } }] : []),
          ...(submittedKeys.length ? [{ chave: { in: submittedKeys } }] : []),
          ...(submittedConfigs.length ? [{ configuracao: { in: submittedConfigs } }] : [])
        ]
      }
    });

    await this.syncMissingActionPermissionsForFeature(funcionalidadeId);
  }

  async syncGroupActionPermissions(
    grupoId: number,
    funcionalidadeIds: number[],
    funcionalidadePermissoes: FuncionalidadePermissao[]
  ): Promise<void> {
    const acoes = (await (this.prisma as never as { funcionalidadeAcao: { findMany: Function } }).funcionalidadeAcao.findMany({
      where: { funcionalidadeId: { in: funcionalidadeIds }, ativo: true },
      select: { id: true, funcionalidadeId: true, chave: true }
    })) as Pick<FuncionalidadeAcaoRecord, 'id' | 'funcionalidadeId' | 'chave'>[];

    if (!acoes.length) {
      return;
    }

    const permissoesByFuncionalidadeId = new Map(
      funcionalidadePermissoes.map((permissao) => [permissao.funcionalidadeId, withLegacyPermissions(permissao)])
    );
    const permittedByActionId = new Map(
      funcionalidadePermissoes
        .flatMap((permissao) => permissao.acoes ?? [])
        .map((acao) => [acao.acaoId, !!acao.permitido])
    );

    await (this.prisma as never as { grupoFuncionalidadeAcao: { createMany: Function } }).grupoFuncionalidadeAcao.createMany({
      data: acoes.map((acao) => {
        const permissao = permissoesByFuncionalidadeId.get(acao.funcionalidadeId);

        return {
          grupoId,
          funcionalidadeAcaoId: acao.id,
          permitido: permittedByActionId.has(acao.id)
            ? !!permittedByActionId.get(acao.id)
            : legacyActionAllowed(acao.chave, permissao ?? withLegacyPermissions({ funcionalidadeId: acao.funcionalidadeId }))
        };
      })
    });
  }

  async syncMissingActionPermissionsForFeature(funcionalidadeId: number): Promise<void> {
    const [grupos, acoes, existing] = await Promise.all([
      (this.prisma as never as { grupoFuncionalidade: { findMany: Function } }).grupoFuncionalidade.findMany({
        where: { funcionalidadeId },
        select: {
          grupoId: true,
          podeVisualizar: true,
          podeIncluir: true,
          podeAlterar: true,
          podeExcluir: true
        }
      }),
      (this.prisma as never as { funcionalidadeAcao: { findMany: Function } }).funcionalidadeAcao.findMany({
        where: { funcionalidadeId, ativo: true },
        select: { id: true, chave: true }
      }),
      (this.prisma as never as { grupoFuncionalidadeAcao: { findMany: Function } }).grupoFuncionalidadeAcao.findMany({
        where: { funcionalidadeAcao: { funcionalidadeId } },
        select: { grupoId: true, funcionalidadeAcaoId: true }
      })
    ]);
    const existingKeys = new Set((existing as { grupoId: number; funcionalidadeAcaoId: number }[]).map((item) => `${item.grupoId}:${item.funcionalidadeAcaoId}`));
    const data = (grupos as (GrupoAccessDefaults & { grupoId: number })[]).flatMap((grupo) =>
      (acoes as Pick<FuncionalidadeAcaoRecord, 'id' | 'chave'>[])
        .filter((acao) => !existingKeys.has(`${grupo.grupoId}:${acao.id}`))
        .map((acao) => ({
          grupoId: grupo.grupoId,
          funcionalidadeAcaoId: acao.id,
          permitido: legacyActionAllowed(acao.chave, withLegacyPermissions({
            funcionalidadeId,
            podeVisualizar: grupo.podeVisualizar ?? true,
            podeIncluir: grupo.podeIncluir ?? false,
            podeAlterar: grupo.podeAlterar ?? false,
            podeExcluir: grupo.podeExcluir ?? false
          }))
        }))
    );

    if (data.length) {
      await (this.prisma as never as { grupoFuncionalidadeAcao: { createMany: Function } }).grupoFuncionalidadeAcao.createMany({ data });
    }
  }
}
