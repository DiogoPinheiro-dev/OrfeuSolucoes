import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";
import {
    CREATE_USER_MUTATION,
    DELETE_USER_MUTATION,
    UPDATE_USER_MUTATION,
    USERS_QUERY
} from "../graphql/operations";


export const getUsers = async () => {
    try {
        const response = await apolloClient.query({
            query: USERS_QUERY,
            fetchPolicy: "network-only"
        });

        return response?.data?.users ?? [];
    } catch (error) {
        throw toServiceError(error);
    }
};

export const createUser = async ({ nome, login, email, senha, empresaIds, grupoId }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CREATE_USER_MUTATION,
            variables: {
                input: {
                    nome,
                    login,
                    email,
                    senha,
                    grupoId: grupoId ? Number(grupoId) : null,
                    empresaIds: Array.isArray(empresaIds) ? empresaIds.map(Number) : []
                }
            }
        });

        return response?.data?.createUser;
    } catch (error) {
        throw toServiceError(error);
    }
};

export const updateUser = async ({ id, nome, login, email, senha, empresaIds, grupoId }) => {
    try {
        const input = {
            id,
            nome,
            login,
            email,
            grupoId: grupoId ? Number(grupoId) : null,
            empresaIds: Array.isArray(empresaIds) ? empresaIds.map(Number) : []
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
        throw toServiceError(error);
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
        throw toServiceError(error);
    }
};
