import { apolloClient } from "../../src/lib/apolloClient";
import { MY_HUB_NAVIGATION_QUERY, SOLUCOES_QUERY } from "../graphql/operations";

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
