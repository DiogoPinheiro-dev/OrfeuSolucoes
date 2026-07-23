import { ProjetoItemType } from '../dto/projeto-item.type';
import { toProjetoUsuarioType } from './projeto.mapper';
import {
  ProjetoItemPermissoesEfetivas,
  ProjetoItemPrioridade,
  ProjetoItemRecord,
  ProjetoItemStatus,
  ProjetoItemTipo
} from '../types/projeto-item.types';

export function toProjetoItemType(
  item: ProjetoItemRecord,
  permissoes: ProjetoItemPermissoesEfetivas
): ProjetoItemType {
  return {
    id: item.id,
    empresaId: item.empresaId,
    projetoId: item.projetoId,
    numero: item.numero,
    chave: item.chave,
    ordemBacklog: item.ordemBacklog,
    tipo: item.tipo as ProjetoItemTipo,
    titulo: item.titulo,
    descricao: item.descricao ?? null,
    status: item.status as ProjetoItemStatus,
    prioridade: item.prioridade as ProjetoItemPrioridade,
    responsavelId: item.responsavelId ?? null,
    responsavel: item.responsavel ? toProjetoUsuarioType(item.responsavel) : null,
    autorId: item.autorId,
    autor: toProjetoUsuarioType(item.autor),
    paiId: item.paiId ?? null,
    inicioPrevistoEm: item.inicioPrevistoEm ?? null,
    fimPrevistoEm: item.fimPrevistoEm ?? null,
    estimativaMinutos: item.estimativaMinutos ?? null,
    concluidoEm: item.concluidoEm ?? null,
    versao: item.versao,
    arquivadoEm: item.arquivadoEm ?? null,
    arquivadoPor: item.arquivadoPor
      ? toProjetoUsuarioType(item.arquivadoPor)
      : null,
    criadoEm: item.criadoEm,
    atualizadoEm: item.atualizadoEm,
    permissoes: {
      ...permissoes,
      podeAlterar: permissoes.podeAlterar && !item.arquivadoEm,
      podeAlterarStatus: permissoes.podeAlterarStatus && !item.arquivadoEm,
      podeArquivar: permissoes.podeArquivar && !item.arquivadoEm,
      podeReativar: permissoes.podeReativar && !!item.arquivadoEm,
      podePriorizar: permissoes.podePriorizar && !item.arquivadoEm
    }
  };
}
