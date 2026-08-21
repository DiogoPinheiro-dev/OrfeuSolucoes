// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { register } from "../../../services/Auth/AuthService";
import LoginModal from "../../components/LoginModal";
import { useAuth } from "../../hooks/useAuth";

vi.mock("../../../services/Auth/AuthService", () => ({
    register: vi.fn()
}));

vi.mock("../../hooks/useAuth", () => ({
    useAuth: vi.fn()
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("LoginModal", () => {
    it("aplica a política forte e usa o autocadastro sem campos privilegiados", async () => {
        const user = userEvent.setup();
        const signIn = vi.fn().mockResolvedValue({ id: "usuario" });
        const onClose = vi.fn();
        register.mockResolvedValue({ id: "usuario" });
        useAuth.mockReturnValue({ signIn });

        render(
            <MemoryRouter>
                <LoginModal open onClose={onClose} />
            </MemoryRouter>
        );

        await user.click(screen.getByRole("button", { name: "Cadastrar" }));
        await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
        await user.type(screen.getByLabelText("Nome completo"), "Ana Silva");
        await user.type(screen.getByLabelText("Login"), "ana.silva");
        await user.type(screen.getByLabelText("Senha"), "senhafraca");
        const submitButton = screen.getAllByRole("button", { name: "Cadastrar" })
            .find((button) => button.closest("form"));
        await user.click(submitButton);

        expect(screen.getByRole("alert")).toHaveTextContent("uma letra maiúscula");
        expect(register).not.toHaveBeenCalled();
        expect(signIn).not.toHaveBeenCalled();

        await user.clear(screen.getByLabelText("Senha"));
        await user.type(screen.getByLabelText("Senha"), "NovaSenha@1");
        await user.click(submitButton);

        expect(register).toHaveBeenCalledWith({
            nome: "Ana Silva",
            login: "ana.silva",
            email: "ana@example.com",
            password: "NovaSenha@1"
        });
        expect(signIn).toHaveBeenCalledWith({
            loginOrEmail: "ana@example.com",
            password: "NovaSenha@1"
        });
        expect(onClose).toHaveBeenCalledOnce();
    });
});
