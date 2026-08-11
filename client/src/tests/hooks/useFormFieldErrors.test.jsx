// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useFormFieldErrors } from "../../hooks/useFormFieldErrors";

const createForm = () => {
    document.body.innerHTML = '<form id="record-form"><input name="nome"><input name="email"></form>';
    Element.prototype.scrollIntoView = vi.fn();
};

afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
});

describe("useFormFieldErrors", () => {
    it("normaliza erros estruturados, abre a aba e focaliza o primeiro campo da ordem", async () => {
        createForm();
        const setActiveTab = vi.fn();
        const { result } = renderHook(() => useFormFieldErrors({
            formId: "record-form",
            fieldOrder: ["nome", "email"],
            fieldTabs: { nome: "general" },
            setActiveTab
        }));

        act(() => result.current.showFieldErrors({ email: ["E-mail inválido."], nome: "Informe o nome." }));

        expect(result.current.fieldErrors).toEqual({ email: "E-mail inválido.", nome: "Informe o nome." });
        expect(result.current.fieldErrorProps("nome")).toEqual({
            "aria-invalid": "true",
            "aria-describedby": "record-form-nome-error"
        });
        expect(setActiveTab).toHaveBeenCalledWith("general");
        await waitFor(() => expect(document.querySelector('[name="nome"]')).toHaveFocus());
    });

    it("infere o campo pela mensagem e preserva erro geral quando não há correspondência", () => {
        const { result } = renderHook(() => useFormFieldErrors({
            formId: "record-form",
            fieldMatchers: { email: [/e-mail/i] }
        }));

        act(() => expect(result.current.applyError(new Error("E-mail já cadastrado."), "Falha.")).toBe(true));
        expect(result.current.fieldErrors.email).toBe("E-mail já cadastrado.");

        act(() => expect(result.current.applyError(new Error("Serviço indisponível."), "Falha.")).toBe(false));
        expect(result.current.fieldErrors).toEqual({});
        expect(result.current.generalError).toBe("Serviço indisponível.");
    });

    it("limpa um campo isolado e depois todo o estado de erro", () => {
        const { result } = renderHook(() => useFormFieldErrors({ formId: "record-form" }));

        act(() => result.current.showFieldErrors({ nome: "Obrigatório.", email: "Inválido." }));
        act(() => result.current.clearFieldError("nome"));
        expect(result.current.fieldErrors).toEqual({ email: "Inválido." });

        act(() => result.current.clearErrors());
        expect(result.current.fieldErrors).toEqual({});
        expect(result.current.generalError).toBe("");
        expect(result.current.fieldErrorProps("email")).toEqual({
            "aria-invalid": undefined,
            "aria-describedby": undefined
        });
    });
});
