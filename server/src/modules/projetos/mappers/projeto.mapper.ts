import { ProjetoMembroType, ProjetoType, ProjetoUsuarioType } from '../dto/projeto.type';
import {
  ProjetoMetodologia,
  ProjetoPapel,
  ProjetoPermissoesEfetivas,
  ProjetoRecord,
  ProjetoSaude,
  ProjetoSituacao,
  ProjetoUsuarioRecord
} from '../types/projeto.types';

export function toProjetoUsuarioType(usuario: ProjetoUsuarioRecord): ProjetoUsuarioType {
  return {
    id: usuario.id,
    nome: usuario.nome ?? null,
    login: usuario.login ?? null,
    email: usuario.email,
    grupoId: usuario.grupo?.id ?? null,
    grupoNome: usuario.grupo?.nome ?? null
  };
}

export function resolveMeuPapel(projeto: ProjetoRecord, usuarioId: string): ProjetoPapel | null {
  if (projeto.responsavelId === usuarioId) {
    return ProjetoPapel.RESPONSAVEL;
  }

  const membro = projeto.membros.find((item) => item.usuarioId === usuarioId);
  return membro ? membro.papel as ProjetoPapel : null;
}

export function toProjetoType(
  projeto: ProjetoRecord,
  meuPapel: ProjetoPapel | null,
  permissoes: ProjetoPermissoesEfetivas
): ProjetoType {
  return {
    id: projeto.id,
    empresaId: projeto.empresaId,
    chave: projeto.chave,
    nome: projeto.nome,
    objetivo: projeto.objetivo ?? null,
    descricao: projeto.descricao ?? null,
    metodologia: projeto.metodologia as ProjetoMetodologia,
    situacao: projeto.situacao as ProjetoSituacao,
    saude: projeto.saude as ProjetoSaude,
    inicioPrevistoEm: projeto.inicioPrevistoEm ?? null,
    fimPrevistoEm: projeto.fimPrevistoEm ?? null,
    inicioRealEm: projeto.inicioRealEm ?? null,
    fimRealEm: projeto.fimRealEm ?? null,
    responsavelId: projeto.responsavelId,
    responsavel: toProjetoUsuarioType(projeto.responsavel),
    criadoPor: toProjetoUsuarioType(projeto.criadoPor),
    arquivadoEm: projeto.arquivadoEm ?? null,
    arquivadoPor: projeto.arquivadoPor ? toProjetoUsuarioType(projeto.arquivadoPor) : null,
    criadoEm: projeto.criadoEm,
    atualizadoEm: projeto.atualizadoEm,
    membros: projeto.membros.map((membro): ProjetoMembroType => ({
      id: membro.id,
      usuarioId: membro.usuarioId,
      papel: membro.papel as ProjetoPapel,
      incluidoEm: membro.incluidoEm,
      usuario: toProjetoUsuarioType(membro.usuario)
    })),
    meuPapel,
    permissoes
  };
}
