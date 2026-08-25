import { apolloClient } from "../../src/lib/apolloClient";
import {
    CHANGE_PASSWORD_MUTATION,
    EMPRESAS_QUERY,
    LOGIN_COMPANIES_MUTATION,
    LOGIN_MUTATION,
    LOGOUT_MUTATION,
    ME_QUERY,
    REGISTER_USER_MUTATION,
    SWITCH_COMPANY_MUTATION
} from "../graphql/operations";
import { toAuthenticationServiceError, toServiceError } from "../graphql/serviceError";


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

        if (!payload?.user) {
            throw new Error("Usuário autenticado não retornado.");
        }

        return payload.user;
    } catch (error) {
        throw toAuthenticationServiceError(error);
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
        throw toAuthenticationServiceError(error);
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
        throw toServiceError(error);
    }
};

export const register = async ({ nome, login, email, password }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: REGISTER_USER_MUTATION,
            variables: {
                input: {
                    nome,
                    login,
                    email,
                    senha: password
                }
            }
        });

        return response?.data?.registerUser;
    } catch (error) {
        throw toServiceError(error);
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
        throw toServiceError(error);
    }
};

export const changePassword = async ({ novaSenha, senhaAtual }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CHANGE_PASSWORD_MUTATION,
            variables: {
                input: {
                    novaSenha,
                    ...(senhaAtual ? { senhaAtual } : {})
                }
            }
        });
        const payload = response?.data?.changePassword;

        if (!payload?.user) {
            throw new Error("Sessão atualizada não retornada.");
        }

        return payload.user;
    } catch (error) {
        throw toServiceError(error);
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

        if (!payload?.user) {
            throw new Error("Sessão atualizada não retornada.");
        }

        await apolloClient.clearStore();

        return payload.user;
    } catch (error) {
        throw toServiceError(error);
    }
};

export const logout = async () => {
    try {
        await apolloClient.mutate({
            mutation: LOGOUT_MUTATION
        });
    } finally {
        await apolloClient.clearStore();
    }
};
