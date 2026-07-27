import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import {
  CreateProjetoEntregaInput,
  CreateProjetoMarcoInput,
  UpdateProjetoEntregaInput,
  UpdateProjetoMarcoInput,
  VersionarProjetoCompromissoInput
} from './dto/projeto-marco-entrega.input';
import {
  ProjetoEntregaType,
  ProjetoMarcoEntregaPainelType,
  ProjetoMarcoType
} from './dto/projeto-marco-entrega.type';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import {
  ProjetoMarcoEntregaAuthorizationService,
  ProjetoMarcoEntregaContexto
} from './projeto-marco-entrega-authorization.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoItemStatus } from './types/projeto-item.types';
import {
  ProjetoEntregaStatus,
  ProjetoMarcoStatus
} from './types/projeto-marco-entrega.types';

const ITEM_INCLUDE = { include: { item: true } };
const MARCO_INCLUDE = {
  responsavel: true,
  itens: ITEM_INCLUDE
};
const ENTREGA_INCLUDE = {
  responsavel: true,
  marco: true,
  itens: ITEM_INCLUDE
};

@Injectable()
export class ProjetoMarcoEntregaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoMarcoEntregaAuthorizationService,
    private readonly auditoria: ProjetoAuditoriaService,
    private readonly periodo: ProjetoPeriodoService
  ) {}

  async painel(
    projetoId: string,
    incluirArquivados: boolean,
    user: JwtPayload
  ): Promise<ProjetoMarcoEntregaPainelType> {
    const contexto = await this.authorization.assertReadContext(projetoId, user);
    const [marcos, entregas, itens, permissoes] = await Promise.all([
      this.prisma.projetoMarco.findMany({
        where: { projetoId, empresaId: contexto.empresaId, ...(!incluirArquivados ? { arquivadoEm: null } : {}) },
        include: MARCO_INCLUDE,
        orderBy: [{ dataPrevistaEm: 'asc' }, { nome: 'asc' }]
      }),
      this.prisma.projetoEntrega.findMany({
        where: { projetoId, empresaId: contexto.empresaId, ...(!incluirArquivados ? { arquivadoEm: null } : {}) },
        include: ENTREGA_INCLUDE,
        orderBy: [{ fimPrevistoEm: 'asc' }, { nome: 'asc' }]
      }),
      this.prisma.projetoItem.findMany({
        where: { projetoId, empresaId: contexto.empresaId, arquivadoEm: null },
        orderBy: [{ ordemBacklog: 'asc' }, { numero: 'asc' }]
      }),
      this.authorization.effectivePermissions(contexto, user)
    ]);
    return {
      marcos: marcos.map((item) => this.toMarco(item)),
      entregas: entregas.map((item) => this.toEntrega(item)),
      itensDisponiveis: itens.map((item) => this.toItem(item)),
      responsaveis: contexto.projeto.membros.map((membro) => ({
        id: membro.usuario.id,
        nome: membro.usuario.nome,
        login: membro.usuario.login,
        email: membro.usuario.email
      })),
      permissoes
    };
  }

  async createMarco(input: CreateProjetoMarcoInput, user: JwtPayload): Promise<ProjetoMarcoType> {
    const contexto = await this.writeContext(input.projetoId, user, ProjetoAcao.INCLUIR, 'criar marcos');
    this.assertMarco(input.status, input.dataRealizadaEm);
    return this.prisma.$transaction(async (tx) => {
      await this.assertRelations(tx, contexto, input.responsavelId, input.itemIds);
      const marco = await tx.projetoMarco.create({
        data: {
          empresaId: contexto.empresaId,
          projetoId: input.projetoId,
          nome: input.nome.trim(),
          descricao: this.optional(input.descricao),
          responsavelId: input.responsavelId,
          status: input.status,
          dataPrevistaEm: this.date(input.dataPrevistaEm),
          dataRealizadaEm: input.dataRealizadaEm ? this.date(input.dataRealizadaEm) : null,
          criadoPorId: user.sub,
          itens: { create: input.itemIds.map((itemId) => ({ empresaId: contexto.empresaId, projetoId: input.projetoId, itemId })) }
        },
        include: MARCO_INCLUDE
      });
      await this.audit(tx, contexto, user, 'MARCO', marco.id, 'CRIADO');
      return this.toMarco(marco);
    });
  }

  async updateMarco(input: UpdateProjetoMarcoInput, user: JwtPayload): Promise<ProjetoMarcoType> {
    const current = await this.marcoReference(input.id);
    const contexto = await this.writeContext(current.projetoId, user, ProjetoAcao.ALTERAR, 'alterar marcos');
    this.assertMarco(input.status, input.dataRealizadaEm);
    return this.prisma.$transaction(async (tx) => {
      await this.assertRelations(tx, contexto, input.responsavelId, input.itemIds);
      await this.claim(tx.projetoMarco, input.id, input.versao, {
        nome: input.nome.trim(),
        descricao: this.optional(input.descricao),
        responsavelId: input.responsavelId,
        status: input.status,
        dataPrevistaEm: this.date(input.dataPrevistaEm),
        dataRealizadaEm: input.dataRealizadaEm ? this.date(input.dataRealizadaEm) : null,
        versao: { increment: 1 }
      }, 'O marco');
      await tx.projetoMarcoItem.deleteMany({ where: { marcoId: input.id } });
      if (input.itemIds.length) {
        await tx.projetoMarcoItem.createMany({
          data: input.itemIds.map((itemId) => ({ empresaId: contexto.empresaId, projetoId: current.projetoId, marcoId: input.id, itemId }))
        });
      }
      await this.audit(tx, contexto, user, 'MARCO', input.id, 'ALTERADO');
      return this.findMarco(tx, input.id);
    });
  }

  async createEntrega(input: CreateProjetoEntregaInput, user: JwtPayload): Promise<ProjetoEntregaType> {
    const contexto = await this.writeContext(input.projetoId, user, ProjetoAcao.INCLUIR, 'criar entregas');
    this.assertEntrega(input);
    return this.prisma.$transaction(async (tx) => {
      await this.assertRelations(tx, contexto, input.responsavelId, input.itemIds, input.marcoId);
      const entrega = await tx.projetoEntrega.create({
        data: {
          empresaId: contexto.empresaId,
          projetoId: input.projetoId,
          marcoId: input.marcoId || null,
          nome: input.nome.trim(),
          resultadoEsperado: input.resultadoEsperado.trim(),
          criteriosAceite: input.criteriosAceite.trim(),
          responsavelId: input.responsavelId,
          status: input.status,
          inicioPrevistoEm: this.date(input.inicioPrevistoEm),
          fimPrevistoEm: this.date(input.fimPrevistoEm),
          concluidaEm: input.concluidaEm ? new Date(input.concluidaEm) : null,
          criadoPorId: user.sub,
          itens: { create: input.itemIds.map((itemId) => ({ empresaId: contexto.empresaId, projetoId: input.projetoId, itemId })) }
        },
        include: ENTREGA_INCLUDE
      });
      await this.audit(tx, contexto, user, 'ENTREGA', entrega.id, 'CRIADA');
      return this.toEntrega(entrega);
    });
  }

  async updateEntrega(input: UpdateProjetoEntregaInput, user: JwtPayload): Promise<ProjetoEntregaType> {
    const current = await this.entregaReference(input.id);
    const contexto = await this.writeContext(current.projetoId, user, ProjetoAcao.ALTERAR, 'alterar entregas');
    this.assertEntrega(input);
    return this.prisma.$transaction(async (tx) => {
      await this.assertRelations(tx, contexto, input.responsavelId, input.itemIds, input.marcoId);
      await this.claim(tx.projetoEntrega, input.id, input.versao, {
        marcoId: input.marcoId || null,
        nome: input.nome.trim(),
        resultadoEsperado: input.resultadoEsperado.trim(),
        criteriosAceite: input.criteriosAceite.trim(),
        responsavelId: input.responsavelId,
        status: input.status,
        inicioPrevistoEm: this.date(input.inicioPrevistoEm),
        fimPrevistoEm: this.date(input.fimPrevistoEm),
        concluidaEm: input.concluidaEm ? new Date(input.concluidaEm) : null,
        versao: { increment: 1 }
      }, 'A entrega');
      await tx.projetoEntregaItem.deleteMany({ where: { entregaId: input.id } });
      if (input.itemIds.length) {
        await tx.projetoEntregaItem.createMany({
          data: input.itemIds.map((itemId) => ({ empresaId: contexto.empresaId, projetoId: current.projetoId, entregaId: input.id, itemId }))
        });
      }
      await this.audit(tx, contexto, user, 'ENTREGA', input.id, 'ALTERADA');
      return this.findEntrega(tx, input.id);
    });
  }

  async archive(kind: 'MARCO' | 'ENTREGA', input: VersionarProjetoCompromissoInput, user: JwtPayload, reactivate = false): Promise<ProjetoMarcoType | ProjetoEntregaType> {
    const current = kind === 'MARCO' ? await this.marcoReference(input.id) : await this.entregaReference(input.id);
    const contexto = await this.writeContext(current.projetoId, user, reactivate ? ProjetoAcao.ALTERAR : ProjetoAcao.EXCLUIR, `${reactivate ? 'reativar' : 'arquivar'} compromissos`);
    return this.prisma.$transaction(async (tx) => {
      const model = kind === 'MARCO' ? tx.projetoMarco : tx.projetoEntrega;
      await this.claim(model, input.id, input.versao, {
        arquivadoEm: reactivate ? null : new Date(),
        arquivadoPorId: reactivate ? null : user.sub,
        versao: { increment: 1 }
      }, kind === 'MARCO' ? 'O marco' : 'A entrega');
      await this.auditoria.registrar(tx, {
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        usuarioId: user.sub,
        entidade: kind,
        entidadeId: input.id,
        evento: reactivate ? 'REATIVADO' : 'ARQUIVADO'
      });
      return kind === 'MARCO' ? this.findMarco(tx, input.id) : this.findEntrega(tx, input.id);
    });
  }

  private async writeContext(projetoId: string, user: JwtPayload, action: string, operation: string) {
    const contexto = await this.authorization.assertReadContext(projetoId, user);
    await this.authorization.assertAction(contexto, user, action, operation);
    return contexto;
  }

  private async assertRelations(tx: Prisma.TransactionClient, contexto: ProjetoMarcoEntregaContexto, responsavelId: string, itemIds: string[], marcoId?: string | null) {
    const member = contexto.projeto.membros.some((item) => item.usuarioId === responsavelId);
    if (!member) throw new BadRequestException('O responsavel deve participar do projeto.');
    const count = itemIds.length ? await tx.projetoItem.count({
      where: { id: { in: itemIds }, projetoId: contexto.projeto.id, empresaId: contexto.empresaId, arquivadoEm: null }
    }) : 0;
    if (count !== itemIds.length) throw new BadRequestException('Todos os itens devem pertencer ao projeto.');
    if (marcoId) {
      const marco = await tx.projetoMarco.findFirst({ where: { id: marcoId, projetoId: contexto.projeto.id, arquivadoEm: null } });
      if (!marco) throw new BadRequestException('O marco deve pertencer ao mesmo projeto.');
    }
  }

  private assertMarco(status: ProjetoMarcoStatus, realizada?: string | null) {
    if (status === ProjetoMarcoStatus.ATINGIDO && !realizada) {
      throw new BadRequestException('Informe a data realizada para um marco atingido.');
    }
    if (status !== ProjetoMarcoStatus.ATINGIDO && realizada) {
      throw new BadRequestException('A data realizada exige o status atingido.');
    }
  }

  private assertEntrega(input: CreateProjetoEntregaInput | UpdateProjetoEntregaInput) {
    this.periodo.assertPeriodoValido(this.date(input.inicioPrevistoEm), this.date(input.fimPrevistoEm));
    if (input.status === ProjetoEntregaStatus.CONCLUIDA && !input.concluidaEm) {
      throw new BadRequestException('Informe a data de conclusao da entrega.');
    }
    if (input.status !== ProjetoEntregaStatus.CONCLUIDA && input.concluidaEm) {
      throw new BadRequestException('A data de conclusao exige o status concluida.');
    }
  }

  private marcoReference(id: string): Promise<any> {
    return this.prisma.projetoMarco.findUnique({ where: { id } }).then((item) => {
      if (!item) throw new NotFoundException('Marco nao encontrado.');
      return item;
    });
  }

  private entregaReference(id: string): Promise<any> {
    return this.prisma.projetoEntrega.findUnique({ where: { id } }).then((item) => {
      if (!item) throw new NotFoundException('Entrega nao encontrada.');
      return item;
    });
  }

  private async findMarco(tx: Prisma.TransactionClient | PrismaService, id: string): Promise<ProjetoMarcoType> {
    const item = await tx.projetoMarco.findUnique({ where: { id }, include: MARCO_INCLUDE });
    if (!item) throw new NotFoundException('Marco nao encontrado.');
    return this.toMarco(item);
  }

  private async findEntrega(tx: Prisma.TransactionClient | PrismaService, id: string): Promise<ProjetoEntregaType> {
    const item = await tx.projetoEntrega.findUnique({ where: { id }, include: ENTREGA_INCLUDE });
    if (!item) throw new NotFoundException('Entrega nao encontrada.');
    return this.toEntrega(item);
  }

  private async claim(model: any, id: string, versao: number, data: any, label: string) {
    const result = await model.updateMany({ where: { id, versao }, data });
    if (result.count !== 1) throw new ConflictException(`${label} foi alterado por outra pessoa. Atualize os dados.`);
  }

  private audit(tx: Prisma.TransactionClient, contexto: ProjetoMarcoEntregaContexto, user: JwtPayload, entidade: string, id: string, evento: string) {
    return this.auditoria.registrar(tx, {
      empresaId: contexto.empresaId,
      projetoId: contexto.projeto.id,
      usuarioId: user.sub,
      entidade,
      entidadeId: id,
      evento
    });
  }

  private metrics(itens: any[]) {
    const total = itens.length;
    const concluidos = itens.filter(({ item }) => item.status === ProjetoItemStatus.CONCLUIDO).length;
    return {
      itens: itens.map(({ item }) => this.toItem(item)),
      progressoPercentual: total ? Math.round((concluidos / total) * 100) : 0,
      itensSemEstimativa: itens.filter(({ item }) => item.estimativaMinutos == null).length
    };
  }

  private toMarco(item: any): ProjetoMarcoType {
    const metrics = this.metrics(item.itens ?? []);
    return {
      id: item.id,
      projetoId: item.projetoId,
      nome: item.nome,
      descricao: item.descricao ?? null,
      status: item.status,
      dataPrevistaEm: item.dataPrevistaEm,
      dataRealizadaEm: item.dataRealizadaEm ?? null,
      responsavel: this.user(item.responsavel),
      versao: item.versao,
      atrasado: !item.arquivadoEm && item.status === ProjetoMarcoStatus.PLANEJADO && this.isPast(item.dataPrevistaEm),
      ...metrics,
      arquivadoEm: item.arquivadoEm ?? null,
      criadoEm: item.criadoEm,
      atualizadoEm: item.atualizadoEm
    };
  }

  private toEntrega(item: any): ProjetoEntregaType {
    const metrics = this.metrics(item.itens ?? []);
    return {
      id: item.id,
      projetoId: item.projetoId,
      nome: item.nome,
      resultadoEsperado: item.resultadoEsperado,
      criteriosAceite: item.criteriosAceite,
      status: item.status,
      inicioPrevistoEm: item.inicioPrevistoEm,
      fimPrevistoEm: item.fimPrevistoEm,
      concluidaEm: item.concluidaEm ?? null,
      marcoId: item.marcoId ?? null,
      marcoNome: item.marco?.nome ?? null,
      responsavel: this.user(item.responsavel),
      versao: item.versao,
      atrasada: !item.arquivadoEm && ![ProjetoEntregaStatus.CONCLUIDA, ProjetoEntregaStatus.CANCELADA].includes(item.status) && this.isPast(item.fimPrevistoEm),
      ...metrics,
      arquivadoEm: item.arquivadoEm ?? null,
      criadoEm: item.criadoEm,
      atualizadoEm: item.atualizadoEm
    };
  }

  private toItem(item: any) {
    return {
      id: item.id,
      chave: item.chave,
      titulo: item.titulo,
      status: item.status,
      estimativaMinutos: item.estimativaMinutos ?? null
    };
  }

  private user(user: any) {
    return { id: user.id, nome: user.nome, login: user.login, email: user.email };
  }

  private date(value: string): Date {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Data invalida.');
    return date;
  }

  private optional(value?: string | null) {
    const normalized = value?.trim();
    return normalized || null;
  }

  private isPast(value: Date) {
    const today = new Date();
    const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return value.getTime() < utcToday;
  }
}
