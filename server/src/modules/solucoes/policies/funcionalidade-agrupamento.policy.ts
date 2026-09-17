export type AssociacaoAgrupamento = {
  agrupamentoId: number | null;
  ordemNoAgrupamento: number | null;
};

export type AlteracaoAssociacaoAgrupamento = {
  agrupamentoId?: number | null;
  ordemNoAgrupamento?: number | null;
};

type AgrupamentoNavegavel = { id: number; ativo: boolean };
type FuncionalidadeAgrupavel = { agrupamentoId?: number | null; ordemNoAgrupamento?: number | null };

export function alteraAssociacaoAgrupamento(alteracao: AlteracaoAssociacaoAgrupamento): boolean {
  return alteracao.agrupamentoId !== undefined || alteracao.ordemNoAgrupamento !== undefined;
}

export function resolverAssociacaoAgrupamento(
  atual: AssociacaoAgrupamento,
  alteracao: AlteracaoAssociacaoAgrupamento
): AssociacaoAgrupamento {
  const agrupamentoId = alteracao.agrupamentoId !== undefined ? alteracao.agrupamentoId ?? null : atual.agrupamentoId;
  if (agrupamentoId === null) {
    return { agrupamentoId: null, ordemNoAgrupamento: null };
  }

  const ordemNoAgrupamento = alteracao.ordemNoAgrupamento !== undefined
    ? alteracao.ordemNoAgrupamento ?? null
    : atual.ordemNoAgrupamento;
  return { agrupamentoId, ordemNoAgrupamento };
}

export function mesmaAssociacaoAgrupamento(left: AssociacaoAgrupamento, right: AssociacaoAgrupamento): boolean {
  return left.agrupamentoId === right.agrupamentoId && left.ordemNoAgrupamento === right.ordemNoAgrupamento;
}

/**
 * Mantém apenas agrupamentos ativos com ao menos uma funcionalidade já visível ao usuário.
 * O agrupamento é somente navegação: nunca acrescenta funcionalidades à lista recebida.
 */
export function restringirAgrupamentosVisiveis<A extends AgrupamentoNavegavel, F extends FuncionalidadeAgrupavel>(
  agrupamentos: A[],
  funcionalidades: F[]
): { agrupamentos: A[]; funcionalidades: F[] } {
  const referenciados = new Set(
    funcionalidades.map((funcionalidade) => funcionalidade.agrupamentoId).filter((id): id is number => typeof id === 'number')
  );
  const visiveis = agrupamentos.filter((agrupamento) => agrupamento.ativo && referenciados.has(agrupamento.id));
  const idsVisiveis = new Set(visiveis.map((agrupamento) => agrupamento.id));

  return {
    agrupamentos: visiveis,
    funcionalidades: funcionalidades.map((funcionalidade) =>
      typeof funcionalidade.agrupamentoId === 'number' && !idsVisiveis.has(funcionalidade.agrupamentoId)
        ? { ...funcionalidade, agrupamentoId: null, ordemNoAgrupamento: null }
        : funcionalidade
    )
  };
}
