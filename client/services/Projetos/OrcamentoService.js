import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";
import { APROVAR_PROJETO_ORCAMENTO_MUTATION, EXCLUIR_PROJETO_CUSTO_MUTATION, EXCLUIR_PROJETO_ORCAMENTO_CATEGORIA_MUTATION, PROJETO_ORCAMENTO_PROJETOS_QUERY, PROJETO_ORCAMENTO_QUERY, REABRIR_PROJETO_ORCAMENTO_MUTATION, SALVAR_PROJETO_CUSTO_MUTATION, SALVAR_PROJETO_ORCAMENTO_CATEGORIA_MUTATION, SALVAR_PROJETO_ORCAMENTO_MUTATION } from "../graphql/operations";

const execute = async (document, variables = {}, mutation = false) => {
  try {
    const response = mutation
      ? await apolloClient.mutate({ mutation: document, variables })
      : await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
    return response.data;
  } catch (error) { throw toServiceError(error); }
};

export const getOrcamentoProjetos = () => execute(PROJETO_ORCAMENTO_PROJETOS_QUERY).then((data) => data.projetoOrcamentoProjetos || []);
export const getOrcamento = (projetoId) => execute(PROJETO_ORCAMENTO_QUERY, { projetoId }).then((data) => data.projetoOrcamento);
export const salvarOrcamento = (input) => execute(SALVAR_PROJETO_ORCAMENTO_MUTATION, { input }, true);
export const salvarCategoriaOrcamento = (input) => execute(SALVAR_PROJETO_ORCAMENTO_CATEGORIA_MUTATION, { input }, true);
export const excluirCategoriaOrcamento = (input) => execute(EXCLUIR_PROJETO_ORCAMENTO_CATEGORIA_MUTATION, { input }, true);
export const salvarCustoProjeto = (input) => execute(SALVAR_PROJETO_CUSTO_MUTATION, { input }, true);
export const excluirCustoProjeto = (input) => execute(EXCLUIR_PROJETO_CUSTO_MUTATION, { input }, true);
export const aprovarOrcamento = (input) => execute(APROVAR_PROJETO_ORCAMENTO_MUTATION, { input }, true);
export const reabrirOrcamento = (input) => execute(REABRIR_PROJETO_ORCAMENTO_MUTATION, { input }, true);
