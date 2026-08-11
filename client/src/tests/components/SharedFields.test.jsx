// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import CustomDropdown from "../../components/CustomDropdown";
import Footer from "../../components/Footer";
import FormFieldError from "../../components/FormFieldError";
import PasswordInput from "../../components/PasswordInput";

afterEach(cleanup);

const options = [
    { value: 1, label: "Alpha" },
    { value: 2, label: "Beta" },
    { value: 3, label: "Bloqueada", disabled: true }
];

describe("campos compartilhados", () => {
    it("abre o dropdown por teclado e emite um evento compatível com formulário", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<CustomDropdown name="empresaId" ariaLabel="Empresa" value="" options={options} onChange={onChange} />);

        const trigger = screen.getByRole("button", { name: "Empresa" });
        trigger.focus();
        await user.keyboard("{ArrowDown}");
        expect(trigger).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByRole("listbox", { name: "Empresa" })).toBeInTheDocument();

        await user.click(screen.getByRole("option", { name: "Beta" }));
        expect(onChange).toHaveBeenCalledWith({
            target: { name: "empresaId", type: "select-one", value: "2" }
        });
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        expect(document.querySelector('input[type="hidden"][name="empresaId"]')).toHaveValue("");
    });

    it("fecha o dropdown com Escape ou clique externo e respeita estados inválido e desabilitado", async () => {
        const user = userEvent.setup();
        const { rerender } = render(<><CustomDropdown ariaLabel="Empresa" invalid options={options} /><button>Fora</button></>);
        const trigger = screen.getByRole("button", { name: "Empresa" });

        await user.click(trigger);
        expect(trigger).toHaveAttribute("aria-invalid", "true");
        fireEvent.keyDown(trigger, { key: "Escape" });
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

        await user.click(trigger);
        fireEvent.pointerDown(screen.getByRole("button", { name: "Fora" }));
        await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());

        rerender(<CustomDropdown ariaLabel="Empresa" disabled options={options} />);
        expect(screen.getByRole("button", { name: "Empresa" })).toBeDisabled();
    });

    it("posiciona o menu em portal sem removê-lo da árvore acessível", async () => {
        const user = userEvent.setup();
        render(<CustomDropdown ariaLabel="Empresa" menuPlacement="right" options={options} />);
        const trigger = screen.getByRole("button", { name: "Empresa" });
        vi.spyOn(trigger.parentElement, "getBoundingClientRect").mockReturnValue({
            top: 20, right: 140, bottom: 60, left: 20, width: 120, height: 40, x: 20, y: 20, toJSON: () => ({})
        });

        await user.click(trigger);
        const listbox = screen.getByRole("listbox", { name: "Empresa" });
        expect(document.body).toContainElement(listbox);
        expect(listbox).toHaveClass("custom-dropdown__menu--portal");
    });

    it("alterna visibilidade da senha sem permitir interação quando desabilitado", async () => {
        const user = userEvent.setup();
        const { rerender } = render(<PasswordInput aria-label="Senha" defaultValue="segredo" />);
        const input = screen.getByLabelText("Senha");

        expect(input).toHaveAttribute("type", "password");
        await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
        expect(input).toHaveAttribute("type", "text");
        expect(screen.getByRole("button", { name: "Ocultar senha" })).toHaveAttribute("aria-pressed", "true");

        rerender(<PasswordInput aria-label="Senha" disabled />);
        expect(screen.getByLabelText("Senha")).toBeDisabled();
        expect(screen.getByRole("button", { name: "Ocultar senha" })).toBeDisabled();
    });

    it("expõe erro de campo com identificador estável e papel de alerta", () => {
        const { rerender } = render(<FormFieldError formId="user-form" field="email" errors={{ email: "E-mail inválido." }} />);
        expect(screen.getByRole("alert")).toHaveAttribute("id", "user-form-email-error");
        expect(screen.getByRole("alert")).toHaveTextContent("E-mail inválido.");

        rerender(<FormFieldError formId="user-form" field="email" errors={{}} />);
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});

describe("estrutura compartilhada", () => {
    it("mantém os contatos externos do rodapé seguros e acessíveis", () => {
        render(<Footer />);
        expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
        for (const link of screen.getAllByRole("link")) {
            expect(link).toHaveAttribute("target", "_blank");
            expect(link).toHaveAttribute("rel", "noopener noreferrer");
            expect(link).toHaveAccessibleName();
        }
    });
});
