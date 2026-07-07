import { SolucaoType } from '../dto/solucao.type';
import { SolucaoRecord } from '../types/solucao-record.types';
import { toFuncionalidadeType } from './funcionalidade.mapper';

export function toType(solucao: SolucaoRecord): SolucaoType {
  return {
    id: solucao.id,
    slug: solucao.slug,
    nome: solucao.nome,
    descricao: solucao.descricao ?? null,
    eyebrow: solucao.eyebrow ?? null,
    ordem: solucao.ordem,
    ativo: solucao.ativo,
    exibirNoHub: solucao.exibirNoHub,
    somenteAdminSistema: solucao.somenteAdminSistema,
    funcionalidades: (solucao.funcionalidades ?? []).map((funcionalidade) => toFuncionalidadeType(funcionalidade))
  };
}
