import { apolloClient } from "../../src/lib/apolloClient";
import {
    ARQUIVAR_PROJETO_ITEM_DEPENDENCIA_MUTATION,
    CREATE_PROJETO_ITEM_DEPENDENCIA_MUTATION,
    PROJETO_CRONOGRAMA_QUERY,
    REATIVAR_PROJETO_ITEM_DEPENDENCIA_MUTATION,
    UPDATE_PROJETO_CRONOGRAMA_ITEM_DATAS_MUTATION
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

export const getCronograma = (filtro) => query(PROJETO_CRONOGRAMA_QUERY, { filtro }, (data) => data.projetoCronograma);
export const createDependencia = (input) => mutate(CREATE_PROJETO_ITEM_DEPENDENCIA_MUTATION, input, (data) => data.createProjetoItemDependencia);
export const archiveDependencia = (input, reactivate = false) => mutate(
    reactivate ? REATIVAR_PROJETO_ITEM_DEPENDENCIA_MUTATION : ARQUIVAR_PROJETO_ITEM_DEPENDENCIA_MUTATION,
    input,
    (data) => reactivate ? data.reativarProjetoItemDependencia : data.arquivarProjetoItemDependencia
);
export const updateCronogramaItemDatas = (input) => mutate(UPDATE_PROJETO_CRONOGRAMA_ITEM_DATAS_MUTATION, input, (data) => data.updateProjetoCronogramaItemDatas);
