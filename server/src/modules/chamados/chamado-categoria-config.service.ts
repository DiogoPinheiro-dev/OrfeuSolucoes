import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { FEATURES } from './constants/chamado.constants';
import { CreateChamadoCategoriaInput, UpdateChamadoCategoriaInput } from './dto/chamado-categoria.input';
import { ChamadoCategoriaType } from './dto/chamado-categoria.type';
import { toCategoriaType } from './mappers/chamado.mapper';
import { ChamadoCategoriaRecord } from './types/chamado-record.types';

@Injectable()
export class ChamadoCategoriaConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ChamadoAuthorizationService
  ) {}

  async categoriasChamado(user: JwtPayload, ativas = true): Promise<ChamadoCategoriaType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);

    if (!(await this.authorization.canUseAnyChamadosFeature(user))) {
      throw new ForbiddenException('Usuario sem acesso ao controle de chamados.');
    }

    const categorias = (await (this.prisma as never as { chamadoCategoria: { findMany: Function } }).chamadoCategoria.findMany({
      where: {
        empresaId,
        ...(ativas ? { ativo: true } : {})
      },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }]
    })) as ChamadoCategoriaRecord[];

    return categorias.map((categoria) => toCategoriaType(categoria));
  }

  async createCategoria(input: CreateChamadoCategoriaInput, user: JwtPayload): Promise<ChamadoCategoriaType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.categorias, 'incluir');

    const created = (await (this.prisma as never as { chamadoCategoria: { create: Function } }).chamadoCategoria.create({
      data: {
        empresaId,
        nome: this.requiredText(input.nome, 'nome'),
        descricao: input.descricao?.trim() || null,
        ativo: input.ativo ?? true
      }
    })) as ChamadoCategoriaRecord;

    return toCategoriaType(created);
  }

  async updateCategoria(input: UpdateChamadoCategoriaInput, user: JwtPayload): Promise<ChamadoCategoriaType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.categorias, 'alterar');
    await this.ensureCategoria(input.id, empresaId, false);

    const updated = (await (this.prisma as never as { chamadoCategoria: { update: Function } }).chamadoCategoria.update({
      where: { id: input.id },
      data: {
        ...(input.nome !== undefined ? { nome: this.requiredText(input.nome ?? '', 'nome') } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
        ...(input.ativo !== undefined && input.ativo !== null ? { ativo: input.ativo } : {})
      }
    })) as ChamadoCategoriaRecord;

    return toCategoriaType(updated);
  }

  async deleteCategoria(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.categorias, 'excluir');
    await this.ensureCategoria(id, empresaId, false);

    await (this.prisma as never as { chamadoCategoria: { update: Function } }).chamadoCategoria.update({
      where: { id },
      data: { ativo: false }
    });

    return true;
  }

  async ensureCategoria(id: number, empresaId: number, requireActive: boolean): Promise<ChamadoCategoriaRecord> {
    const categoria = (await (this.prisma as never as { chamadoCategoria: { findFirst: Function } }).chamadoCategoria.findFirst({
      where: {
        id,
        empresaId,
        ...(requireActive ? { ativo: true } : {})
      }
    })) as ChamadoCategoriaRecord | null;

    if (!categoria) {
      throw new NotFoundException('Categoria de chamado nao encontrada.');
    }

    return categoria;
  }

  private requiredText(value: string, fieldName: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(`Preencha ${fieldName}.`);
    }

    return normalized;
  }
}
