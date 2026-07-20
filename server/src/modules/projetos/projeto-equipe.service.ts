import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoMembroInput } from './dto/create-projeto.input';
import { ProjetoType } from './dto/projeto.type';
import { UpdateProjetoEquipeInput } from './dto/update-projeto-equipe.input';
import { resolveMeuPapel } from './mappers/projeto.mapper';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoQueryService } from './projeto-query.service';
import { ProjetoPapel, ProjetoRecord } from './types/projeto.types';

type EligibleUser = {
  id: string;
  login?: string | null;
  grupo?: Parameters<ProjetoAuthorizationService['groupHasProjectAccess']>[0];
};

@Injectable()
export class ProjetoEquipeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoAuthorizationService,
    private readonly queryService: ProjetoQueryService
  ) {}

  async updateEquipe(input: UpdateProjetoEquipeInput, user: JwtPayload): Promise<ProjetoType> {
    const empresaId = await this.authorization.assertReadAccess(user);
    const projeto = await this.findProjeto(input.projetoId, empresaId);
    this.authorization.assertVisibleProject(projeto, user, empresaId);

    if (projeto.arquivadoEm) {
      throw new BadRequestException('Reative o projeto antes de alterar a equipe.');
    }

    await this.authorization.assertCanManageTeam(user, resolveMeuPapel(projeto, user.sub));
    const participantes = this.normalizeTeam(
      input.participantes ?? [],
      input.responsavelId,
      projeto.responsavelId
    );

    await this.prisma.$transaction(async (tx) => {
      await this.assertEligibleUsers(tx, empresaId, [
        input.responsavelId,
        ...participantes.map((item) => item.usuarioId)
      ]);
      await tx.projetoMembro.deleteMany({ where: { projetoId: projeto.id } });

      if (participantes.length) {
        await tx.projetoMembro.createMany({
          data: participantes.map((item) => ({
            projetoId: projeto.id,
            usuarioId: item.usuarioId,
            papel: item.papel
          }))
        });
      }

      await tx.projeto.update({
        where: { id: projeto.id },
        data: { responsavelId: input.responsavelId }
      });
    });

    return this.queryService.findOne(projeto.id, user);
  }

  private normalizeTeam(
    input: ProjetoMembroInput[],
    novoResponsavelId: string,
    antigoResponsavelId: string
  ): ProjetoMembroInput[] {
    if (!novoResponsavelId) {
      throw new BadRequestException('O projeto deve possuir um responsavel.');
    }

    const byUser = new Map<string, ProjetoMembroInput>();
    const seen = new Set<string>();

    for (const item of input) {
      if (item.papel !== ProjetoPapel.MEMBRO && item.papel !== ProjetoPapel.OBSERVADOR) {
        throw new BadRequestException('Participantes devem possuir papel MEMBRO ou OBSERVADOR.');
      }

      if (seen.has(item.usuarioId)) {
        throw new BadRequestException('Um usuario nao pode possuir dois papeis no mesmo projeto.');
      }

      seen.add(item.usuarioId);

      if (item.usuarioId !== novoResponsavelId) {
        byUser.set(item.usuarioId, { usuarioId: item.usuarioId, papel: item.papel });
      }
    }

    if (antigoResponsavelId !== novoResponsavelId) {
      byUser.set(antigoResponsavelId, {
        usuarioId: antigoResponsavelId,
        papel: ProjetoPapel.MEMBRO
      });
    }

    return [...byUser.values()];
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

  private async findProjeto(id: string, empresaId: number): Promise<ProjetoRecord | null> {
    return await this.prisma.projeto.findFirst({
      where: { id, empresaId },
      include: {
        responsavel: { include: { grupo: true } },
        criadoPor: { include: { grupo: true } },
        arquivadoPor: { include: { grupo: true } },
        membros: { include: { usuario: { include: { grupo: true } } } }
      }
    }) as unknown as ProjetoRecord | null;
  }
}
