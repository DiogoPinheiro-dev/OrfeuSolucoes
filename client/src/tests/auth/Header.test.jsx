// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Header from "../../components/Header";
import { useAuth } from "../../hooks/useAuth";
import { useHubNavigation } from "../../hooks/useHubNavigation";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useHubNavigation", () => ({ useHubNavigation: vi.fn() }));
vi.mock("../../components/ChamadoNotifications", () => ({ default: () => <span>Notificações</span> }));

const switchCompany = vi.fn();
const signOut = vi.fn();
const auth = {
    isAuthenticated: true,
    signOut,
    switchCompany,
    switchingCompany: false,
    user: {
        nome: "Administrador",
        grupo: { nome: "Administradores" },
        empresa: { id: 1, nome: "Empresa A" },
        empresas: [{ id: 1, nome: "Empresa A" }, { id: 2, nome: "Empresa B" }],
        availableSolutions: ["configurador", "projetos"]
    }
};

function LocationProbe() {
    return <output>{useLocation().pathname}</output>;
}

const renderHeader = (path = "/hub/configurador") => render(
    <MemoryRouter initialEntries={[path]}>
        <Header />
        <Routes><Route path="*" element={<LocationProbe />} /></Routes>
    </MemoryRouter>
);

describe("Header autenticado", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue(auth);
        useHubNavigation.mockReturnValue({ solutions: [
            {
                slug: "configurador",
                title: "Configurador",
                areas: [{ slug: "usuarios", title: "Usuários", registryKey: "configurador.cadastro-de-usuarios" }]
            },
            { slug: "documentacao", title: "Documentação", areas: [] }
        ] });
    });
    afterEach(() => {
        cleanup();
        document.body.classList.remove("hub-sidebar-collapsed");
    });

    it("expõe solução ativa, funcionalidade e controle acessível da barra lateral", () => {
        renderHeader();
        expect(screen.getAllByText("Configurador").length).toBeGreaterThan(0);
        expect(screen.getByRole("link", { name: "Usuários" })).toHaveAttribute("href", "/hub/configurador/usuarios");
        expect(screen.getByRole("button", { name: "Minimizar menu do Hub" })).toBeInTheDocument();
    });

    it("apresenta documentação como solução do Hub", () => {
        renderHeader("/hub");

        expect(screen.getByRole("link", { name: "Documentação" }))
            .toHaveAttribute("href", "/hub/documentacao");
    });

    it("não exibe documentação fora do Hub de Soluções", () => {
        renderHeader("/ecommerce");

        expect(screen.queryByRole("link", { name: /documentação|ajuda desta funcionalidade/i }))
            .not.toBeInTheDocument();
    });

    it("troca a empresa, fecha o menu e retorna ao Hub", async () => {
        const user = userEvent.setup();
        switchCompany.mockResolvedValue({ empresa: { id: 2 } });
        renderHeader();
        const switcher = screen.getAllByRole("button", { name: "Trocar empresa ativa" })[0];
        await user.click(switcher);
        await user.click(screen.getByRole("option", { name: "Empresa B" }));

        expect(switchCompany).toHaveBeenCalledWith(2);
        await waitFor(() => expect(screen.getByText("/hub")).toBeInTheDocument());
    });

    it("restaura a empresa selecionada e apresenta erro quando a troca falha", async () => {
        const user = userEvent.setup();
        switchCompany.mockRejectedValue(new Error("Empresa indisponível."));
        renderHeader();
        await user.click(screen.getAllByRole("button", { name: "Trocar empresa ativa" })[0]);
        await user.click(screen.getByRole("option", { name: "Empresa B" }));

        expect(await screen.findByRole("alertdialog", { name: "Não foi possível trocar a empresa" })).toHaveTextContent("Empresa indisponível.");
        await user.click(screen.getByRole("button", { name: "Fechar" }));
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("encerra a sessão e navega para a página inicial", async () => {
        const user = userEvent.setup();
        signOut.mockResolvedValue(undefined);
        renderHeader();
        await user.click(screen.getAllByRole("button", { name: "Sair" })[0]);
        expect(signOut).toHaveBeenCalledOnce();
        await waitFor(() => expect(screen.getByText("/")).toBeInTheDocument());
    });
});
