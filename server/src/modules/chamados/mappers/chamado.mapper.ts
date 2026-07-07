import { AtendenteChamadoType } from '../dto/atendente-chamado.type';
import { ChamadoAcompanhanteType } from '../dto/chamado-acompanhante.type';
import { ChamadoAnexoType } from '../dto/chamado-anexo.type';
import { ChamadoCategoriaType } from '../dto/chamado-categoria.type';
import { ChamadoPrioridadeType } from '../dto/chamado-prioridade.type';
import { ChamadoResponsavelType } from '../dto/chamado-responsavel.type';
import { ChamadoTipoType } from '../dto/chamado-tipo.type';
import { ChamadoHistoricoType, ChamadoMensagemType, ChamadoType } from '../dto/chamado.type';
import {
  ChamadoAcompanhanteRecord,
  ChamadoAnexoRecord,
  ChamadoCategoriaRecord,
  ChamadoConfiguracaoRecord,
  ChamadoHistoricoRecord,
  ChamadoMensagemRecord,
  ChamadoRecord,
  ChamadoResponsavelRecord,
  ResponsavelSolucaoPayload,
  UsuarioResumoRecord
} from '../types/chamado-record.types';

export function usuarioLabel(usuario?: UsuarioResumoRecord | null): string | null {
  if (!usuario) {
    return null;
  }

  return usuario.nome || usuario.login || usuario.email;
}

export function responsavelLabel(responsavel?: ChamadoResponsavelRecord | null): string | null {
  if (!responsavel) {
    return null;
  }

  if (responsavel.tipo === 'GRUPO') {
    return responsavel.grupo?.nome ?? null;
  }

  return usuarioLabel(responsavel.usuario);
}

export function chamadoResponsavelLabel(chamado: ChamadoRecord): string | null {
  return chamado.responsavelGrupo?.nome || usuarioLabel(chamado.responsavel);
}

export function responsavelRecordToPayload(responsavel: ChamadoResponsavelRecord): ResponsavelSolucaoPayload[] {
  return (responsavel.solucoes ?? [])
    .filter((solucao) => solucao.ativo)
    .map((solucao) => ({
      solucaoId: solucao.solucaoId,
      responsavelGeral: solucao.responsavelGeral,
      funcionalidadeIds: solucao.responsavelGeral
        ? []
        : (solucao.funcionalidades ?? [])
            .filter((funcionalidade) => funcionalidade.ativo)
            .map((funcionalidade) => funcionalidade.funcionalidadeId)
    }));
}

export function responsavelRecordToAtendente(responsavel: ChamadoResponsavelRecord): AtendenteChamadoType | null {
  if (responsavel.tipo === 'GRUPO') {
    if (!responsavel.grupo) {
      return null;
    }

    return {
      id: `GRUPO:${responsavel.grupo.id}`,
      tipo: 'GRUPO',
      usuarioId: null,
      grupoId: responsavel.grupo.id,
      nome: responsavel.grupo.nome,
      login: null,
      email: null
    };
  }

  if (!responsavel.usuario) {
    return null;
  }

  return {
    id: `USUARIO:${responsavel.usuario.id}`,
    tipo: 'USUARIO',
    usuarioId: responsavel.usuario.id,
    grupoId: null,
    nome: responsavel.usuario.nome ?? null,
    login: responsavel.usuario.login ?? null,
    email: responsavel.usuario.email
  };
}

export function toResponsavelType(responsavel: ChamadoResponsavelRecord): ChamadoResponsavelType {
  const activeSolucoes = (responsavel.solucoes ?? []).filter((solucao) => solucao.ativo);
  const solucoes = activeSolucoes.length ? activeSolucoes : (responsavel.solucoes ?? []);

  return {
    id: responsavel.id,
    empresaId: responsavel.empresaId,
    tipo: responsavel.tipo || 'USUARIO',
    usuarioId: responsavel.usuarioId ?? null,
    usuarioNome: responsavel.usuario ? usuarioLabel(responsavel.usuario) : null,
    usuarioEmail: responsavel.usuario?.email ?? null,
    grupoId: responsavel.grupoId ?? null,
    grupoNome: responsavel.grupo?.nome ?? null,
    responsavelNome: responsavelLabel(responsavel),
    ativo: responsavel.ativo,
    solucoes: solucoes.map((solucao) => ({
      id: solucao.id,
      solucaoId: solucao.solucaoId,
      solucaoNome: solucao.solucao?.nome ?? '-',
      responsavelGeral: solucao.responsavelGeral,
      ativo: solucao.ativo,
      funcionalidades: (solucao.funcionalidades ?? [])
        .filter((funcionalidade) => funcionalidade.ativo)
        .map((funcionalidade) => ({
          id: funcionalidade.id,
          funcionalidadeId: funcionalidade.funcionalidadeId,
          funcionalidadeNome: funcionalidade.funcionalidade?.label || funcionalidade.funcionalidade?.titulo || '-',
          ativo: funcionalidade.ativo
        }))
    })),
    criadoEm: responsavel.criadoEm,
    atualizadoEm: responsavel.atualizadoEm
  };
}

