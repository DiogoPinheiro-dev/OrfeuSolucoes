import { apolloClient } from "../../src/lib/apolloClient";
import {
    ADICIONAR_ITEM_PROJETO_SPRINT_MUTATION,
    CANCELAR_PROJETO_SPRINT_MUTATION,
    CONCLUIR_PROJETO_SPRINT_MUTATION,
    CREATE_PROJETO_SPRINT_MUTATION,
    INICIAR_PROJETO_SPRINT_MUTATION,
    PROJETO_SPRINTS_QUERY,
    REMOVER_ITEM_PROJETO_SPRINT_MUTATION,
    UPDATE_PROJETO_SPRINT_MUTATION
} from "../graphql/operations";
import { toServiceError } from "../graphql/serviceError";

const query = async (document, variables, select) => {
    try {
        const response = await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
        return select(response.data);
    } catch (error) {
        throw toServiceError(error);
    }
};

const mutate = async (document, input, select) => {
    try {
        const response = await apolloClient.mutate({ mutation: document, variables: { input } });
        return select(response.data);
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getSprintPainel = (projetoId) => query(PROJETO_SPRINTS_QUERY, { projetoId }, (data) => data.projetoSprints);
export const createSprint = (input) => mutate(CREATE_PROJETO_SPRINT_MUTATION, input, (data) => data.createProjetoSprint);
export const updateSprint = (input) => mutate(UPDATE_PROJETO_SPRINT_MUTATION, input, (data) => data.updateProjetoSprint);
export const addSprintItem = (input) => mutate(ADICIONAR_ITEM_PROJETO_SPRINT_MUTATION, input, (data) => data.adicionarItemProjetoSprint);
export const removeSprintItem = (input) => mutate(REMOVER_ITEM_PROJETO_SPRINT_MUTATION, input, (data) => data.removerItemProjetoSprint);
export const startSprint = (input) => mutate(INICIAR_PROJETO_SPRINT_MUTATION, input, (data) => data.iniciarProjetoSprint);
export const completeSprint = (input) => mutate(CONCLUIR_PROJETO_SPRINT_MUTATION, input, (data) => data.concluirProjetoSprint);
export const cancelSprint = (input) => mutate(CANCELAR_PROJETO_SPRINT_MUTATION, input, (data) => data.cancelarProjetoSprint);
