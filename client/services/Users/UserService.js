import { apolloClient } from "../../src/lib/apolloClient";
import {
    CREATE_USER_MUTATION,
    DELETE_USER_MUTATION,
    UPDATE_USER_MUTATION,
    USERS_QUERY
} from "../graphql/operations";

const extractErrorMessage = (error) => {
    const gqlError = error?.graphQLErrors?.[0]?.message;

    if (gqlError) {
        return gqlError;
    }

    return error?.message || "Erro inesperado ao comunicar com o servidor.";
};

export const getUsers = async () => {
    try {
        const response = await apolloClient.query({
            query: USERS_QUERY,
            fetchPolicy: "network-only"
        });

        return response?.data?.users ?? [];
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const createUser = async ({ nome, email, senha, tipo, empresaId }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CREATE_USER_MUTATION,
            variables: {
                input: {
                    nome,
                    email,
                    senha,
                    tipo,
                    ...(empresaId ? { empresaId: Number(empresaId) } : {})
                }
            }
        });

        return response?.data?.createUser;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const updateUser = async ({ id, nome, email, senha, tipo, empresaId }) => {
    try {
        const input = {
            id,
            nome,
            email,
            tipo,
            empresaId: empresaId ? Number(empresaId) : null
        };

        if (senha) {
            input.senha = senha;
        }

        const response = await apolloClient.mutate({
            mutation: UPDATE_USER_MUTATION,
            variables: { input }
        });

        return response?.data?.updateUser;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const deleteUser = async (id) => {
    try {
        const response = await apolloClient.mutate({
            mutation: DELETE_USER_MUTATION,
            variables: { id }
        });

        return response?.data?.deleteUser;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};
