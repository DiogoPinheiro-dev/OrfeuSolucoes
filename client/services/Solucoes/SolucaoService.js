import { apolloClient } from "../../src/lib/apolloClient";
import {
    CREATE_FUNCIONALIDADE_MUTATION,
    DELETE_FUNCIONALIDADE_MUTATION,
    MY_HUB_NAVIGATION_QUERY,
    SOLUCOES_QUERY,
    UPDATE_FUNCIONALIDADE_MUTATION
} from "../graphql/operations";

const extractErrorMessage = (error) => {
    const gqlError = error?.graphQLErrors?.[0]?.message;

    return gqlError || error?.message || "Erro inesperado ao comunicar com o servidor.";
};

export const getMyHubNavigation = async () => {
    try {
        const response = await apolloClient.query({
            query: MY_HUB_NAVIGATION_QUERY,
            fetchPolicy: "network-only"
        });

        return response?.data?.myHubNavigation ?? [];
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const getSolucoes = async () => {
    try {
        const response = await apolloClient.query({
            query: SOLUCOES_QUERY,
            fetchPolicy: "network-only"
        });

        return response?.data?.solucoes ?? [];
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const createFuncionalidade = async (input) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CREATE_FUNCIONALIDADE_MUTATION,
            variables: { input }
        });

        return response?.data?.createFuncionalidade;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const updateFuncionalidade = async (input) => {
    try {
        const response = await apolloClient.mutate({
            mutation: UPDATE_FUNCIONALIDADE_MUTATION,
            variables: {
                input: {
                    ...input,
                    id: Number(input.id)
                }
            }
        });

        return response?.data?.updateFuncionalidade;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const deleteFuncionalidade = async (id) => {
    try {
        const response = await apolloClient.mutate({
            mutation: DELETE_FUNCIONALIDADE_MUTATION,
            variables: { id: Number(id) }
        });

        return response?.data?.deleteFuncionalidade;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};
