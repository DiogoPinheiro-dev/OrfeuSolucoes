import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { AtualizarCicloProjetoInput } from './dto/atualizar-ciclo-projeto.input';
import { ProjetoType } from './dto/projeto.type';
import { resolveMeuPapel } from './mappers/projeto.mapper';
import { assertProjetoSituacaoTransition } from './policies/projeto-situacao.policy';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoQueryService } from './projeto-query.service';
import { ProjetoRecord, ProjetoSaude, ProjetoSituacao } from './types/projeto.types';

@Injectable()
export class ProjetoLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoAuthorizationService,
    private readonly queryService: ProjetoQueryService
  ) {}

  async atualizarCiclo(input: AtualizarCicloProjetoInput, user: JwtPayload): Promise<ProjetoType> {
    if (input.situacao === undefined && input.saude === undefined) {
      throw new BadRequestException('Informe a situacao ou a saude do projeto.');
    }

    const empresaId = await this.authorization.assertReadAccess(user);
    const projeto = await this.findProjeto(input.projetoId, empresaId);
    this.authorization.assertVisibleProject(projeto, user, empresaId);

    if (projeto.arquivadoEm) {
      throw new BadRequestException('Reative o projeto antes de alterar seu ciclo de vida.');
    }

    const papel = resolveMeuPapel(projeto, user.sub);
    await this.authorization.assertCanChangeStatus(user, papel);
    const data: {
      situacao?: ProjetoSituacao;
      saude?: ProjetoSaude;
      inicioRealEm?: Date;
      fimRealEm?: Date | null;
    } = {};

    if (input.saude !== undefined) {
      if (!Object.values(ProjetoSaude).includes(input.saude)) {
        throw new BadRequestException('Saude de projeto invalida.');
      }

      data.saude = input.saude;
    }

    if (input.situacao !== undefined) {
      const situacaoAtual = projeto.situacao as ProjetoSituacao;
      assertProjetoSituacaoTransition(
        situacaoAtual,
        input.situacao,
        papel,
        this.authorization.isSystemAdmin(user)
      );
      data.situacao = input.situacao;

      if (input.situacao === ProjetoSituacao.EM_ANDAMENTO && !projeto.inicioRealEm) {
        data.inicioRealEm = new Date();
      }

      if (input.situacao === ProjetoSituacao.CONCLUIDO || input.situacao === ProjetoSituacao.CANCELADO) {
        data.fimRealEm = new Date();
      } else if (
        (situacaoAtual === ProjetoSituacao.CONCLUIDO || situacaoAtual === ProjetoSituacao.CANCELADO) &&
        input.situacao === ProjetoSituacao.PLANEJADO
      ) {
        data.fimRealEm = null;
      }
    }

    await this.prisma.projeto.update({ where: { id: projeto.id }, data });
    return this.queryService.findOne(projeto.id, user);
  }

  async arquivar(id: string, user: JwtPayload): Promise<ProjetoType> {
    const empresaId = await this.authorization.assertReadAccess(user);
    const projeto = await this.findProjeto(id, empresaId);
    this.authorization.assertVisibleProject(projeto, user, empresaId);

    if (projeto.arquivadoEm) {
      throw new BadRequestException('O projeto ja esta arquivado.');
    }

    await this.authorization.assertCanArchive(user, resolveMeuPapel(projeto, user.sub));
    await this.prisma.projeto.update({
      where: { id: projeto.id },
      data: { arquivadoEm: new Date(), arquivadoPorId: user.sub }
    });
    return this.queryService.findOne(projeto.id, user);
  }

  async reativar(id: string, user: JwtPayload): Promise<ProjetoType> {
    const empresaId = await this.authorization.assertReadAccess(user);
    const projeto = await this.findProjeto(id, empresaId);
    this.authorization.assertVisibleProject(projeto, user, empresaId);

    if (!projeto.arquivadoEm) {
      throw new BadRequestException('O projeto nao esta arquivado.');
    }

    await this.authorization.assertCanReactivate(user, resolveMeuPapel(projeto, user.sub));
    await this.prisma.projeto.update({
      where: { id: projeto.id },
      data: { arquivadoEm: null, arquivadoPorId: null }
    });
    return this.queryService.findOne(projeto.id, user);
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
