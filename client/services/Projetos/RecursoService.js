import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";
import { EXCLUIR_PROJETO_RECURSO_MUTATION, PROJETO_RECURSOS_PROJETOS_QUERY, PROJETO_RECURSOS_QUERY, SALVAR_PROJETO_RECURSO_MUTATION } from "../graphql/operations";

const execute = async (document, variables = {}, mutation = false) => {
  try {
    const response = mutation
      ? await apolloClient.mutate({ mutation: document, variables })
      : await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
    return response.data;
  } catch (error) { throw toServiceError(error); }
};

export const getRecursos = () => execute(PROJETO_RECURSOS_QUERY).then((data) => data.projetoRecursos);
export const getRecursosProjetos = () => execute(PROJETO_RECURSOS_PROJETOS_QUERY).then((data) => data.projetoRecursosProjetos);
export const salvarRecurso = (input) => execute(SALVAR_PROJETO_RECURSO_MUTATION, { input }, true);
export const excluirRecurso = (input) => execute(EXCLUIR_PROJETO_RECURSO_MUTATION, { input }, true);
