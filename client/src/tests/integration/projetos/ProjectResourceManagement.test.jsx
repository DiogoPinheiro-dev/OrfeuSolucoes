// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { excluirRecurso, getRecursos, getRecursosProjetos, salvarRecurso } from "../../../../services/Projetos/RecursoService";
import ProjectResourceManagement from "../../../components/ProjectResourceManagement";

vi.mock("../../../../services/Projetos/RecursoService", () => ({
  excluirRecurso: vi.fn(),
  getRecursos: vi.fn(),
  getRecursosProjetos: vi.fn(),
  salvarRecurso: vi.fn()
}));

vi.mock("../../../components/CrudGrid", () => ({
  default: (props) => <div>
    <h2>{props.title}</h2>
    <p>{props.emptyMessage}</p>
    <output data-testid="row-count">{props.rows.length}</output>
    <button type="button" disabled={!props.canCreate} onClick={props.onCreate}>Novo</button>
    {props.rows.map((row) => <button type="button" key={row.id} onClick={() => props.onView(row)}>Ver {row.usuario.nome}</button>)}
    {props.filters}
  </div>
}));

vi.mock("../../../components/CrudModal", () => ({
  CrudModal: ({ title, onSubmit, onClose, actions, children }) => <form aria-label={title} onSubmit={onSubmit}>
    <h3>{title}</h3>{children}{actions}<button type="button" onClick={onClose}>Fechar modal</button>
  </form>
}));

const panel = {
  candidatos: [{ id: "u1", nome: "Ana", email: "ana@example.com" }],
  recursos: [{
    id: "r1", usuarioId: "u1", versao: 2, ativo: true,
    usuario: { id: "u1", nome: "Ana", email: "ana@example.com" },
    projetos: [{ id: "v1", projetoId: "p1", ativo: true, projeto: { id: "p1", chave: "P1", nome: "Projeto 1" } }]
  }],
  permissoes: { podeIncluir: true, podeAlterar: true, podeExcluir: true }
};

describe("ProjectResourceManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRecursos.mockResolvedValue(panel);
    getRecursosProjetos.mockResolvedValue([{ id: "p1", chave: "P1", nome: "Projeto 1", arquivadoEm: null }]);
  });
  afterEach(cleanup);

  it("representa loading, sucesso, filtro e visualização somente leitura", async () => {
    const user = userEvent.setup();
    render(<ProjectResourceManagement />);

    expect(screen.getByText("Carregando recursos...")).toBeInTheDocument();
    expect(await screen.findByTestId("row-count")).toHaveTextContent("1");
    await user.selectOptions(screen.getByLabelText("Projeto"), "p1");
    expect(screen.getByTestId("row-count")).toHaveTextContent("1");
    await user.click(screen.getByRole("button", { name: "Ver Ana" }));
    expect(screen.getByRole("form", { name: "Visualizar recurso" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /P1/ })).toBeDisabled();
  });

  it("exibe erro de carregamento e impede criação sem projeto ativo", async () => {
    getRecursos.mockRejectedValue(new Error("Não foi possível carregar os recursos."));
    getRecursosProjetos.mockResolvedValue([]);
    render(<ProjectResourceManagement />);

    expect(await screen.findByText("Não foi possível carregar os recursos.")).toBeInTheDocument();
    expect(screen.getByText("Cadastre um projeto ativo antes de incluir recursos.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Novo" })).toBeDisabled();
  });

  it("cadastra recurso e atualiza a grade após a mutation", async () => {
    const user = userEvent.setup();
    getRecursos.mockResolvedValue({ ...panel, recursos: [] });
    salvarRecurso.mockImplementation(async () => {
      getRecursos.mockResolvedValue(panel);
      return { id: "r1" };
    });
    render(<ProjectResourceManagement />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Novo" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Novo" }));
    await user.click(screen.getByRole("checkbox", { name: /P1/ }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(salvarRecurso).toHaveBeenCalledWith({ usuarioId: "u1", projetoIds: ["p1"], ativo: true }));
    expect(await screen.findByText("Recurso cadastrado.")).toBeInTheDocument();
    expect(getRecursos.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId("row-count")).toHaveTextContent("1");
    expect(excluirRecurso).not.toHaveBeenCalled();
  });
});
