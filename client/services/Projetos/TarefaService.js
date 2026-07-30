import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";
import { EXCLUIR_PROJETO_TAREFA_MUTATION, PROJETO_TAREFAS_QUERY, SALVAR_PROJETO_TAREFA_MUTATION } from "../graphql/operations";

const execute = async (document, variables = {}, mutation = false) => {
  try {
    const response = mutation
      ? await apolloClient.mutate({ mutation: document, variables })
      : await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
    return response.data;
  } catch (error) { throw toServiceError(error); }
};

export const getTarefas = () => execute(PROJETO_TAREFAS_QUERY).then((data) => data.projetoTarefas);
export const salvarTarefa = (input) => execute(SALVAR_PROJETO_TAREFA_MUTATION, { input }, true);
export const excluirTarefa = (input) => execute(EXCLUIR_PROJETO_TAREFA_MUTATION, { input }, true);
