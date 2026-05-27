import { apolloClient } from "../../src/lib/apolloClient";
import { notifyHubNavigationChanged } from "../../src/auth/hubNavigationEvents";
import {
    CREATE_SOLUCAO_MUTATION,
    CREATE_FUNCIONALIDADE_MUTATION,
    DELETE_SOLUCAO_MUTATION,
    DELETE_FUNCIONALIDADE_MUTATION,
    MY_HUB_NAVIGATION_QUERY,
    SOLUCOES_QUERY,
    UPDATE_SOLUCAO_MUTATION,
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

export const createSolucao = async (input) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CREATE_SOLUCAO_MUTATION,
            variables: { input }
        });

        const solucao = response?.data?.createSolucao;

        notifyHubNavigationChanged();

        return solucao;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const updateSolucao = async (input) => {
    try {
        const response = await apolloClient.mutate({
            mutation: UPDATE_SOLUCAO_MUTATION,
            variables: {
                input: {
                    ...input,
                    id: Number(input.id)
                }
            }
        });

        const solucao = response?.data?.updateSolucao;

        notifyHubNavigationChanged();

        return solucao;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const deleteSolucao = async (id) => {
    try {
        const response = await apolloClient.mutate({
            mutation: DELETE_SOLUCAO_MUTATION,
            variables: { id: Number(id) }
        });

        const deleted = response?.data?.deleteSolucao;

        notifyHubNavigationChanged();

        return deleted;
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

        const funcionalidade = response?.data?.createFuncionalidade;

        notifyHubNavigationChanged();

        return funcionalidade;
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

        const funcionalidade = response?.data?.updateFuncionalidade;

        notifyHubNavigationChanged();

        return funcionalidade;
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

        const deleted = response?.data?.deleteFuncionalidade;

        notifyHubNavigationChanged();

        return deleted;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};
