// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apolloClient } from "../../lib/apolloClient";
import {
    changePassword,
    getCurrentUser,
    getEmpresas,
    getLoginCompanies,
    login,
    logout,
    register,
    switchCompany
} from "../../../services/Auth/AuthService";
import { REGISTER_USER_MUTATION } from "../../../services/graphql/operations";
import { ServiceError } from "../../../services/graphql/serviceError";

vi.mock("../../lib/apolloClient", () => ({
    apolloClient: { query: vi.fn(), mutate: vi.fn(), clearStore: vi.fn() }
}));

describe("AuthService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apolloClient.clearStore.mockResolvedValue(undefined);
    });

    it("normaliza login e consome a sessão criada no cookie", async () => {
        const payload = { user: { id: 1 } };
        apolloClient.mutate.mockResolvedValue({ data: { login: payload } });

        await expect(login({ loginOrEmail: " admin ", password: "senha", empresaId: "2" })).resolves.toEqual(payload.user);
        expect(apolloClient.mutate).toHaveBeenCalledWith(expect.objectContaining({
            variables: { input: { loginOrEmail: "admin", senha: "senha", empresaId: 2 } }
        }));
    });

    it("lista empresas e restaura o usuário sempre sem cache", async () => {
        apolloClient.mutate.mockResolvedValue({ data: { loginCompanies: [{ id: 1 }] } });
        await expect(getLoginCompanies({ loginOrEmail: " admin ", password: "senha" })).resolves.toEqual([{ id: 1 }]);
        apolloClient.query.mockResolvedValue({ data: { me: { id: 1 } } });
        await expect(getCurrentUser()).resolves.toEqual({ id: 1 });
        expect(apolloClient.query).toHaveBeenCalledWith(expect.objectContaining({ fetchPolicy: "network-only" }));
    });

    it("lista empresas administrativas e usa o contrato público restrito no autocadastro", async () => {
        apolloClient.query.mockResolvedValue({ data: { empresas: [{ id: 1 }] } });
        await expect(getEmpresas()).resolves.toEqual([{ id: 1 }]);
        apolloClient.mutate.mockResolvedValue({ data: { registerUser: { id: 7 } } });
        await expect(register({ nome: "Ana", login: "ana", email: "ana@example.com", password: "senha" })).resolves.toEqual({ id: 7 });
        expect(apolloClient.mutate).toHaveBeenCalledWith({
            mutation: REGISTER_USER_MUTATION,
            variables: { input: { nome: "Ana", login: "ana", email: "ana@example.com", senha: "senha" } }
        });
    });

    it("consome o usuário atualizado em senha e troca de empresa e limpa o cache anterior", async () => {
        apolloClient.mutate
            .mockResolvedValueOnce({ data: { changePassword: { user: { id: 1 } } } })
            .mockResolvedValueOnce({ data: { switchCompany: { user: { empresa: { id: 2 } } } } });

        await expect(changePassword({ novaSenha: "nova" })).resolves.toEqual({ id: 1 });
        await expect(switchCompany({ empresaId: "2" })).resolves.toEqual({ empresa: { id: 2 } });
        expect(apolloClient.clearStore).toHaveBeenCalledOnce();
    });

    it("envia a senha atual quando a troca não é de primeiro acesso", async () => {
        apolloClient.mutate.mockResolvedValue({
            data: { changePassword: { user: { id: 1, deveAlterarSenha: false } } }
        });

        await changePassword({ novaSenha: "NovaSenha@1", senhaAtual: "SenhaAtual@1" });

        expect(apolloClient.mutate).toHaveBeenCalledWith(expect.objectContaining({
            variables: {
                input: {
                    novaSenha: "NovaSenha@1",
                    senhaAtual: "SenhaAtual@1"
                }
            }
        }));
    });

    it("limpa o cache mesmo quando a mutation de logout falha", async () => {
        apolloClient.mutate.mockRejectedValue(new Error("Servidor indisponível"));
        await expect(logout()).rejects.toThrow("Servidor indisponível");
        expect(apolloClient.clearStore).toHaveBeenCalledOnce();
    });

    it("converte falhas e payloads sem usuário em ServiceError", async () => {
        apolloClient.mutate.mockResolvedValue({ data: { login: {} } });
        await expect(login({ loginOrEmail: "admin", password: "senha" })).rejects.toBeInstanceOf(ServiceError);
        apolloClient.query.mockRejectedValue(new Error("Network error"));
        await expect(getCurrentUser()).rejects.toBeInstanceOf(ServiceError);
    });

    it.each([
        ["login", () => login({ loginOrEmail: "admin", password: "incorreta" })],
        ["listagem de empresas", () => getLoginCompanies({ loginOrEmail: "admin", password: "incorreta" })]
    ])("informa credenciais incorretas no %s sem confundir com sessão expirada", async (_name, invoke) => {
        apolloClient.mutate.mockRejectedValue({
            graphQLErrors: [{
                message: "Unauthorized Exception",
                extensions: { code: "UNAUTHENTICATED", originalError: { statusCode: 401 } }
            }]
        });

        await expect(invoke()).rejects.toMatchObject({
            type: "credentials",
            message: "Usuário ou senha incorretos."
        });
    });

    it.each([
        ["loginCompanies", () => getLoginCompanies({ loginOrEmail: "admin", password: "senha" })],
        ["empresas", () => getEmpresas()],
        ["register", () => register({ nome: "Ana", login: "ana", email: "ana@example.com", password: "senha" })],
        ["changePassword", () => changePassword({ novaSenha: "nova" })],
        ["switchCompany", () => switchCompany({ empresaId: 2 })]
    ])("normaliza falha de %s", async (_name, invoke) => {
        const failure = new Error("Network error: failed to fetch");
        apolloClient.query.mockRejectedValue(failure);
        apolloClient.mutate.mockRejectedValue(failure);
        await expect(invoke()).rejects.toBeInstanceOf(ServiceError);
    });
});
