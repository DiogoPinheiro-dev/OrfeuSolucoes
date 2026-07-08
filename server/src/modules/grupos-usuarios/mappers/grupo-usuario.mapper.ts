import { GrupoUsuarioType } from '../dto/grupo-usuario.type';
import { GrupoUsuarioRecord } from '../types/grupo-usuario-record.types';

type GrupoUsuarioAccess = {
  solucaoIds: number[];
  funcionalidadeIds: number[];
  funcionalidadePermissoes: Array<{
    funcionalidadeId: number;
    podeVisualizar: boolean;
    podeIncluir: boolean;
    podeAlterar: boolean;
    podeExcluir: boolean;
    acoes: Array<{
      funcionalidadeId: number;
      acaoId: number;
      chave?: string | null;
      permitido?: boolean | null;
    }>;
  }>;
};

export function toGrupoUsuarioType(grupo: GrupoUsuarioRecord, access: GrupoUsuarioAccess): GrupoUsuarioType {
  return {
    id: grupo.id,
    nome: grupo.nome,
    descricao: grupo.descricao ?? null,
    acessoEcommerce: grupo.acessoEcommerce ?? false,
    acessoProjetos: grupo.acessoProjetos ?? false,
    acessoHoras: grupo.acessoHoras ?? false,
    acessoConfigurador: grupo.acessoConfigurador ?? false,
    padraoSistema: grupo.padraoSistema ?? false,
    podeVisualizar: grupo.podeVisualizar ?? true,
    podeIncluir: grupo.podeIncluir ?? false,
    podeAlterar: grupo.podeAlterar ?? false,
    podeExcluir: grupo.podeExcluir ?? false,
    solucaoIds: access.solucaoIds,
    funcionalidadeIds: access.funcionalidadeIds,
    funcionalidadePermissoes: access.funcionalidadePermissoes.map((permissao) => ({
      ...permissao,
      acoes: permissao.acoes.map((acao) => ({
        funcionalidadeId: acao.funcionalidadeId,
        acaoId: acao.acaoId,
        chave: acao.chave ?? '',
        permitido: !!acao.permitido
      }))
    }))
  };
}
