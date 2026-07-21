import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FormFieldBadRequestException } from '../../common/exceptions/form-field.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateProjetoInput, ProjetoMembroInput } from './dto/create-projeto.input';
import { ProjetoType } from './dto/projeto.type';
import { UpdateProjetoInput } from './dto/update-projeto.input';
import { resolveMeuPapel } from './mappers/projeto.mapper';
import {
  normalizeCalendarDate,
  normalizeProjetoKey,
  normalizeRequiredName,
  validatePlannedDates,
  validateProjetoDefaults,
  validateProjetoMetodologia
} from './policies/projeto-input.policy';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoQueryService } from './projeto-query.service';
import { ProjetoPapel, ProjetoRecord, ProjetoSaude, ProjetoSituacao } from './types/projeto.types';

type EligibleUser = {
  id: string;
  login?: string | null;
  grupo?: Parameters<ProjetoAuthorizationService['groupHasProjectAccess']>[0];
};

@Injectable()
export class ProjetoCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoAuthorizationService,
    private readonly queryService: ProjetoQueryService
  ) {}

  async create(input: CreateProjetoInput, user: JwtPayload): Promise<ProjetoType> {
    const empresaId = await this.authorization.assertCreateAccess(user);
    const chave = normalizeProjetoKey(input.chave);
    const nome = normalizeRequiredName(input.nome);
    const situacao = input.situacao ?? ProjetoSituacao.RASCUNHO;
    const saude = input.saude ?? ProjetoSaude.EM_DIA;
    validateProjetoDefaults(input.metodologia, situacao, saude);
    const inicioPrevistoEm = normalizeCalendarDate(input.inicioPrevistoEm);
    const fimPrevistoEm = normalizeCalendarDate(input.fimPrevistoEm);
    validatePlannedDates(inicioPrevistoEm, fimPrevistoEm);
    const participantes = this.normalizeParticipants(input.participantes ?? [], input.responsavelId, user.sub);

    if (await this.prisma.projeto.findUnique({
      where: { empresaId_chave: { empresaId, chave } },
      select: { id: true }
    })) {
      throw new FormFieldBadRequestException('chave', 'Ja existe um projeto com esta chave na empresa.');
    }

    const projetoId = await this.prisma.$transaction(async (tx) => {
      await this.assertEligibleUsers(tx, empresaId, [
        input.responsavelId,
        ...participantes.map((item) => item.usuarioId)
      ]);
      const projeto = await tx.projeto.create({
        data: {
          empresaId,
          chave,
          nome,
          objetivo: this.normalizeOptionalText(input.objetivo),
          descricao: this.normalizeOptionalText(input.descricao),
          metodologia: input.metodologia,
          situacao,
          saude,
          inicioPrevistoEm,
          fimPrevistoEm,
          responsavelId: input.responsavelId,
          criadoPorId: user.sub
        },
        select: { id: true }
      });

      if (participantes.length) {
        await tx.projetoMembro.createMany({
          data: participantes.map((item) => ({
            projetoId: projeto.id,
            usuarioId: item.usuarioId,
            papel: item.papel
          }))
        });
      }

      return projeto.id;
    });

    return this.queryService.findOne(projetoId, user);
  }

  async update(input: UpdateProjetoInput, user: JwtPayload): Promise<ProjetoType> {
    const empresaId = await this.authorization.assertReadAccess(user);
    const projeto = await this.prisma.projeto.findFirst({
      where: { id: input.id, empresaId },
      include: {
        responsavel: { include: { grupo: true } },
        criadoPor: { include: { grupo: true } },
        arquivadoPor: { include: { grupo: true } },
        membros: { include: { usuario: { include: { grupo: true } } } }
      }
    }) as unknown as ProjetoRecord | null;
    this.authorization.assertVisibleProject(projeto, user, empresaId);

    if (projeto.arquivadoEm) {
      throw new BadRequestException('Reative o projeto antes de editar seus dados.');
    }

    await this.authorization.assertCanEdit(user, resolveMeuPapel(projeto, user.sub));

    const inicioPrevistoEm = input.inicioPrevistoEm === undefined
      ? projeto.inicioPrevistoEm ?? null
      : normalizeCalendarDate(input.inicioPrevistoEm);
    const fimPrevistoEm = input.fimPrevistoEm === undefined
      ? projeto.fimPrevistoEm ?? null
      : normalizeCalendarDate(input.fimPrevistoEm);
    validatePlannedDates(inicioPrevistoEm, fimPrevistoEm);
    if (input.metodologia !== undefined) {
      validateProjetoMetodologia(input.metodologia);
    }

    await this.prisma.projeto.update({
      where: { id: projeto.id },
      data: {
        ...(input.nome !== undefined ? { nome: normalizeRequiredName(input.nome) } : {}),
        ...(input.objetivo !== undefined ? { objetivo: this.normalizeOptionalText(input.objetivo) } : {}),
        ...(input.descricao !== undefined ? { descricao: this.normalizeOptionalText(input.descricao) } : {}),
        ...(input.metodologia !== undefined ? { metodologia: input.metodologia } : {}),
        ...(input.inicioPrevistoEm !== undefined ? { inicioPrevistoEm } : {}),
        ...(input.fimPrevistoEm !== undefined ? { fimPrevistoEm } : {})
      }
    });

    return this.queryService.findOne(projeto.id, user);
  }

  private normalizeParticipants(input: ProjetoMembroInput[], responsavelId: string, creatorId: string): ProjetoMembroInput[] {
    const seen = new Set<string>();
    const participantes: ProjetoMembroInput[] = [];

    for (const item of input) {
      if (item.papel !== ProjetoPapel.MEMBRO && item.papel !== ProjetoPapel.OBSERVADOR) {
        throw new BadRequestException('Participantes devem possuir papel MEMBRO ou OBSERVADOR.');
      }

      if (item.usuarioId === responsavelId) {
        throw new BadRequestException('O responsavel nao pode ser duplicado como participante.');
      }

      if (seen.has(item.usuarioId)) {
        throw new BadRequestException('Um usuario nao pode possuir dois papeis no mesmo projeto.');
      }

      seen.add(item.usuarioId);
      participantes.push({ usuarioId: item.usuarioId, papel: item.papel });
    }

    if (creatorId !== responsavelId) {
      const creator = participantes.find((item) => item.usuarioId === creatorId);

      if (creator) {
        creator.papel = ProjetoPapel.MEMBRO;
      } else {
        participantes.push({ usuarioId: creatorId, papel: ProjetoPapel.MEMBRO });
      }
    }

    return participantes;
  }

  private async assertEligibleUsers(tx: Prisma.TransactionClient, empresaId: number, usuarioIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(usuarioIds)];
    const links = await tx.empresaUsuario.findMany({
      where: { empresaId, usuarioId: { in: uniqueIds } },
      include: {
        usuario: {
          include: {
            grupo: {
              include: {
                solucoes: { include: { solucao: true } },
                funcionalidades: { include: { funcionalidade: { include: { solucao: true } } } }
              }
            }
          }
        }
      }
    }) as unknown as Array<{ usuario: EligibleUser }>;
    const eligibleIds = new Set(
      links
        .filter(({ usuario }) => this.authorization.isSystemAdmin(usuario) || this.authorization.groupHasProjectAccess(usuario.grupo))
        .map(({ usuario }) => usuario.id)
    );

    if (uniqueIds.some((id) => !eligibleIds.has(id))) {
      throw new BadRequestException('Responsavel e participantes devem pertencer a empresa e possuir acesso a Projetos.');
    }
  }

  private normalizeOptionalText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
