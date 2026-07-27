import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { resolveMeuPapel } from './mappers/projeto.mapper';
import { ProjetoComunicacaoPermissoes } from './types/projeto-comunicacao.types';
import { ProjetoPapel, ProjetoRecord } from './types/projeto.types';

const PROJECT_INCLUDE = { responsavel: true, criadoPor: true, arquivadoPor: true, membros: { include: { usuario: true } } };
export type ProjetoComunicacaoContexto = { empresaId: number; projeto: ProjetoRecord; papel: ProjetoPapel | null };

@Injectable()
export class ProjetoComunicacaoAuthorizationService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ProjetoAuthorizationService) {}

  async assertListCompany(user: JwtPayload): Promise<number> {
    return this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.COMUNICACAO, ProjetoAcao.VISUALIZAR);
  }
  async assertReadContext(projetoId: string, user: JwtPayload): Promise<ProjetoComunicacaoContexto> {
    const empresaId = await this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.COMUNICACAO, ProjetoAcao.VISUALIZAR);
    const projeto = await this.prisma.projeto.findFirst({ where: { id: projetoId, empresaId }, include: PROJECT_INCLUDE }) as unknown as ProjetoRecord | null;
    this.authorization.assertVisibleProject(projeto, user, empresaId);
    return { empresaId, projeto, papel: resolveMeuPapel(projeto, user.sub) };
  }

  async assertUpdate(contexto: ProjetoComunicacaoContexto, user: JwtPayload, action: 'incluir' | 'alterar'): Promise<void> {
    await this.authorization.assertOperationalAction(user, contexto.projeto, contexto.empresaId, contexto.papel,
      ProjetoFuncionalidade.COMUNICACAO, action, [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO],
      action === ProjetoAcao.INCLUIR ? 'publicar atualizacoes' : 'editar atualizacoes');
  }

  async assertComment(contexto: ProjetoComunicacaoContexto, user: JwtPayload): Promise<void> {
    await this.authorization.assertOperationalAction(user, contexto.projeto, contexto.empresaId, contexto.papel,
      ProjetoFuncionalidade.COMUNICACAO, ProjetoAcao.COMENTAR, [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO], 'comentar no projeto');
  }

  async assertModerate(contexto: ProjetoComunicacaoContexto, user: JwtPayload): Promise<void> {
    await this.authorization.assertOperationalAction(user, contexto.projeto, contexto.empresaId, contexto.papel,
      ProjetoFuncionalidade.COMUNICACAO, ProjetoAcao.MODERAR, [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO], 'moderar comentarios');
  }

  async assertManageAttachments(contexto: ProjetoComunicacaoContexto, user: JwtPayload): Promise<void> {
    await this.authorization.assertOperationalAction(user, contexto.projeto, contexto.empresaId, contexto.papel,
      ProjetoFuncionalidade.COMUNICACAO, ProjetoAcao.GERENCIAR_ANEXOS, [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO], 'gerenciar anexos');
  }

  async effectivePermissions(contexto: ProjetoComunicacaoContexto, user: JwtPayload): Promise<ProjetoComunicacaoPermissoes> {
    const writableRole = contexto.papel === ProjetoPapel.RESPONSAVEL || contexto.papel === ProjetoPapel.MEMBRO;
    const writable = !contexto.projeto.arquivadoEm && (this.authorization.isSystemAdmin(user) || writableRole);
    if (this.authorization.isSystemAdmin(user)) return {
      podePublicarAtualizacao: writable, podeEditarAtualizacao: writable, podeComentar: writable, podeModerar: writable, podeGerenciarAnexos: writable
    };
    const [incluir, alterar, comentar, moderar, anexos] = await Promise.all([
      this.can(user, ProjetoAcao.INCLUIR), this.can(user, ProjetoAcao.ALTERAR), this.can(user, ProjetoAcao.COMENTAR),
      this.can(user, ProjetoAcao.MODERAR), this.can(user, ProjetoAcao.GERENCIAR_ANEXOS)
    ]);
    return { podePublicarAtualizacao: writable && incluir, podeEditarAtualizacao: writable && alterar,
      podeComentar: writable && comentar, podeModerar: writable && moderar, podeGerenciarAnexos: writable && anexos };
  }

  isSystemAdmin(user: JwtPayload): boolean { return this.authorization.isSystemAdmin(user); }

  private async can(user: JwtPayload, action: string): Promise<boolean> {
    try { await this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.COMUNICACAO, action); return true; }
    catch (error) { if (error instanceof ForbiddenException) return false; throw error; }
  }
}