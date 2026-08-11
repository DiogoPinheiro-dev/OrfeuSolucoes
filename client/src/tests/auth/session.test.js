// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    clearSession,
    getSessionUser,
    getToken,
    isAuthenticated,
    setSession
} from "../../../services/Auth/session";

describe("persistência local da sessão", () => {
    beforeEach(() => localStorage.clear());

    it("salva token e usuário e notifica a aplicação", () => {
        const listener = vi.fn();
        window.addEventListener("orfeu:authChanged", listener, { once: true });

        setSession("token-1", { id: 7, nome: "Ana" });

        expect(getToken()).toBe("token-1");
        expect(getSessionUser()).toEqual({ id: 7, nome: "Ana" });
        expect(isAuthenticated()).toBe(true);
        expect(listener).toHaveBeenCalledOnce();
    });

    it("remove toda a sessão e notifica o logout", () => {
        setSession("token-1", { id: 7 });
        const listener = vi.fn();
        window.addEventListener("orfeu:authChanged", listener, { once: true });

        clearSession();

        expect(getToken()).toBeNull();
        expect(getSessionUser()).toBeNull();
        expect(isAuthenticated()).toBe(false);
        expect(listener).toHaveBeenCalledOnce();
    });

    it("descarta usuário local corrompido sem quebrar a inicialização", () => {
        localStorage.setItem("orfeu_user", "{inválido");

        expect(getSessionUser()).toBeNull();
        expect(localStorage.getItem("orfeu_user")).toBeNull();
    });
});
