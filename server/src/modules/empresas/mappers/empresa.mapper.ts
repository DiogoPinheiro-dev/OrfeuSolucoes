import { EmpresaType } from '../dto/empresa.type';
import { EmpresaAccess, EmpresaRecord, EmpresaSolutionSummary } from '../types/empresa-record.types';

export function toEmpresaType(
  empresa: EmpresaRecord,
  access: EmpresaAccess,
  solucoes: EmpresaSolutionSummary[]
): EmpresaType {
  return {
    id: empresa.id,
    nome: empresa.nome ?? null,
    acessoEcommerce: empresa.acessoEcommerce ?? false,
    acessoProjetos: empresa.acessoProjetos ?? false,
    acessoHoras: empresa.acessoHoras ?? false,
    padraoSistema: empresa.padraoSistema ?? false,
    solucaoIds: access.solucaoIds,
    solucaoSlugs: solucoes.map((solucao) => solucao.slug),
    solucaoNomes: solucoes.map((solucao) => solucao.nome),
    funcionalidadeIds: access.funcionalidadeIds
  };
}
