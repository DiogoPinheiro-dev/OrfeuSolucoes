// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
vi.mock("../../components/ProjectResourcePlanningManagement", () => ({
    default: () => <div>Planejamento de recursos</div>
}));
vi.mock("../../components/CategoriaChamadoManagement", () => ({ default: ({ permissions }) => <div>Categorias:{permissions.title}</div> }));
vi.mock("../../components/ChamadoConfiguracaoManagement", () => ({ default: ({ kind }) => <div>Configuração:{kind}</div> }));
vi.mock("../../components/ChamadoDashboard", () => ({ default: () => <div>Dashboard</div> }));

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
        providerKey: "configurador.cadastro-de-usuarios",
        providerVersion: 1,
        podeVisualizar: true
    }]
};

const chamadosArea = (id, slug, label, title, groupId, groupOrder, order) => ({
    id,
    slug,
    label,
    title,
    groupId,
    groupOrder,
    order,
    registryKey: `controle-de-chamados.${slug}`,
    providerKey: `controle-de-chamados.${slug}`,
    providerVersion: 1,
    podeVisualizar: true
});

const chamados = {
    id: 3,
    slug: "controle-de-chamados",
    title: "Controle de Chamados",
    description: "Atendimento por empresa",
    eyebrow: "Atendimento",
    groups: [{ id: 7, slug: "configuracoes-do-atendimento", title: "Configurações do atendimento", label: "Configurações", description: "Ajuste o atendimento da empresa.", order: 50 }],
    areas: [
        chamadosArea(30, "dashboard", "Dashboard", "Dashboard de chamados", null, null, 45),
        chamadosArea(31, "tipos", "Tipos", "Tipos de chamados", 7, 2, 70),
        chamadosArea(32, "prioridades", "Prioridades", "Prioridades de chamados", 7, 3, 80),
        chamadosArea(33, "categorias", "Categorias", "Categorias de chamados", 7, 1, 50)
    ]
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

    it("mantém o shell em loading enquanto a navegação autorizada não chegou", () => {
        useHubNavigation.mockReturnValue({ loading: true, error: "", solutions: [] });

        renderAt("/hub/configurador/cadastro-de-usuarios");

        expect(screen.getByRole("heading", { name: "Carregando funcionalidade..." })).toBeInTheDocument();
        expect(screen.getByText("Header")).toBeInTheDocument();
        expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("apresenta fallback defensivo para provider desconhecido sem executar outra tela", () => {
        useHubNavigation.mockReturnValue({
            loading: false,
            error: "",
            solutions: [{
                ...solution,
                areas: [{
                    ...solution.areas[0],
                    slug: "provider-desconhecido",
                    registryKey: "configurador.provider-inexistente",
                    providerKey: "configurador.provider-inexistente"
                }]
            }]
        });

        renderAt("/hub/configurador/provider-desconhecido");

        expect(screen.getByRole("heading", { name: "Cadastro de usuários" })).toBeInTheDocument();
        expect(screen.getByText("Funcionalidade sem tela vinculada no momento.")).toBeInTheDocument();
        expect(screen.queryByText(/Usuários:Cadastro/)).not.toBeInTheDocument();
    });

    it("redireciona funcionalidade desconhecida para a solução correta", async () => {
        renderAt("/hub/configurador/inexistente");
        expect(await screen.findByText("/hub/configurador")).toBeInTheDocument();
    });

    it("mantém links antigos por alias e abre o provider atual", async () => {
        useHubNavigation.mockReturnValue({
            loading: false,
            error: "",
            solutions: [{
                id: 2,
                slug: "projetos",
                title: "Projetos",
                areas: [{
                    id: 21,
                    slug: "planejamento-de-recursos",
                    title: "Planejamento de recursos",
                    label: "Planejamento",
                    registryKey: "projetos.planejamento-de-recursos",
                    providerKey: "projetos.planejamento-de-recursos",
                    providerVersion: 1,
                    podeVisualizar: true
                }]
            }]
        });

        renderAt("/hub/projetos/grade-de-capacitacao");

        expect(await screen.findByText("Planejamento de recursos")).toBeInTheDocument();
        expect(screen.getByText("/hub/projetos/grade-de-capacitacao")).toBeInTheDocument();
    });

    it("mantém a abertura de chamados explicativa e indisponível sem contrato", async () => {
        useHubNavigation.mockReturnValue({ loading: false, error: "", solutions: [] });

        renderAt("/hub/controle-de-chamados/abrir-chamado");

        expect(await screen.findByText("Formulário de chamado:indisponível")).toBeInTheDocument();
        expect(screen.getByText("/hub/controle-de-chamados/abrir-chamado")).toBeInTheDocument();
    });
});

describe("funcionalidades agrupadas por abas", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ user: { nome: "Administrador", empresa: { nome: "Empresa A" } } });
        useHubNavigation.mockReturnValue({ loading: false, error: "", solutions: [chamados] });
    });
    afterEach(cleanup);

    it("apresenta um único card para o agrupamento, apontando para a primeira aba", () => {
        renderAt("/hub/controle-de-chamados");

        expect(screen.getByRole("link", { name: /Configurações do atendimento/ })).toHaveAttribute("href", "/hub/controle-de-chamados/categorias");
        expect(screen.getByRole("link", { name: /Dashboard de chamados/ })).toHaveAttribute("href", "/hub/controle-de-chamados/dashboard");
        expect(screen.queryByRole("link", { name: /Tipos de chamados/ })).not.toBeInTheDocument();
    });

    it("abre a funcionalidade dentro das abas do agrupamento e troca de aba pela rota", async () => {
        const user = userEvent.setup();
        renderAt("/hub/controle-de-chamados/tipos");

        const tablist = screen.getByRole("tablist", { name: "Seções de Configurações do atendimento" });
        expect(within(tablist).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Categorias", "Tipos", "Prioridades"]);
        expect(within(tablist).getByRole("tab", { name: "Tipos" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("heading", { name: "Configurações do atendimento" })).toBeInTheDocument();
        expect(await screen.findByText("Configuração:tipos")).toBeInTheDocument();

        await user.click(within(tablist).getByRole("tab", { name: "Prioridades" }));

        expect(await screen.findByText("/hub/controle-de-chamados/prioridades")).toBeInTheDocument();
        expect(await screen.findByText("Configuração:prioridades")).toBeInTheDocument();
        expect(screen.queryByText("Configuração:tipos")).not.toBeInTheDocument();
    });

    it("redireciona o endereço do agrupamento para a primeira aba autorizada", async () => {
        renderAt("/hub/controle-de-chamados/configuracoes-do-atendimento");

        expect(await screen.findByText("/hub/controle-de-chamados/categorias")).toBeInTheDocument();
        expect(await screen.findByText("Categorias:Categorias de chamados")).toBeInTheDocument();
    });

    it("mostra somente as abas autorizadas e dispensa a barra quando resta uma", async () => {
        useHubNavigation.mockReturnValue({
            loading: false,
            error: "",
            solutions: [{ ...chamados, areas: chamados.areas.filter((area) => area.slug === "tipos" || area.slug === "dashboard") }]
        });

        renderAt("/hub/controle-de-chamados/tipos");

        expect(await screen.findByText("Configuração:tipos")).toBeInTheDocument();
        expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Configurações do atendimento" })).not.toBeInTheDocument();
    });
});
