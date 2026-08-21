import { describe, expect, it } from "vitest";

import {
    formatPasswordPolicyIssues,
    getPasswordPolicyIssues,
    PASSWORD_MAX_BYTES,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH
} from "../../utils/passwordPolicy";

describe("política de senha do frontend", () => {
    it("mantém os mesmos limites e requisitos do backend", () => {
        expect(PASSWORD_MIN_LENGTH).toBe(10);
        expect(PASSWORD_MAX_LENGTH).toBe(72);
        expect(PASSWORD_MAX_BYTES).toBe(72);
        expect(getPasswordPolicyIssues("NovaSenha@1")).toEqual([]);
        expect(getPasswordPolicyIssues(" senhafraca ")).toEqual(expect.arrayContaining([
            "conter uma letra maiúscula",
            "conter um número",
            "conter um caractere especial"
        ]));
    });

    it("rejeita senha acima do limite de bytes suportado pelo bcrypt", () => {
        const password = `Ab1!${"é".repeat(68)}`;

        expect(password).toHaveLength(72);
        expect(getPasswordPolicyIssues(password)).toContain("usar no máximo 72 bytes em UTF-8");
    });

    it("formata vários requisitos como uma frase em português", () => {
        expect(formatPasswordPolicyIssues(["ter dez caracteres", "conter um número"]))
            .toBe("ter dez caracteres e conter um número");
    });
});
