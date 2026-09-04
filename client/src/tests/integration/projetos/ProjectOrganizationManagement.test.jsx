// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { excluirRecurso, salvarRecurso } from "../../../../services/Projetos/RecursoService";
import { excluirCapacitacao, excluirEquipe, getProjetoOrganizacao, salvarCapacitacao, salvarEquipe } from "../../../../services/Projetos/OrganizacaoProjetoService";
import ProjectTeamManagement from "../../../components/ProjectTeamManagement";
import ResourceRegistrationManagement from "../../../components/ResourceRegistrationManagement";

vi.mock("../../../../services/Projetos/RecursoService", () => ({ excluirRecurso: vi.fn(), salvarRecurso: vi.fn() }));
vi.mock("../../../../services/Projetos/OrganizacaoProjetoService", () => ({ excluirCapacitacao: vi.fn(), excluirEquipe: vi.fn(), getProjetoOrganizacao: vi.fn(), salvarCapacitacao: vi.fn(), salvarEquipe: vi.fn() }));

const developer = { id: "00000000-0000-4000-8000-000000000001", nome: "Desenvolvedora", email: "dev@orfeu.local" };
const resource = { id: "00000000-0000-4000-8000-000000000002", usuarioId: developer.id, usuario: developer, ativo: true, versao: 1, capacitacao: { id: "00000000-0000-4000-8000-000000000003", nome: "Desenvolvedor pleno", nivelHierarquico: 2, ativo: true, versao: 1 } };
const project = { id: "00000000-0000-4000-8000-000000000004", chave: "ORF", nome: "Orfeu", arquivadoEm: null };
const panel = { candidatos: [developer], recursos: [resource], capacitacoes: [resource.capacitacao], equipes: [], projetos: [project], permissoes: { podeIncluir: true, podeAlterar: true, podeExcluir: true } };

beforeEach(() => {
  getProjetoOrganizacao.mockResolvedValue(panel);
  salvarRecurso.mockResolvedValue(resource);
  excluirRecurso.mockResolvedValue(true);
  salvarCapacitacao.mockResolvedValue(resource.capacitacao);
  excluirCapacitacao.mockResolvedValue(true);
  salvarEquipe.mockResolvedValue({ id: "team-1" });
  excluirEquipe.mockResolvedValue(true);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Organização de recursos e equipes", () => {
  it("cadastra recurso com usuário e capacitação, sem vínculo direto com projeto", async () => {
    const user = userEvent.setup();
    getProjetoOrganizacao.mockResolvedValue({ ...panel, recursos: [] });
    render(<ResourceRegistrationManagement />);
    const grid = (await screen.findByRole("heading", { name: "Cadastro de recursos" })).closest("section");
    expect(grid.parentElement).toHaveClass("crud-grid-stack");
    expect(grid.parentElement).toHaveClass("project-resource-grid");
    expect(within(grid.parentElement).getByRole("heading", { name: "Grade de capacitações" })).toBeInTheDocument();
    await user.click(within(grid).getByRole("button", { name: "Incluir" }));
    const dialog = screen.getByRole("dialog", { name: "Cadastrar recurso" });
    await user.selectOptions(within(dialog).getByRole("combobox", { name: "Capacitação" }), resource.capacitacao.id);
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(salvarRecurso).toHaveBeenCalledWith({ usuarioId: developer.id, capacitacaoId: resource.capacitacao.id, ativo: true }));
  });

  it("cadastra uma capacitação com nível hierárquico", async () => {
    const user = userEvent.setup();
    render(<ResourceRegistrationManagement />);
    const grid = (await screen.findByRole("heading", { name: "Grade de capacitações" })).closest("section");
    await user.click(within(grid).getByRole("button", { name: "Incluir" }));
    const dialog = screen.getByRole("dialog", { name: "Cadastrar capacitação" });
    await user.type(within(dialog).getByRole("textbox", { name: "Nome" }), "Supervisor");
    const level = within(dialog).getByRole("spinbutton", { name: /Nível hierárquico/ });
    await user.clear(level); await user.type(level, "4");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(salvarCapacitacao).toHaveBeenCalledWith(expect.objectContaining({ nome: "Supervisor", nivelHierarquico: 4, ativo: true })));
  });

  it("cadastra equipe com recursos e projetos", async () => {
    const user = userEvent.setup();
    render(<ProjectTeamManagement />);
    await screen.findByRole("heading", { name: "Cadastro de equipes" });
    await user.click(screen.getByRole("button", { name: "Incluir" }));
    const dialog = screen.getByRole("dialog", { name: "Cadastrar equipe" });
    await user.type(within(dialog).getByRole("textbox", { name: "Nome" }), "Produto");
    await user.click(within(dialog).getByRole("checkbox", { name: /Desenvolvedora/ }));
    await user.click(within(dialog).getByRole("checkbox", { name: /ORF/ }));
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(salvarEquipe).toHaveBeenCalledWith(expect.objectContaining({ nome: "Produto", recursoIds: [resource.id], projetoIds: [project.id] })));
  });
});
