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
import { clearSession, getSessionUser, getToken, setSession } from "../../../services/Auth/session";
import { AuthProvider } from "../../context/AuthContext";
import { useAuth } from "../../hooks/useAuth";

vi.mock("../../../services/Auth/AuthService", () => ({
    changePassword: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    switchCompany: vi.fn()
}));

vi.mock("../../../services/Auth/session", () => ({
    clearSession: vi.fn(),
    getSessionUser: vi.fn(),
    getToken: vi.fn(),
    setSession: vi.fn()
}));

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
        getSessionUser.mockReturnValue(null);
        getToken.mockReturnValue(null);
    });

    it("encerra a inicialização sem consultar o servidor quando não existe token", async () => {
        render(<AuthProvider><AuthProbe /></AuthProvider>);

        await screen.findByText("anônimo");
        expect(getCurrentUser).not.toHaveBeenCalled();
        expect(auth.isAuthenticated).toBe(false);
    });

    it("restaura e atualiza a sessão válida sob StrictMode", async () => {
        getToken.mockReturnValue("token-atual");
        getCurrentUser.mockResolvedValue({ id: 1, nome: "Administrador", grupo: { nome: "Administradores" } });

        render(<AuthProvider><AuthProbe /></AuthProvider>);

        await screen.findByText("Administrador");
        expect(auth.isAuthenticated).toBe(true);
        expect(auth.role).toBe("Administradores");
        expect(setSession).toHaveBeenCalledWith("token-atual", expect.objectContaining({ id: 1 }));
    });

    it("limpa a sessão inválida e sempre encerra o bootstrap", async () => {
        getSessionUser.mockReturnValue({ id: 1, nome: "Sessão antiga" });
        getToken.mockReturnValue("expirado");
        getCurrentUser.mockRejectedValue(new Error("Expirada"));

        render(<AuthProvider><AuthProbe /></AuthProvider>);

        await screen.findByText("anônimo");
        expect(clearSession).toHaveBeenCalled();
        expect(auth.bootstrapping).toBe(false);
    });

    it("atualiza o usuário em login, senha, refresh e logout", async () => {
        loginRequest.mockResolvedValue({ id: 2, nome: "Login" });
        changePasswordRequest.mockResolvedValue({ id: 2, nome: "Senha alterada" });
        getCurrentUser.mockResolvedValue({ id: 2, nome: "Atualizado" });
        logoutRequest.mockResolvedValue(undefined);
        render(<AuthProvider><AuthProbe /></AuthProvider>);
        await screen.findByText("anônimo");

        await act(() => auth.signIn({ loginOrEmail: "ana", password: "x" }));
        expect(screen.getByText("Login")).toBeInTheDocument();
        await act(() => auth.changePassword("nova"));
        expect(screen.getByText("Senha alterada")).toBeInTheDocument();
        await act(() => auth.refreshUser());
        expect(screen.getByText("Atualizado")).toBeInTheDocument();
        expect(setSession).toHaveBeenCalledWith(null, expect.objectContaining({ nome: "Atualizado" }));
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
});
