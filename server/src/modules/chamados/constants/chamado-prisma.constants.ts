export const usuarioResumoSelect = {
  id: true,
  nome: true,
  login: true,
  email: true
};

export const chamadoSummaryInclude = {
  solicitante: { select: usuarioResumoSelect },
  responsavel: { select: usuarioResumoSelect },
  responsavelGrupo: { select: { id: true, nome: true, descricao: true } },
  liderAtendimento: { select: usuarioResumoSelect },
  categoria: true,
  solucao: { select: { id: true, nome: true, slug: true } },
  funcionalidade: { select: { id: true, titulo: true, label: true, slug: true } },
  tipoConfiguracao: true,
  prioridadeConfiguracao: true,
  acompanhantes: {
    where: { ativo: true },
    include: {
      usuario: { select: usuarioResumoSelect },
      adicionadoPor: { select: usuarioResumoSelect }
    },
    orderBy: { criadoEm: 'asc' as const }
  }
};

export const chamadoDetailInclude = {
  ...chamadoSummaryInclude,
  mensagens: {
    include: {
      autor: { select: usuarioResumoSelect },
      anexos: {
        include: { autor: { select: usuarioResumoSelect } },
        orderBy: { criadoEm: 'asc' as const }
      }
    },
    orderBy: { criadoEm: 'asc' as const }
  },
  anexos: {
    where: { mensagemId: null },
    include: { autor: { select: usuarioResumoSelect } },
    orderBy: { criadoEm: 'asc' as const }
  },
  historico: {
    include: {
      usuario: { select: usuarioResumoSelect }
    },
    orderBy: { criadoEm: 'asc' as const }
  }
};
