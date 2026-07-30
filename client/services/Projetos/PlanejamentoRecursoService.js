import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";
import {
  EXCLUIR_GRADE_ALOCACAO_MUTATION,
  EXCLUIR_GRADE_CAPACIDADE_MUTATION,
  EXCLUIR_PROJETO_TAREFA_MUTATION,
  PLANEJAMENTO_RECURSOS_QUERY,
  SALVAR_GRADE_ALOCACAO_MUTATION,
  SALVAR_GRADE_CAPACIDADE_MUTATION,
  SALVAR_GRADE_VINCULO_MUTATION,
  SALVAR_PROJETO_TAREFA_MUTATION
} from "../graphql/operations";

const execute = async (document, variables = {}, mutation = false) => {
  try {
    const response = mutation
      ? await apolloClient.mutate({ mutation: document, variables })
      : await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
    return response.data;
  } catch (error) {
    throw toServiceError(error);
  }
};

export const getPlanejamentoRecursos = () =>
  execute(PLANEJAMENTO_RECURSOS_QUERY).then((data) => data.planejamentoRecursos);

export const salvarPlanejamentoVinculo = (input) =>
  execute(SALVAR_GRADE_VINCULO_MUTATION, { input }, true);

export const salvarPlanejamentoCapacidade = (input) =>
  execute(SALVAR_GRADE_CAPACIDADE_MUTATION, { input }, true);

export const salvarPlanejamentoExecucao = (input) =>
  execute(SALVAR_GRADE_ALOCACAO_MUTATION, { input }, true);

export const excluirPlanejamentoCapacidade = (input) =>
  execute(EXCLUIR_GRADE_CAPACIDADE_MUTATION, { input }, true);

export const excluirPlanejamentoExecucao = (input) =>
  execute(EXCLUIR_GRADE_ALOCACAO_MUTATION, { input }, true);

export const salvarPlanejamentoTarefa = (input) =>
  execute(SALVAR_PROJETO_TAREFA_MUTATION, { input }, true);

export const excluirPlanejamentoTarefa = (input) =>
  execute(EXCLUIR_PROJETO_TAREFA_MUTATION, { input }, true);