export function toChamadoType(chamado: ChamadoRecord): ChamadoType {
  return {
    id: chamado.id,
    numero: chamado.numero,
    empresaId: chamado.empresaId,
    solicitanteId: chamado.solicitanteId,
    solicitanteNome: usuarioLabel(chamado.solicitante),
    responsavelId: chamado.responsavelId ?? null,
    responsavelNome: usuarioLabel(chamado.responsavel),
    responsavelGrupoId: chamado.responsavelGrupoId ?? null,
    responsavelGrupoNome: chamado.responsavelGrupo?.nome ?? null,
    liderAtendimentoId: chamado.liderAtendimentoId ?? null,
    liderAtendimentoNome: usuarioLabel(chamado.liderAtendimento),
    atendimentoAssumidoEm: chamado.atendimentoAssumidoEm ?? null,
    categoriaId: chamado.categoriaId ?? null,
    categoriaNome: chamado.categoria?.nome ?? null,
    solucaoId: chamado.solucaoId ?? null,
    solucaoNome: chamado.solucao?.nome ?? null,
    funcionalidadeId: chamado.funcionalidadeId ?? null,
    funcionalidadeNome: chamado.funcionalidade?.label || chamado.funcionalidade?.titulo || null,
    titulo: chamado.titulo,
    descricao: chamado.descricao,
    tipoId: chamado.tipoId,
    tipoNome: chamado.tipoConfiguracao?.nome ?? '-',
    tipoCor: chamado.tipoConfiguracao?.cor ?? null,
    prioridadeId: chamado.prioridadeId,
    prioridadeNome: chamado.prioridadeConfiguracao?.nome ?? '-',
    prioridadeCor: chamado.prioridadeConfiguracao?.cor ?? null,
    status: chamado.status,
    criadoEm: chamado.criadoEm,
    atualizadoEm: chamado.atualizadoEm,
    primeiraRespostaEm: chamado.primeiraRespostaEm ?? null,
    resolvidoEm: chamado.resolvidoEm ?? null,
    encerradoEm: chamado.encerradoEm ?? null,
    versao: chamado.versao,
    mensagens: (chamado.mensagens ?? []).map((mensagem) => toMensagemType(mensagem)),
    anexos: (chamado.anexos ?? []).map((anexo) => toAnexoType(anexo)),
    acompanhantes: (chamado.acompanhantes ?? []).map((acompanhante) => toAcompanhanteType(acompanhante)),
    historico: (chamado.historico ?? []).map((historico) => toHistoricoType(historico))
  };
}

export function toAcompanhanteType(acompanhante: ChamadoAcompanhanteRecord): ChamadoAcompanhanteType {
  return {
    id: acompanhante.id,
    chamadoId: acompanhante.chamadoId,
    usuarioId: acompanhante.usuarioId,
    usuarioNome: usuarioLabel(acompanhante.usuario),
    usuarioLogin: acompanhante.usuario?.login ?? null,
    usuarioEmail: acompanhante.usuario?.email ?? null,
    adicionadoPorId: acompanhante.adicionadoPorId ?? null,
    adicionadoPorNome: usuarioLabel(acompanhante.adicionadoPor),
    ativo: acompanhante.ativo,
    criadoEm: acompanhante.criadoEm,
    atualizadoEm: acompanhante.atualizadoEm
  };
}

export function toAnexoType(anexo: ChamadoAnexoRecord): ChamadoAnexoType {
  return {
    id: anexo.id,
    chamadoId: anexo.chamadoId,
    mensagemId: anexo.mensagemId ?? null,
    autorId: anexo.autorId,
    autorNome: usuarioLabel(anexo.autor),
    nomeOriginal: anexo.nomeOriginal,
    mimeType: anexo.mimeType,
    tamanho: anexo.tamanho,
    downloadUrl: `/chamados/${anexo.chamadoId}/anexos/${anexo.id}/download`,
    criadoEm: anexo.criadoEm
  };
}

export function toMensagemType(mensagem: ChamadoMensagemRecord): ChamadoMensagemType {
  return {
    id: mensagem.id,
    chamadoId: mensagem.chamadoId,
    autorId: mensagem.autorId,
    autorNome: usuarioLabel(mensagem.autor),
    tipo: mensagem.tipo,
    conteudo: mensagem.conteudo,
    criadoEm: mensagem.criadoEm,
    anexos: (mensagem.anexos ?? []).map((anexo) => toAnexoType(anexo))
  };
}

export function toHistoricoType(historico: ChamadoHistoricoRecord): ChamadoHistoricoType {
  return {
    id: historico.id,
    chamadoId: historico.chamadoId,
    usuarioId: historico.usuarioId ?? null,
    usuarioNome: usuarioLabel(historico.usuario),
    evento: historico.evento,
    campo: historico.campo ?? null,
    valorAnterior: historico.valorAnterior ?? null,
    valorNovo: historico.valorNovo ?? null,
    observacao: historico.observacao ?? null,
    criadoEm: historico.criadoEm
  };
}

export function toCategoriaType(categoria: ChamadoCategoriaRecord): ChamadoCategoriaType {
  return {
    id: categoria.id,
    empresaId: categoria.empresaId,
    nome: categoria.nome,
    descricao: categoria.descricao ?? null,
    ativo: categoria.ativo,
    criadoEm: categoria.criadoEm,
    atualizadoEm: categoria.atualizadoEm
  };
}

export function toTipoType(tipo: ChamadoConfiguracaoRecord): ChamadoTipoType {
  return {
    id: tipo.id,
    empresaId: tipo.empresaId,
    nome: tipo.nome,
    descricao: tipo.descricao ?? null,
    cor: tipo.cor ?? null,
    ordem: tipo.ordem,
    ativo: tipo.ativo,
    criadoEm: tipo.criadoEm,
    atualizadoEm: tipo.atualizadoEm
  };
}

export function toPrioridadeType(prioridade: ChamadoConfiguracaoRecord): ChamadoPrioridadeType {
  return {
    id: prioridade.id,
    empresaId: prioridade.empresaId,
    nome: prioridade.nome,
    descricao: prioridade.descricao ?? null,
    cor: prioridade.cor ?? null,
    ordem: prioridade.ordem,
    ativo: prioridade.ativo,
    criadoEm: prioridade.criadoEm,
    atualizadoEm: prioridade.atualizadoEm
  };
}
