// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getLoginCompanies } from "../../../services/Auth/AuthService";
import { useAuth } from "../../hooks/useAuth";
import CompanyLogin from "../../pages/CompanyLogin";

vi.mock("../../../services/Auth/AuthService", () => ({ getLoginCompanies: vi.fn() }));
vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../components/Header", () => ({ default: () => <header>Header</header> }));
vi.mock("../../components/Footer", () => ({ default: () => <footer>Footer</footer> }));

const signIn = vi.fn();
const renderPage = () => render(
    <MemoryRouter initialEntries={["/login"]}>
        <Routes>
            <Route path="/login" element={<CompanyLogin />} />
            <Route path="/hub" element={<h1>Hub autenticado</h1>} />
        </Routes>
    </MemoryRouter>
);

describe("login corporativo", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ signIn });
    });
    afterEach(cleanup);

    it("valida credenciais, lista apenas empresas retornadas e autentica na escolhida", async () => {
        const user = userEvent.setup();
        getLoginCompanies.mockResolvedValue([
            { id: 1, nome: "Empresa A", solucaoNomes: ["Projetos", "Projetos"] },
            { id: 2, nome: "Empresa B", solucaoNomes: ["Chamados"] }
        ]);
        signIn.mockResolvedValue({ id: 7 });
        renderPage();

        await user.type(screen.getByRole("textbox", { name: "Login ou e-mail" }), "  admin  ");
        await user.type(screen.getByLabelText("Senha"), "segredo");
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        expect(await screen.findByRole("heading", { name: "Selecione a empresa" })).toBeInTheDocument();
        expect(getLoginCompanies).toHaveBeenCalledWith({ loginOrEmail: "admin", password: "segredo" });
        expect(screen.getByText("Projetos")).toBeInTheDocument();
        await user.click(screen.getByRole("radio", { name: /Empresa B/ }));
        await user.click(screen.getByRole("button", { name: "Acessar hub" }));

        expect(signIn).toHaveBeenCalledWith({ loginOrEmail: "admin", password: "segredo", empresaId: 2 });
        expect(await screen.findByRole("heading", { name: "Hub autenticado" })).toBeInTheDocument();
    });

    it("informa ausência de empresas e permite corrigir as credenciais", async () => {
        const user = userEvent.setup();
        getLoginCompanies.mockResolvedValue([]);
        renderPage();
        await user.type(screen.getByRole("textbox", { name: "Login ou e-mail" }), "admin");
        await user.type(screen.getByLabelText("Senha"), "segredo");
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("não possui empresas vinculadas");
        expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    });

    it("permanece na seleção e mostra falha da empresa sem perder a escolha", async () => {
        const user = userEvent.setup();
        getLoginCompanies.mockResolvedValue([{ id: 1, nome: "Empresa A", solucaoNomes: [] }]);
        signIn.mockRejectedValue(new Error("Acesso negado nesta empresa."));
        renderPage();
        await user.type(screen.getByRole("textbox", { name: "Login ou e-mail" }), "admin");
        await user.type(screen.getByLabelText("Senha"), "segredo");
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await screen.findByRole("heading", { name: "Selecione a empresa" });
        await user.click(screen.getByRole("button", { name: "Acessar hub" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Acesso negado nesta empresa.");
        expect(screen.getByRole("radio", { name: /Empresa A/ })).toBeChecked();
        await waitFor(() => expect(screen.getByRole("button", { name: "Acessar hub" })).toBeEnabled());
    });
});
