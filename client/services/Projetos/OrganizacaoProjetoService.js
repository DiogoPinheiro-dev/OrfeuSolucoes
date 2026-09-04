import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";
import {
  EXCLUIR_CAPACITACAO_MUTATION,
  EXCLUIR_EQUIPE_MUTATION,
  PROJETO_ORGANIZACAO_QUERY,
  SALVAR_CAPACITACAO_MUTATION,
  SALVAR_EQUIPE_MUTATION
} from "../graphql/operations";

const execute = async (document, variables = {}, mutation = false) => {
  try {
    const response = mutation
      ? await apolloClient.mutate({ mutation: document, variables })
      : await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
    return response.data;
  } catch (error) { throw toServiceError(error); }
};

export const getProjetoOrganizacao = () => execute(PROJETO_ORGANIZACAO_QUERY).then((data) => data.projetoOrganizacao);
export const salvarCapacitacao = (input) => execute(SALVAR_CAPACITACAO_MUTATION, { input }, true).then((data) => data.salvarCapacitacao);
export const excluirCapacitacao = (input) => execute(EXCLUIR_CAPACITACAO_MUTATION, { input }, true).then((data) => data.excluirCapacitacao);
export const salvarEquipe = (input) => execute(SALVAR_EQUIPE_MUTATION, { input }, true).then((data) => data.salvarEquipe);
export const excluirEquipe = (input) => execute(EXCLUIR_EQUIPE_MUTATION, { input }, true).then((data) => data.excluirEquipe);
