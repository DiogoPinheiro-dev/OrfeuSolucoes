import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";
import { EXCLUIR_GRADE_ALOCACAO_MUTATION, EXCLUIR_GRADE_CAPACIDADE_MUTATION, GRADE_CAPACITACAO_QUERY, SALVAR_GRADE_ALOCACAO_MUTATION, SALVAR_GRADE_CAPACIDADE_MUTATION, SALVAR_GRADE_VINCULO_MUTATION } from "../graphql/operations";

const execute = async (document, variables = {}, mutation = false) => {
  try {
    const response = mutation
      ? await apolloClient.mutate({ mutation: document, variables })
      : await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
    return response.data;
  } catch (error) { throw toServiceError(error); }
};

export const getGradeCapacitacao = () => execute(GRADE_CAPACITACAO_QUERY).then((data) => data.gradeCapacitacao);
export const salvarGradeVinculo = (input) => execute(SALVAR_GRADE_VINCULO_MUTATION, { input }, true);
export const salvarGradeCapacidade = (input) => execute(SALVAR_GRADE_CAPACIDADE_MUTATION, { input }, true);
export const salvarGradeAlocacao = (input) => execute(SALVAR_GRADE_ALOCACAO_MUTATION, { input }, true);
export const excluirGradeCapacidade = (input) => execute(EXCLUIR_GRADE_CAPACIDADE_MUTATION, { input }, true);
export const excluirGradeAlocacao = (input) => execute(EXCLUIR_GRADE_ALOCACAO_MUTATION, { input }, true);
