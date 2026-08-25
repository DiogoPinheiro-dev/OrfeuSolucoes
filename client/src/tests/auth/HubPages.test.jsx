// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../../hooks/useAuth";
import { useHubNavigation } from "../../hooks/useHubNavigation";
import Hub from "../../pages/Hub";
import SolutionFeaturePage from "../../pages/SolutionFeaturePage";
import SolutionWorkspace from "../../pages/SolutionWorkspace";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useHubNavigation", () => ({ useHubNavigation: vi.fn() }));
vi.mock("../../components/Header", () => ({ default: () => <header>Header</header> }));
vi.mock("../../components/Footer", () => ({ default: () => <footer>Footer</footer> }));
vi.mock("../../components/UserManagement", () => ({ default: ({ permissions }) => <div>Usuários:{permissions.title}</div> }));
vi.mock("../../components/ChamadoCreate", () => ({
    default: ({ contractUnavailable }) => <div>Formulário de chamado:{contractUnavailable ? "indisponível" : "disponível"}</div>
}));

const solution = {
    id: 1,
    slug: "configurador",
    title: "Configurador",
    description: "Configuração do sistema",
    eyebrow: "Administração",
    areas: [{
        id: 11,
        slug: "cadastro-de-usuarios",
        label: "Usuários",
        title: "Cadastro de usuários",
        description: "Gerencie usuários",
        registryKey: "configurador.cadastro-de-usuarios",
        podeVisualizar: true
    }]
};

function LocationProbe() {
    return <output>{useLocation().pathname}</output>;
}

const renderAt = (path) => render(
    <MemoryRouter initialEntries={[path]}>
        <LocationProbe />
        <Routes>
            <Route path="/hub" element={<Hub />} />
            <Route path="/hub/:slug" element={<SolutionWorkspace />} />
            <Route path="/hub/:slug/:areaSlug" element={<SolutionFeaturePage />} />
        </Routes>
    </MemoryRouter>
);

describe("páginas do Hub", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ user: { nome: "Administrador", empresa: { nome: "Empresa A" } } });
        useHubNavigation.mockReturnValue({ loading: false, error: "", solutions: [solution] });
    });
    afterEach(cleanup);

    it("encerra o resumo do Hub em sucesso ou erro, nunca em loading permanente", () => {
        const { rerender } = renderAt("/hub");
        expect(screen.getByText(/1 solução/)).toBeInTheDocument();

        useHubNavigation.mockReturnValue({ loading: false, error: "Serviço indisponível.", solutions: [] });
        rerender(<MemoryRouter initialEntries={["/hub"]}><Routes><Route path="/hub" element={<Hub />} /></Routes></MemoryRouter>);
        expect(screen.getByText("Serviço indisponível.")).toBeInTheDocument();
        expect(screen.queryByText("Carregando soluções...")).not.toBeInTheDocument();
    });

    it("permite acesso direto à solução e monta os links das funcionalidades", () => {
        renderAt("/hub/configurador");
        expect(screen.getByRole("heading", { name: "Configurador" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Cadastro de usuários/ })).toHaveAttribute("href", "/hub/configurador/cadastro-de-usuarios");
    });

    it("redireciona solução desconhecida para o Hub", async () => {
        renderAt("/hub/inexistente");
        expect(await screen.findByText("/hub")).toBeInTheDocument();
    });

    it("não oferece placeholder por URL direta para Controle de Horas indisponível", async () => {
        renderAt("/hub/horas/registro-de-horas");

        expect(await screen.findByText("/hub")).toBeInTheDocument();
        expect(screen.queryByText(/Registro de horas/i)).not.toBeInTheDocument();
    });

    it("resolve a funcionalidade pelo registry key e repassa permissões", async () => {
        renderAt("/hub/configurador/cadastro-de-usuarios");
        expect(screen.getByRole("heading", { name: "Carregando funcionalidade..." })).toBeInTheDocument();
        expect(await screen.findByText("Usuários:Cadastro de usuários")).toBeInTheDocument();
    });

    it("redireciona funcionalidade desconhecida para a solução correta", async () => {
        renderAt("/hub/configurador/inexistente");
        expect(await screen.findByText("/hub/configurador")).toBeInTheDocument();
    });

    it("mantém a abertura de chamados explicativa e indisponível sem contrato", async () => {
        useHubNavigation.mockReturnValue({ loading: false, error: "", solutions: [] });

        renderAt("/hub/controle-de-chamados/abrir-chamado");

        expect(await screen.findByText("Formulário de chamado:indisponível")).toBeInTheDocument();
        expect(screen.getByText("/hub/controle-de-chamados/abrir-chamado")).toBeInTheDocument();
    });
});
