import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import { resolveMeuPapel } from './mappers/projeto.mapper';
import { PROJETO_APONTAMENTO_CICLOS_ELEGIVEIS } from './policies/projeto-apontamento-status.policy';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoRecursoHierarquiaService } from './projeto-recurso-hierarquia.service';
import { ProjetoPapel, ProjetoRecord } from './types/projeto.types';

const PROJECT_INCLUDE = { responsavel: true, criadoPor: true, arquivadoPor: true, membros: { include: { usuario: true } } };
const PAPEIS_QUE_LANCAM_HORAS: readonly (ProjetoPapel | null)[] = [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO];

export type ProjetoApontamentoContexto = { empresaId: number; projeto: ProjetoRecord; papel: ProjetoPapel | null };
export type ProjetoApontamentoPermissoesDoAutor = { podeIncluir: boolean; podeAlterar: boolean; podeExcluir: boolean };

@Injectable()
export class ProjetoApontamentoAuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoAuthorizationService,
    private readonly recursoHierarquia: ProjetoRecursoHierarquiaService
  ) {}

  /** Confere a ação em Meus apontamentos e devolve a empresa ativa. */
  assertAcaoDoAutor(user: JwtPayload, acao: string): Promise<number> {
    return this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.MEUS_APONTAMENTOS, acao);
  }

  /**
   * Projeto da empresa ativa em que a pessoa lança horas: não arquivado e com participação como responsável ou
   * membro. O administrador do sistema também precisa participar, porque cada um lança só as próprias horas.
   */
  async projetoParaLancar(projetoId: string, user: JwtPayload, empresaId: number): Promise<ProjetoApontamentoContexto> {
    const projeto = await this.prisma.projeto.findFirst({
      where: { id: projetoId, empresaId },
      include: PROJECT_INCLUDE
    }) as unknown as ProjetoRecord | null;

    this.authorization.assertVisibleProject(projeto, user, empresaId);
    this.authorization.assertWritableProject(projeto);
    const papel = resolveMeuPapel(projeto, user.sub);
    if (!this.lancaHoras(papel)) {
      throw new ForbiddenException('Somente o responsável e os membros do projeto lançam horas nele.');
    }

    return { empresaId, projeto, papel };
  }

  lancaHoras(papel: ProjetoPapel | null): boolean {
    return PAPEIS_QUE_LANCAM_HORAS.includes(papel);
  }

  filtroProjetosParaLancar(user: JwtPayload, empresaId: number): Prisma.ProjetoWhereInput {
    return {
      empresaId,
      arquivadoEm: null,
      situacao: { in: [...PROJETO_APONTAMENTO_CICLOS_ELEGIVEIS] },
      OR: [
        { responsavelId: user.sub },
        { membros: { some: { usuarioId: user.sub, papel: ProjetoPapel.MEMBRO } } }
      ]
    };
  }

  /** Itens que a pessoa pode associar aos próprios apontamentos: do projeto, ativos e no escopo hierárquico dela. */
  async filtroItensParaLancar(user: JwtPayload, contexto: ProjetoApontamentoContexto): Promise<Prisma.ProjetoItemWhereInput> {
    const escopo = await this.recursoHierarquia.escopo(user, contexto.empresaId, contexto.projeto.id);

    return {
      empresaId: contexto.empresaId,
      projetoId: contexto.projeto.id,
      arquivadoEm: null,
      ...this.recursoHierarquia.filtroProjetoItem(escopo)
    };
  }

  async permissoesDoAutor(user: JwtPayload): Promise<ProjetoApontamentoPermissoesDoAutor> {
    const [podeIncluir, podeAlterar, podeExcluir] = await Promise.all([
      this.pode(user, ProjetoAcao.INCLUIR),
      this.pode(user, ProjetoAcao.ALTERAR),
      this.pode(user, ProjetoAcao.EXCLUIR)
    ]);

    return { podeIncluir, podeAlterar, podeExcluir };
  }

  private async pode(user: JwtPayload, acao: string): Promise<boolean> {
    try {
      await this.assertAcaoDoAutor(user, acao);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) return false;
      throw error;
    }
  }
}
