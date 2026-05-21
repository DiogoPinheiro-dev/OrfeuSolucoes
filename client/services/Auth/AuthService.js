import { apolloClient } from "../../src/lib/apolloClient";
import {
    CHANGE_PASSWORD_MUTATION,
    CREATE_USER_MUTATION,
    EMPRESAS_QUERY,
    LOGIN_COMPANIES_MUTATION,
    LOGIN_MUTATION,
    LOGOUT_MUTATION,
    ME_QUERY,
    SWITCH_COMPANY_MUTATION
} from "../graphql/operations";
import { clearSession, setSession } from "./session";

const extractErrorMessage = (error) => {
    const gqlError = error?.graphQLErrors?.[0]?.message;

    if (gqlError) {
        return gqlError;
    }

    return error?.message || "Erro inesperado ao comunicar com o servidor.";
};

export const login = async ({ loginOrEmail, email, password, empresaId }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: LOGIN_MUTATION,
            variables: {
                input: {
                    loginOrEmail: (loginOrEmail || email || "").trim(),
                    senha: password,
                    ...(empresaId ? { empresaId: Number(empresaId) } : {})
                }
            }
        });

        const payload = response?.data?.login;

        if (!payload?.accessToken) {
            throw new Error("Token de autenticação não retornado.");
        }

        setSession(payload.accessToken, payload.user);

        return payload.user;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const getLoginCompanies = async ({ loginOrEmail, password }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: LOGIN_COMPANIES_MUTATION,
            variables: {
                input: {
                    loginOrEmail: loginOrEmail.trim(),
                    senha: password
                }
            }
        });

        return response?.data?.loginCompanies ?? [];
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
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

export const register = async ({ nome, login, email, password }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CREATE_USER_MUTATION,
            variables: {
                input: {
                    nome,
                    login,
                    email,
                    senha: password
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

export const changePassword = async ({ novaSenha }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CHANGE_PASSWORD_MUTATION,
            variables: {
                input: { novaSenha }
            }
        });
        const payload = response?.data?.changePassword;

        if (!payload?.accessToken) {
            throw new Error("Sessão atualizada não retornada.");
        }

        setSession(payload.accessToken, payload.user);

        return payload.user;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const switchCompany = async ({ empresaId }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: SWITCH_COMPANY_MUTATION,
            variables: {
                input: {
                    empresaId: Number(empresaId)
                }
            }
        });
        const payload = response?.data?.switchCompany;

        if (!payload?.accessToken) {
            throw new Error("Sessão atualizada não retornada.");
        }

        setSession(payload.accessToken, payload.user);
        await apolloClient.clearStore();

        return payload.user;
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
