import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FormFieldConflictException } from '../../common/exceptions/form-field.exception';
import { isPrismaUniqueConstraintViolation } from '../../common/persistence/bootstrap-concurrency.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AgrupamentoPadraoDefinition } from './constants/agrupamento-definitions';
import { CreateFuncionalidadeAgrupamentoInput } from './dto/create-funcionalidade-agrupamento.input';
import { FuncionalidadeAgrupamentoType } from './dto/funcionalidade-agrupamento.type';
import { UpdateFuncionalidadeAgrupamentoInput } from './dto/update-funcionalidade-agrupamento.input';
import { toFuncionalidadeAgrupamentoType } from './mappers/funcionalidade-agrupamento.mapper';
import { AssociacaoAgrupamento, mesmaAssociacaoAgrupamento } from './policies/funcionalidade-agrupamento.policy';
import { FuncionalidadeAgrupamentoRecord } from './types/solucao-record.types';
import { normalizeSlug } from './utils/slug.util';

type CatalogoDb = PrismaService | Prisma.TransactionClient;
type EventoAgrupamento = 'CRIADO' | 'ALTERADO' | 'EXCLUIDO' | 'BOOTSTRAP_REGISTRADO';

const SLUG_EM_USO = 'Já existe uma funcionalidade ou agrupamento com este identificador na solução.';
const SEM_ASSOCIACAO: AssociacaoAgrupamento = { agrupamentoId: null, ordemNoAgrupamento: null };

@Injectable()
export class FuncionalidadeAgrupamentoService {
  private readonly logger = new Logger(FuncionalidadeAgrupamentoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateFuncionalidadeAgrupamentoInput, authorId?: string): Promise<FuncionalidadeAgrupamentoType> {
    const slug = normalizeSlug(input.slug);
    const titulo = input.titulo.trim();
    if (!slug) throw new BadRequestException('Informe o identificador do agrupamento.');
    if (!titulo) throw new BadRequestException('Informe o título do agrupamento.');

    try {
      return await this.prisma.$transaction(async (db) => {
        await this.ensureSolucao(db, input.solucaoId);
        await this.assertSlugDisponivel(input.solucaoId, slug, {}, db);
        const created = await db.funcionalidadeAgrupamento.create({
          data: {
            solucaoId: input.solucaoId,
            slug,
            titulo,
            label: input.label?.trim() || null,
            descricao: input.descricao?.trim() || null,
            ordem: input.ordem ?? 0,
            ativo: input.ativo ?? true
          }
        });
        await this.audit(db, created.id, 'CRIADO', null, created, authorId);
        return toFuncionalidadeAgrupamentoType(created);
      });
    } catch (error) {
      if (isPrismaUniqueConstraintViolation(error)) throw new FormFieldConflictException('slug', SLUG_EM_USO);
      throw error;
    }
  }

  /** Agrupamentos padrão também são personalizáveis: o bootstrap nunca regrava um agrupamento existente. */
  async update(input: UpdateFuncionalidadeAgrupamentoInput, authorId?: string): Promise<FuncionalidadeAgrupamentoType> {
    if (input.titulo !== undefined && input.titulo !== null && !input.titulo.trim()) {
      throw new BadRequestException('Informe o título do agrupamento.');
    }

    return this.prisma.$transaction(async (db) => {
      const current = await this.ensureAgrupamento(db, input.id);
      const updated = await db.funcionalidadeAgrupamento.update({
        where: { id: input.id },
        data: {
          ...(input.titulo != null ? { titulo: input.titulo.trim() } : {}),
          ...(input.label !== undefined ? { label: input.label?.trim() || null } : {}),
          ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
          ...(input.ordem != null ? { ordem: input.ordem } : {}),
          ...(input.ativo != null ? { ativo: input.ativo } : {})
        }
      });
      await this.audit(db, updated.id, 'ALTERADO', current, updated, authorId);
      return toFuncionalidadeAgrupamentoType(updated);
    });
  }

  async remove(id: number, authorId?: string): Promise<boolean> {
    return this.prisma.$transaction(async (db) => {
      const current = await this.ensureAgrupamento(db, id);
      if (current.padraoSistema) {
        throw new BadRequestException('Um agrupamento padrão do sistema não pode ser excluído. Desative-o para apresentar as funcionalidades separadamente.');
      }
      if (await db.funcionalidade.count({ where: { agrupamentoId: id } })) {
        throw new BadRequestException('Retire as funcionalidades do agrupamento antes de excluí-lo.');
      }

      await db.funcionalidadeAgrupamento.delete({ where: { id } });
      await this.audit(db, id, 'EXCLUIDO', current, null, authorId);
      return true;
    });
  }

