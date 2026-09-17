import { FuncionalidadeAgrupamentoType } from '../dto/funcionalidade-agrupamento.type';
import { FuncionalidadeAgrupamentoRecord } from '../types/solucao-record.types';

export function toFuncionalidadeAgrupamentoType(agrupamento: FuncionalidadeAgrupamentoRecord): FuncionalidadeAgrupamentoType {
  return {
    id: agrupamento.id,
    solucaoId: agrupamento.solucaoId,
    slug: agrupamento.slug,
    titulo: agrupamento.titulo,
    label: agrupamento.label ?? null,
    descricao: agrupamento.descricao ?? null,
    ordem: agrupamento.ordem,
    ativo: agrupamento.ativo,
    padraoSistema: agrupamento.padraoSistema,
    chaveTecnica: agrupamento.chaveTecnica ?? `${agrupamento.solucaoId}.${agrupamento.slug}`
  };
}
