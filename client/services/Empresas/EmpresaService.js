import { apolloClient } from "../../src/lib/apolloClient";
import {
    CREATE_EMPRESA_MUTATION,
    DELETE_EMPRESA_MUTATION,
    EMPRESAS_QUERY,
    UPDATE_EMPRESA_MUTATION
} from "../graphql/operations";

const extractErrorMessage = (error) => {
    const gqlError = error?.graphQLErrors?.[0]?.message;

    if (gqlError) {
        return gqlError;
    }

    return error?.message || "Erro inesperado ao comunicar com o servidor.";
};

export const getEmpresas = async () => {
    try {
        const response = await apolloClient.query({
            query: EMPRESAS_QUERY,
            fetchPolicy: "network-only"
        });

        return response?.data?.empresas ?? [];
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const createEmpresa = async ({
    nome,
    acessoEcommerce,
    acessoProjetos,
    acessoHoras
}) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CREATE_EMPRESA_MUTATION,
            variables: {
                input: {
                    nome,
                    acessoEcommerce,
                    acessoProjetos,
                    acessoHoras
                }
            }
        });

        return response?.data?.createEmpresa;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const updateEmpresa = async ({ id, nome, acessoEcommerce, acessoProjetos, acessoHoras }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: UPDATE_EMPRESA_MUTATION,
            variables: {
                input: {
                    id: Number(id),
                    nome,
                    acessoEcommerce,
                    acessoProjetos,
                    acessoHoras
                }
            }
        });

        return response?.data?.updateEmpresa;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const deleteEmpresa = async (id) => {
    try {
        const response = await apolloClient.mutate({
            mutation: DELETE_EMPRESA_MUTATION,
            variables: { id: Number(id) }
        });

        return response?.data?.deleteEmpresa;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};
