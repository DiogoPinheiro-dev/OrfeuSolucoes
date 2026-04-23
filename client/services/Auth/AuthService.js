import { apolloClient } from "../../src/lib/apolloClient";
import {
    CREATE_USER_MUTATION,
    LOGIN_MUTATION,
    LOGOUT_MUTATION,
    ME_QUERY
} from "../graphql/operations";
import { clearSession, setSession } from "./session";

const extractErrorMessage = (error) => {
    const gqlError = error?.graphQLErrors?.[0]?.message;

    if (gqlError) {
        return gqlError;
    }

    return error?.message || "Erro inesperado ao comunicar com o servidor.";
};

export const login = async ({ email, password }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: LOGIN_MUTATION,
            variables: {
                input: {
                    email,
                    senha: password
                }
            }
        });

        const payload = response?.data?.login;

        if (!payload?.accessToken) {
            throw new Error("Token de autenticacao nao retornado.");
        }

        setSession(payload.accessToken, payload.user);

        return payload.user;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const register = async ({ nome, email, password, tipo }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CREATE_USER_MUTATION,
            variables: {
                input: {
                    nome,
                    email,
                    senha: password,
                    tipo
                }
            }
        });

        return response?.data?.createUser;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const getCurrentUser = async () => {
    try {
        const response = await apolloClient.query({
            query: ME_QUERY,
            fetchPolicy: "network-only"
        });

        return response?.data?.me ?? null;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const logout = async () => {
    try {
        await apolloClient.mutate({
            mutation: LOGOUT_MUTATION
        });
    } finally {
        clearSession();
        await apolloClient.clearStore();
    }
};
