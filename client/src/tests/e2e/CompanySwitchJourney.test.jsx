// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, switchCompany } from "../../../services/Auth/AuthService";
import { getMyHubNavigation } from "../../../services/Solucoes/SolucaoService";
import ProtectedRoute from "../../components/ProtectedRoute";
import { AuthProvider } from "../../context/AuthContext";
import Hub from "../../pages/Hub";
import SolutionWorkspace from "../../pages/SolutionWorkspace";

vi.mock("../../../services/Auth/AuthService", () => ({
  changePassword: vi.fn(),
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  switchCompany: vi.fn(),
}));
vi.mock("../../../services/Solucoes/SolucaoService", () => ({
  getMyHubNavigation: vi.fn(),
}));
vi.mock("../../components/ChamadoNotifications", () => ({ default: () => <span>Notificações</span> }));
vi.mock("../../components/Footer", () => ({ default: () => <footer>Orfeu Sistemas</footer> }));

const companyAUser = {
  id: 7,
  nome: "Administrador",
  login: "admin",
  empresa: { id: 1, nome: "Empresa A" },
  empresas: [{ id: 1, nome: "Empresa A" }, { id: 2, nome: "Empresa B" }],
  grupo: { nome: "Administradores" },
  availableSolutions: ["configurador", "projetos"],
};

const companyBUser = {
  ...companyAUser,
  empresa: { id: 2, nome: "Empresa B" },
};

const configuradorNavigation = [{
  id: 10,
  slug: "configurador",
  nome: "Configurador",
  descricao: "Configuração do sistema",
  funcionalidades: [],
}];

const projetosNavigation = [{
  id: 20,
  slug: "projetos",
  nome: "Projetos",
  descricao: "Gestão de projetos",
  funcionalidades: [],
}];

const renderJourney = () => {
  const router = createMemoryRouter([{
    element: <ProtectedRoute />,
    children: [
      { path: "/hub", element: <Hub /> },
      { path: "/hub/:slug", element: <SolutionWorkspace /> },
    ],
  }], { initialEntries: ["/hub/configurador"] });
  render(<AuthProvider><RouterProvider router={router} /></AuthProvider>);
  return router;
};

describe("troca de empresa pelo cabeçalho", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue(companyAUser);
    getMyHubNavigation.mockImplementation(() => (
      switchCompany.mock.calls.length ? Promise.resolve(projetosNavigation) : Promise.resolve(configuradorNavigation)
    ));
  });

  afterEach(() => {
    cleanup();
    document.body.classList.remove("hub-sidebar-collapsed");
  });

  it("atualiza a empresa, recarrega as soluções e retorna ao Hub", async () => {
    const user = userEvent.setup();
    switchCompany.mockResolvedValue(companyBUser);
    const router = renderJourney();

    expect(await screen.findByRole("heading", { name: "Configurador" })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Trocar empresa ativa" })[0]);
    await user.click(screen.getByRole("option", { name: "Empresa B" }));

    expect(switchCompany).toHaveBeenCalledWith({ empresaId: 2 });
    await waitFor(() => expect(router.state.location.pathname).toBe("/hub"));
    expect(await screen.findByText(/1 solução\(ões\) disponível/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Projetos").length).toBeGreaterThan(0));
    expect(screen.getAllByRole("button", { name: "Trocar empresa ativa" })[0]).toHaveTextContent("Empresa B");
    expect(getMyHubNavigation.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("mantém a empresa anterior e informa a falha da troca", async () => {
    const user = userEvent.setup();
    switchCompany.mockRejectedValue(new Error("Empresa indisponível."));
    renderJourney();

    await screen.findByRole("heading", { name: "Configurador" });
    await user.click(screen.getAllByRole("button", { name: "Trocar empresa ativa" })[0]);
    await user.click(screen.getByRole("option", { name: "Empresa B" }));

    expect(await screen.findByRole("alertdialog", { name: "Não foi possível trocar a empresa" }))
      .toHaveTextContent("Empresa indisponível.");
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    const switcher = screen.getAllByRole("button", { name: "Trocar empresa ativa" })[0];
    expect(switcher).toHaveTextContent("Empresa A");
    expect(screen.getByRole("heading", { name: "Configurador" })).toBeInTheDocument();
  });
});
