import { apolloClient } from "../../src/lib/apolloClient";
import {
    ARQUIVAR_PROJETO_ENTREGA_MUTATION,
    ARQUIVAR_PROJETO_MARCO_MUTATION,
    CREATE_PROJETO_ENTREGA_MUTATION,
    CREATE_PROJETO_MARCO_MUTATION,
    PROJETO_MARCOS_ENTREGAS_QUERY,
    REATIVAR_PROJETO_ENTREGA_MUTATION,
    REATIVAR_PROJETO_MARCO_MUTATION,
    UPDATE_PROJETO_ENTREGA_MUTATION,
    UPDATE_PROJETO_MARCO_MUTATION
} from "../graphql/operations";
import { toServiceError } from "../graphql/serviceError";

const query = async (document, variables, pick) => {
    try {
        const { data } = await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
        return pick(data);
    } catch (error) {
        throw toServiceError(error);
    }
};
const mutate = async (document, input, pick) => {
    try {
        const { data } = await apolloClient.mutate({ mutation: document, variables: { input } });
        return pick(data);
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getMarcoEntregaPainel = (projetoId, incluirArquivados = false) => query(PROJETO_MARCOS_ENTREGAS_QUERY, { projetoId, incluirArquivados }, (data) => data.projetoMarcosEntregas);
export const createMarco = (input) => mutate(CREATE_PROJETO_MARCO_MUTATION, input, (data) => data.createProjetoMarco);
export const updateMarco = (input) => mutate(UPDATE_PROJETO_MARCO_MUTATION, input, (data) => data.updateProjetoMarco);
export const createEntrega = (input) => mutate(CREATE_PROJETO_ENTREGA_MUTATION, input, (data) => data.createProjetoEntrega);
export const updateEntrega = (input) => mutate(UPDATE_PROJETO_ENTREGA_MUTATION, input, (data) => data.updateProjetoEntrega);
export const archiveMarco = (input, reactivate = false) => mutate(reactivate ? REATIVAR_PROJETO_MARCO_MUTATION : ARQUIVAR_PROJETO_MARCO_MUTATION, input, (data) => reactivate ? data.reativarProjetoMarco : data.arquivarProjetoMarco);
export const archiveEntrega = (input, reactivate = false) => mutate(reactivate ? REATIVAR_PROJETO_ENTREGA_MUTATION : ARQUIVAR_PROJETO_ENTREGA_MUTATION, input, (data) => reactivate ? data.reativarProjetoEntrega : data.arquivarProjetoEntrega);
