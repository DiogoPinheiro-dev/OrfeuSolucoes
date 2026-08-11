// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCurrentUser,
  getLoginCompanies,
  login,
} from "../../../services/Auth/AuthService";
import { getMyHubNavigation } from "../../../services/Solucoes/SolucaoService";
import App from "../../App";
import ProtectedRoute from "../../components/ProtectedRoute";
import { AuthProvider } from "../../context/AuthContext";
import CompanyLogin from "../../pages/CompanyLogin";
import Hub from "../../pages/Hub";
import SolutionFeaturePage from "../../pages/SolutionFeaturePage";
import SolutionWorkspace from "../../pages/SolutionWorkspace";

vi.mock("../../../services/Auth/AuthService", () => ({
  changePassword: vi.fn(),
  getCurrentUser: vi.fn(),
  getLoginCompanies: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  switchCompany: vi.fn(),
}));
vi.mock("../../../services/Solucoes/SolucaoService", () => ({
  getMyHubNavigation: vi.fn(),
}));
vi.mock("../../components/Header", () => ({ default: () => <header>Orfeu</header> }));
vi.mock("../../components/Footer", () => ({ default: () => <footer>Orfeu Sistemas</footer> }));
vi.mock("../../components/ForcePasswordChangeModal", () => ({ default: () => null }));
vi.mock("../../components/UserManagement", () => ({
  default: ({ permissions }) => <h2>Gestão ativa: {permissions.title}</h2>,
}));

const authenticatedUser = {
  id: 7,
  nome: "Administrador",
  login: "admin",
  empresa: { id: 2, nome: "Empresa B" },
  empresas: [{ id: 2, nome: "Empresa B" }],
  grupo: { nome: "Administradores" },
};

const hubNavigation = [{
  id: 10,
  slug: "configurador",
  nome: "Configurador",
  descricao: "Configuração do sistema",
  eyebrow: "Administração",
  funcionalidades: [{
    id: 11,
    slug: "cadastro-de-usuarios",
    label: "Usuários",
    titulo: "Cadastro de usuários",
    descricao: "Gerencie os usuários",
    registryKey: "configurador.cadastro-de-usuarios",
    podeVisualizar: true,
  }],
}];

const createRouter = (initialEntry) => createMemoryRouter([{
  path: "/",
  element: <App />,
  children: [
    { index: true, element: <h1>Página inicial</h1> },
    { path: "login", element: <CompanyLogin /> },
    {
      element: <ProtectedRoute />,
      children: [
        { path: "hub", element: <Hub /> },
        { path: "hub/:slug", element: <SolutionWorkspace /> },
        { path: "hub/:slug/:areaSlug", element: <SolutionFeaturePage /> },
      ],
    },
  ],
}], { initialEntries: [initialEntry] });

const renderJourney = (initialEntry) => {
  const router = createRouter(initialEntry);
  render(<AuthProvider><RouterProvider router={router} /></AuthProvider>);
  return router;
};

describe("jornadas críticas do frontend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("autentica na empresa escolhida e navega do Hub até a funcionalidade", async () => {
    const user = userEvent.setup();
    getLoginCompanies.mockResolvedValue([
      { id: 1, nome: "Empresa A", solucaoNomes: ["Projetos"] },
      { id: 2, nome: "Empresa B", solucaoNomes: ["Configurador"] },
    ]);
    login.mockResolvedValue(authenticatedUser);
    getMyHubNavigation.mockResolvedValue(hubNavigation);
    const router = renderJourney("/login");

    await user.type(screen.getByRole("textbox", { name: "Login ou e-mail" }), "admin");
    await user.type(screen.getByLabelText("Senha"), "segredo");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(await screen.findByRole("radio", { name: /Empresa B/ }));
    await user.click(screen.getByRole("button", { name: "Acessar hub" }));

    expect(await screen.findByRole("heading", { name: "Bem-vindo, Administrador." })).toBeInTheDocument();
    expect(await screen.findByText(/1 solução\(ões\) disponível/)).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith({ loginOrEmail: "admin", password: "segredo", empresaId: 2 });

    await router.navigate("/hub/configurador");
    const featureLink = await screen.findByRole("link", { name: /Cadastro de usuários/ });
    await user.click(featureLink);

    expect(await screen.findByRole("heading", { name: "Gestão ativa: Cadastro de usuários" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/hub/configurador/cadastro-de-usuarios");
  });

  it("remove a sessão expirada e impede acesso direto a uma rota protegida", async () => {
    localStorage.setItem("orfeu_token", "token-expirado");
    localStorage.setItem("orfeu_auth", "true");
    localStorage.setItem("orfeu_user", JSON.stringify(authenticatedUser));
    getCurrentUser.mockRejectedValue(new Error("Sessão expirada"));
    const router = renderJourney("/hub/configurador");

    expect(await screen.findByRole("heading", { name: "Página inicial" })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(localStorage.getItem("orfeu_token")).toBeNull();
    expect(getMyHubNavigation).not.toHaveBeenCalled();
  });

  it("encerra o carregamento do Hub com uma mensagem quando as soluções falham", async () => {
    localStorage.setItem("orfeu_token", "token-valido");
    localStorage.setItem("orfeu_user", JSON.stringify(authenticatedUser));
    getCurrentUser.mockResolvedValue(authenticatedUser);
    getMyHubNavigation.mockRejectedValue(new Error("Não foi possível carregar as soluções."));
    renderJourney("/hub");

    expect(await screen.findByText("Não foi possível carregar as soluções.")).toBeInTheDocument();
    expect(screen.queryByText("Carregando soluções...")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bem-vindo, Administrador." })).toBeInTheDocument();
  });

  it("redireciona uma solução desconhecida para o Hub autorizado", async () => {
    localStorage.setItem("orfeu_token", "token-valido");
    localStorage.setItem("orfeu_user", JSON.stringify(authenticatedUser));
    getCurrentUser.mockResolvedValue(authenticatedUser);
    getMyHubNavigation.mockResolvedValue(hubNavigation);
    const router = renderJourney("/hub/solucao-inexistente");

    expect(await screen.findByRole("heading", { name: "Bem-vindo, Administrador." })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe("/hub"));
  });

  it("redireciona uma funcionalidade desconhecida para a solução correta", async () => {
    localStorage.setItem("orfeu_token", "token-valido");
    localStorage.setItem("orfeu_user", JSON.stringify(authenticatedUser));
    getCurrentUser.mockResolvedValue(authenticatedUser);
    getMyHubNavigation.mockResolvedValue(hubNavigation);
    const router = renderJourney("/hub/configurador/funcionalidade-inexistente");

    expect(await screen.findByRole("heading", { name: "Configurador" })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe("/hub/configurador"));
    expect(screen.getByRole("link", { name: /Cadastro de usuários/ })).toBeInTheDocument();
  });
});
