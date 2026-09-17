import { SolucaoType } from '../dto/solucao.type';
import { SolucaoRecord } from '../types/solucao-record.types';
import { toFuncionalidadeAgrupamentoType } from './funcionalidade-agrupamento.mapper';
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
    padraoSistema: solucao.padraoSistema,
    chaveTecnica: solucao.chaveTecnica ?? solucao.slug,
    statusPublicacao: solucao.statusPublicacao ?? 'PUBLICADA',
    revisaoCatalogo: solucao.revisaoCatalogo ?? 1,
    funcionalidades: (solucao.funcionalidades ?? []).map((funcionalidade) => toFuncionalidadeType(funcionalidade)),
    agrupamentos: (solucao.agrupamentos ?? []).map((agrupamento) => toFuncionalidadeAgrupamentoType(agrupamento))
  };
}
