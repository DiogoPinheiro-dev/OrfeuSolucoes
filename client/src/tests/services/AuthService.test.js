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
import { clearSession, setSession } from "../../../services/Auth/session";
import { ServiceError } from "../../../services/graphql/serviceError";

vi.mock("../../lib/apolloClient", () => ({
    apolloClient: { query: vi.fn(), mutate: vi.fn(), clearStore: vi.fn() }
}));
vi.mock("../../../services/Auth/session", () => ({ clearSession: vi.fn(), setSession: vi.fn() }));

describe("AuthService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apolloClient.clearStore.mockResolvedValue(undefined);
    });

    it("normaliza login, persiste a sessão e seleciona empresa", async () => {
        const payload = { accessToken: "token", user: { id: 1 } };
        apolloClient.mutate.mockResolvedValue({ data: { login: payload } });

        await expect(login({ loginOrEmail: " admin ", password: "senha", empresaId: "2" })).resolves.toEqual(payload.user);
        expect(apolloClient.mutate).toHaveBeenCalledWith(expect.objectContaining({
            variables: { input: { loginOrEmail: "admin", senha: "senha", empresaId: 2 } }
        }));
        expect(setSession).toHaveBeenCalledWith("token", payload.user);
    });

    it("lista empresas e restaura o usuário sempre sem cache", async () => {
        apolloClient.mutate.mockResolvedValue({ data: { loginCompanies: [{ id: 1 }] } });
        await expect(getLoginCompanies({ loginOrEmail: " admin ", password: "senha" })).resolves.toEqual([{ id: 1 }]);
        apolloClient.query.mockResolvedValue({ data: { me: { id: 1 } } });
        await expect(getCurrentUser()).resolves.toEqual({ id: 1 });
        expect(apolloClient.query).toHaveBeenCalledWith(expect.objectContaining({ fetchPolicy: "network-only" }));
    });

    it("lista empresas administrativas e cadastra usuário com o contrato esperado", async () => {
        apolloClient.query.mockResolvedValue({ data: { empresas: [{ id: 1 }] } });
        await expect(getEmpresas()).resolves.toEqual([{ id: 1 }]);
        apolloClient.mutate.mockResolvedValue({ data: { createUser: { id: 7 } } });
        await expect(register({ nome: "Ana", login: "ana", email: "ana@example.com", password: "senha" })).resolves.toEqual({ id: 7 });
        expect(apolloClient.mutate).toHaveBeenCalledWith(expect.objectContaining({
            variables: { input: { nome: "Ana", login: "ana", email: "ana@example.com", senha: "senha" } }
        }));
    });

    it("renova token em senha e troca de empresa e limpa o cache anterior", async () => {
        apolloClient.mutate
            .mockResolvedValueOnce({ data: { changePassword: { accessToken: "novo", user: { id: 1 } } } })
            .mockResolvedValueOnce({ data: { switchCompany: { accessToken: "empresa", user: { empresa: { id: 2 } } } } });

        await changePassword({ novaSenha: "nova" });
        await switchCompany({ empresaId: "2" });
        expect(setSession).toHaveBeenNthCalledWith(1, "novo", { id: 1 });
        expect(setSession).toHaveBeenNthCalledWith(2, "empresa", { empresa: { id: 2 } });
        expect(apolloClient.clearStore).toHaveBeenCalledOnce();
    });

    it("limpa sessão e cache mesmo quando a mutation de logout falha", async () => {
        apolloClient.mutate.mockRejectedValue(new Error("Servidor indisponível"));
        await expect(logout()).rejects.toThrow("Servidor indisponível");
        expect(clearSession).toHaveBeenCalledOnce();
        expect(apolloClient.clearStore).toHaveBeenCalledOnce();
    });

    it("converte falhas e payloads sem token em ServiceError", async () => {
        apolloClient.mutate.mockResolvedValue({ data: { login: { user: { id: 1 } } } });
        await expect(login({ loginOrEmail: "admin", password: "senha" })).rejects.toBeInstanceOf(ServiceError);
        apolloClient.query.mockRejectedValue(new Error("Network error"));
        await expect(getCurrentUser()).rejects.toBeInstanceOf(ServiceError);
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
