// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    changePassword as changePasswordRequest,
    getCurrentUser,
    login as loginRequest,
    logout as logoutRequest,
    switchCompany as switchCompanyRequest
} from "../../../services/Auth/AuthService";
import { clearLegacySessionStorage } from "../../../services/Auth/legacySession";
import { AuthProvider } from "../../context/AuthContext";
import { useAuth } from "../../hooks/useAuth";

vi.mock("../../../services/Auth/AuthService", () => ({
    changePassword: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    switchCompany: vi.fn()
}));

vi.mock("../../../services/Auth/legacySession", () => ({ clearLegacySessionStorage: vi.fn() }));

let auth;
function AuthProbe() {
    auth = useAuth();
    return <div>{auth.bootstrapping ? "iniciando" : auth.user?.nome || "anônimo"}</div>;
}

afterEach(cleanup);

describe("AuthProvider", () => {
    beforeEach(() => {
        auth = undefined;
        vi.clearAllMocks();
        getCurrentUser.mockResolvedValue(null);
    });

    it("sempre valida a sessão no servidor, mesmo sem estado local", async () => {
        render(<AuthProvider><AuthProbe /></AuthProvider>);

        await screen.findByText("anônimo");
        expect(getCurrentUser).toHaveBeenCalled();
        expect(clearLegacySessionStorage).toHaveBeenCalled();
        expect(auth.isAuthenticated).toBe(false);
    });

    it("restaura a sessão válida exclusivamente a partir do servidor", async () => {
        getCurrentUser.mockResolvedValue({ id: 1, nome: "Administrador", grupo: { nome: "Administradores" } });

        render(<AuthProvider><AuthProbe /></AuthProvider>);

        await screen.findByText("Administrador");
        expect(auth.isAuthenticated).toBe(true);
        expect(auth.role).toBe("Administradores");
    });

    it("rejeita a sessão inválida e sempre encerra o bootstrap", async () => {
        getCurrentUser.mockRejectedValue(new Error("Expirada"));

        render(<AuthProvider><AuthProbe /></AuthProvider>);

        await screen.findByText("anônimo");
        expect(auth.bootstrapping).toBe(false);
    });

    it("atualiza o usuário em login, senha, refresh e logout", async () => {
        loginRequest.mockResolvedValue({ id: 2, nome: "Login" });
        changePasswordRequest.mockResolvedValue({ id: 2, nome: "Senha alterada" });
        logoutRequest.mockResolvedValue(undefined);
        render(<AuthProvider><AuthProbe /></AuthProvider>);
        await screen.findByText("anônimo");

        await act(() => auth.signIn({ loginOrEmail: "ana", password: "x" }));
        expect(screen.getByText("Login")).toBeInTheDocument();
        await act(() => auth.changePassword("nova"));
        expect(screen.getByText("Senha alterada")).toBeInTheDocument();
        getCurrentUser.mockResolvedValue({ id: 2, nome: "Atualizado" });
        await act(() => auth.refreshUser());
        expect(screen.getByText("Atualizado")).toBeInTheDocument();
        await act(() => auth.signOut());
        expect(screen.getByText("anônimo")).toBeInTheDocument();
    });

    it("restaura switchingCompany mesmo quando a troca falha", async () => {
        switchCompanyRequest.mockRejectedValue(new Error("Empresa negada"));
        render(<AuthProvider><AuthProbe /></AuthProvider>);
        await screen.findByText("anônimo");

        let request;
        act(() => { request = auth.switchCompany(9); });
        expect(auth.switchingCompany).toBe(true);
        await expect(request).rejects.toThrow("Empresa negada");
        await waitFor(() => expect(auth.switchingCompany).toBe(false));
        expect(switchCompanyRequest).toHaveBeenCalledWith({ empresaId: 9 });
    });

    it("remove o estado autenticado mesmo quando o logout remoto falha", async () => {
        getCurrentUser.mockResolvedValue({ id: 2, nome: "Usuária autenticada" });
        logoutRequest.mockRejectedValue(new Error("Servidor indisponível"));
        render(<AuthProvider><AuthProbe /></AuthProvider>);
        await screen.findByText("Usuária autenticada");

        await act(async () => {
            await expect(auth.signOut()).rejects.toThrow("Servidor indisponível");
        });

        await waitFor(() => expect(screen.getByText("anônimo")).toBeInTheDocument());
        expect(auth.isAuthenticated).toBe(false);
    });
});
