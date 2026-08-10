// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import CrudGrid from "../../components/CrudGrid";

const columns = [{ key: "nome", label: "Nome" }];
const rows = [
    { id: "1", nome: "Alpha" },
    { id: "2", nome: "Beta" },
    { id: "3", nome: "Gamma" },
    { id: "4", nome: "Delta" }
];

const baseProps = {
    title: "Registros", columns, rows,
    onCreate: vi.fn(), onEdit: vi.fn(), onView: vi.fn(), onDelete: vi.fn(),
    onSelect: vi.fn(), onToggleSelect: vi.fn(), onToggleSelectAll: vi.fn()
};

afterEach(cleanup);

describe("CrudGrid", () => {
    it("renders header, search, filters and the standard action order", async () => {
        const user = userEvent.setup();
        const onSearchChange = vi.fn();
        render(<CrudGrid {...baseProps} onSearchChange={onSearchChange} filters={<label>Status<select aria-label="Status"><option>Ativos</option></select></label>} />);
        await user.type(screen.getByRole("searchbox", { name: "Pesquisar" }), "abc");
        expect(onSearchChange).toHaveBeenLastCalledWith("c");
        expect(screen.getByRole("combobox", { name: "Status" })).toBeInTheDocument();
        const toolbarButtons = within(screen.getByRole("toolbar", { name: "Ações do cadastro" })).getAllByRole("button");
        expect(toolbarButtons.map((button) => button.getAttribute("aria-label").split(".")[0])).toEqual(["Incluir", "Alterar", "Visualizar", "Excluir selecionados"]);
    });

    it("keeps row selection separate from deletion checkboxes", async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        const onToggleSelect = vi.fn();
        const onToggleSelectAll = vi.fn();
        render(<CrudGrid {...baseProps} onSelect={onSelect} onToggleSelect={onToggleSelect} onToggleSelectAll={onToggleSelectAll} isRowSelectable={(row) => row.id !== "2"} />);
        await user.click(screen.getByText("Alpha"));
        expect(onSelect).toHaveBeenCalledWith("1");
        expect(onToggleSelect).not.toHaveBeenCalled();
        await user.click(screen.getByRole("checkbox", { name: "Selecionar Alpha" }));
        expect(onToggleSelect).toHaveBeenCalledWith("1");
        await user.click(screen.getAllByRole("checkbox")[0]);
        expect(onToggleSelectAll).toHaveBeenCalledWith(true, [rows[0], rows[2], rows[3]]);
    });

    it("announces loading, error and empty states and allows retry", async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();
        const { rerender } = render(<CrudGrid {...baseProps} rows={[]} busy error="Falha ao carregar." onRetry={onRetry} emptyMessage="Sem resultados." />);
        expect(screen.getByRole("status")).toHaveTextContent("Processando...");
        expect(screen.getByRole("alert")).toHaveTextContent("Falha ao carregar.");
        expect(screen.getByText("Sem resultados.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeDisabled();
        rerender(<CrudGrid {...baseProps} rows={[]} error="Falha ao carregar." onRetry={onRetry} />);
        await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it("supports local, server and custom pagination", async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        const { rerender } = render(<CrudGrid {...baseProps} paginationConfig={{ mode: "local", page: 2, pageSize: 2, onPageChange }} />);
        expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
        expect(screen.getByText("Gamma")).toBeInTheDocument();
        expect(screen.getByText(/Página 2 de 2/)).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Anterior" }));
        expect(onPageChange).toHaveBeenCalledWith(1);
        rerender(<CrudGrid {...baseProps} rows={rows.slice(0, 2)} paginationConfig={{ mode: "server", page: 1, pageSize: 2, totalItems: 8, onPageChange }} />);
        expect(screen.getByText(/Página 1 de 4/)).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Próxima" }));
        expect(onPageChange).toHaveBeenCalledWith(2);
        rerender(<CrudGrid {...baseProps} pagination={<span>Paginação legada</span>} paginationConfig={{ mode: "local", page: 2, pageSize: 2, onPageChange }} />);
        expect(screen.getByText("Paginação legada")).toBeInTheDocument();
        expect(screen.getByText("Alpha")).toBeInTheDocument();
    });

    it("supports row navigation, viewing and deletion selection by keyboard", () => {
        const onSelect = vi.fn();
        const onView = vi.fn();
        const onToggleSelect = vi.fn();
        render(<CrudGrid {...baseProps} onSelect={onSelect} onView={onView} onToggleSelect={onToggleSelect} />);
        const alphaRow = screen.getByText("Alpha").closest("tr");
        const betaRow = screen.getByText("Beta").closest("tr");
        alphaRow.focus();
        fireEvent.keyDown(alphaRow, { key: "ArrowDown" });
        expect(betaRow).toHaveFocus();
        fireEvent.keyDown(betaRow, { key: "Enter" });
        expect(onSelect).toHaveBeenCalledWith("2");
        expect(onView).toHaveBeenCalledWith(rows[1]);
        fireEvent.keyDown(betaRow, { key: " " });
        expect(onToggleSelect).toHaveBeenCalledWith("2");
    });

    it("explains disabled actions and applies compact mode", () => {
        const { container } = render(<CrudGrid {...baseProps} compact canCreate={false} disabledReasons={{ create: "Cadastro bloqueado." }} />);
        expect(screen.getByRole("button", { name: "Incluir. Indisponível: Cadastro bloqueado." })).toBeDisabled();
        expect(screen.getByRole("button", { name: /Alterar\. Indisponível: Selecione um registro/ })).toBeDisabled();
        expect(container.querySelector(".crud-shell--compact")).toBeInTheDocument();
    });
});
