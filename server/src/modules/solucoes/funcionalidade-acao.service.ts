import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FormFieldBadRequestException, FormFieldConflictException } from '../../common/exceptions/form-field.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_ACTIONS } from './constants/solucao.constants';
import { FuncionalidadeAcaoInput } from './dto/funcionalidade-acao.input';
import { FuncionalidadePermissao, GrupoAccessDefaults } from './types/permissao.types';
import { FuncionalidadeAcaoRecord } from './types/solucao-record.types';
import { comparableActionKey, legacyActionAllowed, normalizeActionKey, withLegacyPermissions } from './utils/acao-permissao.util';

@Injectable()
export class FuncionalidadeAcaoService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeActionInputs(acoes?: FuncionalidadeAcaoInput[], includeDefaultActions = true): FuncionalidadeAcaoInput[] {
    const byKey = new Map<string, FuncionalidadeAcaoInput>();

    for (const acao of [...(includeDefaultActions ? DEFAULT_ACTIONS : []), ...(acoes ?? [])]) {
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
        acaoPadrao: acao.acaoPadrao ?? (includeDefaultActions && DEFAULT_ACTIONS.some((item) => item.chave === chave))
      });
    }

    return [...byKey.values()];
  }

  async syncFuncionalidadeAcoes(funcionalidadeId: number, acoes?: FuncionalidadeAcaoInput[], options: { preserveAdditionalActions?: boolean; includeDefaultActions?: boolean } = {}): Promise<void> {
    const normalized = this.normalizeActionInputs(acoes, options.includeDefaultActions ?? true);
    const submittedIds = normalized.map((acao) => acao.id).filter((id): id is number => !!id);
    const submittedKeys = normalized.map((acao) => acao.chave).filter(Boolean);
    const submittedConfigs = normalized.map((acao) => acao.configuracao).filter((configuracao): configuracao is string => !!configuracao);
    const existingActions = (await (this.prisma as never as { funcionalidadeAcao: { findMany: Function } }).funcionalidadeAcao.findMany({
      where: { funcionalidadeId },
      select: { id: true, chave: true, configuracao: true, statusPublicacao: true }
    })) as Pick<FuncionalidadeAcaoRecord, 'id' | 'chave' | 'configuracao' | 'statusPublicacao'>[];

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
      const createData = {
        ...data,
        statusPublicacao: (acao.acaoPadrao || (options.includeDefaultActions ?? true)) ? 'PUBLICADA' : 'RASCUNHO',
        consumerKey: acao.configuracao ?? acao.chave,
        consumerVersion: 1
      };

      if (acao.id) {
        const existingAction = existingActions.find((item) => item.id === acao.id);
        if (existingAction?.statusPublicacao !== 'RASCUNHO') continue;
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
          if (existingAction.statusPublicacao !== 'RASCUNHO') continue;
          await (this.prisma as never as { funcionalidadeAcao: { update: Function } }).funcionalidadeAcao.update({
            where: { id: existingAction.id },
            data
          });
        } else {
          await (this.prisma as never as { funcionalidadeAcao: { upsert: Function } }).funcionalidadeAcao.upsert({
            where: { funcionalidadeId_chave: { funcionalidadeId, chave: acao.chave } },
            update: data,
            create: createData
          });
        }
      }
    }

    if (!options.preserveAdditionalActions) {
      await (this.prisma as never as { funcionalidadeAcao: { updateMany: Function } }).funcionalidadeAcao.updateMany({
        where: {
          funcionalidadeId,
          acaoPadrao: false,
          NOT: [
            ...(submittedIds.length ? [{ id: { in: submittedIds } }] : []),
            ...(submittedKeys.length ? [{ chave: { in: submittedKeys } }] : []),
            ...(submittedConfigs.length ? [{ configuracao: { in: submittedConfigs } }] : [])
          ]
        },
        data: { ativo: false, statusPublicacao: 'DESPUBLICADA' }
      });
    }

    await this.syncMissingActionPermissionsForFeature(funcionalidadeId);
  }

  async appendFuncionalidadeAcoes(funcionalidadeId: number, acoes: FuncionalidadeAcaoInput[]): Promise<void> {
    if (!acoes.length) {
      return;
    }

    const existingActions = (await (this.prisma as never as { funcionalidadeAcao: { findMany: Function } }).funcionalidadeAcao.findMany({
      where: { funcionalidadeId },
      select: { id: true, chave: true, configuracao: true, statusPublicacao: true }
    })) as Pick<FuncionalidadeAcaoRecord, 'id' | 'chave' | 'configuracao' | 'statusPublicacao'>[];
    const actionsToCreate: Array<{
      chave: string;
      nome: string;
      descricao: string | null;
      ordem: number;
      ativo: boolean;
      acaoPadrao: false;
      configuracao: string | null;
    }> = [];

    for (const acao of acoes) {
      const chave = normalizeActionKey(acao.chave || acao.nome);
      const nome = acao.nome.trim();
      const configuracao = acao.configuracao?.trim() || null;

      if (!chave || !nome) {
        throw new FormFieldBadRequestException('acoes', 'Informe o nome e o identificador da nova acao.');
      }

      if (acao.id) {
        const existing = existingActions.find((item) => item.id === acao.id);
        if (!existing) throw new FormFieldBadRequestException('acoes', 'A acao informada nao pertence a esta funcionalidade.');
        if (existing.statusPublicacao !== 'RASCUNHO') throw new FormFieldBadRequestException('acoes', 'Use um rascunho versionado para alterar uma acao publicada.');
        await (this.prisma as never as { funcionalidadeAcao: { update: Function } }).funcionalidadeAcao.update({
          where: { id: acao.id },
          data: { nome, descricao: acao.descricao?.trim() || null, ordem: acao.ordem ?? 0, ativo: acao.ativo ?? true, configuracao }
        });
        continue;
      }

      const comparableKey = comparableActionKey(chave);
      const comparableConfig = comparableActionKey(configuracao);
      const duplicate = existingActions.find((item) =>
        item.chave === chave ||
        (!!configuracao && item.configuracao === configuracao) ||
        comparableActionKey(item.chave) === comparableKey ||
        (!!comparableConfig && comparableActionKey(item.configuracao) === comparableConfig)
      );

      if (duplicate) {
        throw new FormFieldConflictException('acoes', 'A funcionalidade ja possui uma acao com este identificador.');
      }

      actionsToCreate.push({
        chave,
        nome,
        descricao: acao.descricao?.trim() || null,
        ordem: acao.ordem ?? 0,
        ativo: acao.ativo ?? true,
        acaoPadrao: false,
        configuracao
      });
      existingActions.push({ id: 0, chave, configuracao, statusPublicacao: 'RASCUNHO' });
    }

    for (const acao of actionsToCreate) {
      await (this.prisma as never as { funcionalidadeAcao: { create: Function } }).funcionalidadeAcao.create({
        data: { funcionalidadeId, ...acao, statusPublicacao: 'RASCUNHO', consumerKey: acao.configuracao ?? acao.chave, consumerVersion: 1 }
      });
    }

    await this.syncMissingActionPermissionsForFeature(funcionalidadeId);
  }

  async syncGroupActionPermissions(
    grupoId: number,
    funcionalidadeIds: number[],
    funcionalidadePermissoes: FuncionalidadePermissao[],
    database: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<void> {
    const acoes = (await (database as never as { funcionalidadeAcao: { findMany: Function } }).funcionalidadeAcao.findMany({
      where: { funcionalidadeId: { in: funcionalidadeIds }, ativo: true, statusPublicacao: 'PUBLICADA' },
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

    await (database as never as { grupoFuncionalidadeAcao: { createMany: Function } }).grupoFuncionalidadeAcao.createMany({
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

  async syncMissingActionPermissionsForFeature(funcionalidadeId: number, useLegacyDefaults = false): Promise<void> {
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
        where: { funcionalidadeId, ativo: true, statusPublicacao: 'PUBLICADA' },
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
          permitido: useLegacyDefaults ? legacyActionAllowed(acao.chave, withLegacyPermissions({
            funcionalidadeId,
            podeVisualizar: grupo.podeVisualizar ?? true,
            podeIncluir: grupo.podeIncluir ?? false,
            podeAlterar: grupo.podeAlterar ?? false,
            podeExcluir: grupo.podeExcluir ?? false
          })) : false
        }))
    );

    if (data.length) {
      await (this.prisma as never as { grupoFuncionalidadeAcao: { createMany: Function } }).grupoFuncionalidadeAcao.createMany({ data });
    }
  }
}
