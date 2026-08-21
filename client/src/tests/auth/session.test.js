// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearLegacySessionStorage } from "../../../services/Auth/legacySession";

describe("migração da sessão local legada", () => {
    beforeEach(() => localStorage.clear());

    it("remove token, flag e usuário persistidos por versões anteriores", () => {
        localStorage.setItem("orfeu_token", "token-legado");
        localStorage.setItem("orfeu_auth", "true");
        localStorage.setItem("orfeu_user", JSON.stringify({ id: 7 }));
        localStorage.setItem("preferencia_visual", "compacta");

        clearLegacySessionStorage();

        expect(localStorage.getItem("orfeu_token")).toBeNull();
        expect(localStorage.getItem("orfeu_auth")).toBeNull();
        expect(localStorage.getItem("orfeu_user")).toBeNull();
        expect(localStorage.getItem("preferencia_visual")).toBe("compacta");
    });

    it("não interrompe o bootstrap quando o armazenamento local está indisponível", () => {
        const removeItem = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
            throw new DOMException("Armazenamento bloqueado", "SecurityError");
        });

        expect(() => clearLegacySessionStorage()).not.toThrow();

        removeItem.mockRestore();
    });
});
