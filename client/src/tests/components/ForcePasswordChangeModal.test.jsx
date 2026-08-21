// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ForcePasswordChangeModal from "../../components/ForcePasswordChangeModal";
import { useAuth } from "../../hooks/useAuth";

vi.mock("../../hooks/useAuth", () => ({
    useAuth: vi.fn()
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("ForcePasswordChangeModal", () => {
    it("explica e aplica a mesma política de senha forte do backend", async () => {
        const user = userEvent.setup();
        const changePassword = vi.fn();
        useAuth.mockReturnValue({
            user: { deveAlterarSenha: true },
            changePassword
        });
        render(<ForcePasswordChangeModal />);

        expect(screen.getByRole("dialog", { name: "Alteração obrigatória de senha" }))
            .toHaveTextContent("entre 10 e 72 caracteres, no máximo 72 bytes");

        await user.type(screen.getByLabelText("Nova senha"), "senhafraca");
        await user.type(screen.getByLabelText("Confirmar nova senha"), "senhafraca");
        await user.click(screen.getByRole("button", { name: "Alterar senha" }));

        expect(screen.getByRole("alert")).toHaveTextContent("uma letra maiúscula");
        expect(screen.getByRole("alert")).toHaveTextContent("um número");
        expect(screen.getByRole("alert")).toHaveTextContent("um caractere especial");
        expect(changePassword).not.toHaveBeenCalled();
    });

    it("envia uma senha que atende a política", async () => {
        const user = userEvent.setup();
        const changePassword = vi.fn().mockResolvedValue(undefined);
        useAuth.mockReturnValue({
            user: { deveAlterarSenha: true },
            changePassword
        });
        render(<ForcePasswordChangeModal />);

        await user.type(screen.getByLabelText("Nova senha"), "NovaSenha@1");
        await user.type(screen.getByLabelText("Confirmar nova senha"), "NovaSenha@1");
        await user.click(screen.getByRole("button", { name: "Alterar senha" }));

        expect(changePassword).toHaveBeenCalledWith("NovaSenha@1");
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});