  /**
   * Cria o agrupamento padrão do produto uma única vez e associa as funcionalidades da definição que ainda não têm agrupamento.
   * Um agrupamento existente nunca é regravado: título, estado, ordem e composição personalizados permanecem.
   */
  async ensureAgrupamentoPadrao(solucaoId: number, definicao: AgrupamentoPadraoDefinition): Promise<void> {
    const existente = await this.prisma.funcionalidadeAgrupamento.findUnique({
      where: { solucaoId_slug: { solucaoId, slug: definicao.slug } },
      select: { id: true }
    });
    if (existente) return;

    const rotaOcupada = await this.prisma.funcionalidade.findFirst({ where: { solucaoId, slug: definicao.slug }, select: { id: true } });
    if (rotaOcupada) {
      this.logger.warn(`Agrupamento padrão "${definicao.slug}" não criado: o identificador já é usado por uma funcionalidade da solução ${solucaoId}.`);
      return;
    }

    await this.prisma.$transaction(async (db) => {
      const criado = await db.funcionalidadeAgrupamento.create({
        data: {
          solucaoId,
          slug: definicao.slug,
          titulo: definicao.titulo,
          label: definicao.label,
          descricao: definicao.descricao,
          ordem: definicao.ordem,
          ativo: true,
          padraoSistema: true
        }
      });
      await this.audit(db, criado.id, 'BOOTSTRAP_REGISTRADO', null, criado);

      for (const [indice, slug] of definicao.funcionalidades.entries()) {
        const funcionalidade = await db.funcionalidade.findFirst({ where: { solucaoId, slug, agrupamentoId: null }, select: { id: true } });
        if (!funcionalidade) continue;

        const associacao = { agrupamentoId: criado.id, ordemNoAgrupamento: indice + 1 };
        await db.funcionalidade.update({ where: { id: funcionalidade.id }, data: associacao });
        await this.registrarAssociacao(funcionalidade.id, SEM_ASSOCIACAO, associacao, undefined, db);
      }
    });
  }

  /** Funcionalidades e agrupamentos compartilham o espaço de rotas da solução. */
  async assertSlugDisponivel(
    solucaoId: number,
    slug: string,
    ignorar: { funcionalidadeId?: number; agrupamentoId?: number } = {},
    db: CatalogoDb = this.prisma
  ): Promise<void> {
    const [funcionalidade, agrupamento] = await Promise.all([
      db.funcionalidade.findFirst({ where: { solucaoId, slug }, select: { id: true } }),
      db.funcionalidadeAgrupamento.findFirst({ where: { solucaoId, slug }, select: { id: true } })
    ]);

    if ((funcionalidade && funcionalidade.id !== ignorar.funcionalidadeId) || (agrupamento && agrupamento.id !== ignorar.agrupamentoId)) {
      throw new FormFieldConflictException('slug', SLUG_EM_USO);
    }
  }

  async assertAssociacaoValida(solucaoId: number, agrupamentoId: number | null, db: CatalogoDb = this.prisma): Promise<void> {
    if (agrupamentoId === null) return;

    const agrupamento = await db.funcionalidadeAgrupamento.findUnique({ where: { id: agrupamentoId }, select: { solucaoId: true } });
    if (!agrupamento || agrupamento.solucaoId !== solucaoId) {
      throw new BadRequestException('O agrupamento informado não pertence à solução da funcionalidade.');
    }
  }

  async registrarAssociacao(
    funcionalidadeId: number,
    antes: AssociacaoAgrupamento,
    depois: AssociacaoAgrupamento,
    authorId?: string,
    db: CatalogoDb = this.prisma
  ): Promise<void> {
    if (mesmaAssociacaoAgrupamento(antes, depois)) return;

    await db.catalogoAuditoria.create({
      data: {
        entidade: 'FUNCIONALIDADE',
        entidadeId: funcionalidadeId,
        evento: 'AGRUPAMENTO_ALTERADO',
        antes: JSON.stringify(antes),
        depois: JSON.stringify(depois),
        autorId: authorId ?? null
      }
    });
  }

  private async ensureSolucao(db: CatalogoDb, id: number): Promise<void> {
    if (!await db.solucao.findUnique({ where: { id }, select: { id: true } })) {
      throw new NotFoundException('Solução não encontrada.');
    }
  }

  private async ensureAgrupamento(db: CatalogoDb, id: number): Promise<FuncionalidadeAgrupamentoRecord> {
    const agrupamento = await db.funcionalidadeAgrupamento.findUnique({ where: { id } });
    if (!agrupamento) throw new NotFoundException('Agrupamento não encontrado.');
    return agrupamento;
  }

  private async audit(
    db: CatalogoDb,
    agrupamentoId: number,
    evento: EventoAgrupamento,
    antes: FuncionalidadeAgrupamentoRecord | null,
    depois: FuncionalidadeAgrupamentoRecord | null,
    authorId?: string
  ): Promise<void> {
    await db.catalogoAuditoria.create({
      data: {
        entidade: 'AGRUPAMENTO',
        entidadeId: agrupamentoId,
        evento,
        antes: antes ? JSON.stringify(this.snapshot(antes)) : null,
        depois: depois ? JSON.stringify(this.snapshot(depois)) : null,
        autorId: authorId ?? null
      }
    });
  }

  private snapshot(agrupamento: FuncionalidadeAgrupamentoRecord) {
    return {
      solucaoId: agrupamento.solucaoId,
      slug: agrupamento.slug,
      titulo: agrupamento.titulo,
      label: agrupamento.label ?? null,
      descricao: agrupamento.descricao ?? null,
      ordem: agrupamento.ordem,
      ativo: agrupamento.ativo
    };
  }
}
