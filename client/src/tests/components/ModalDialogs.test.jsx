// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ConfirmDialog from "../../components/ConfirmDialog";
import { CrudModal, CrudModalTabPanel, CrudModalTabs } from "../../components/CrudModal";

afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
});

function ModalHarness() {
    const [open, setOpen] = useState(false);
    const fieldRef = useRef(null);
    return <><button type="button" onClick={() => setOpen(true)}>Abrir cadastro</button>{open && <CrudModal mode="create" title="Novo registro" onClose={() => setOpen(false)} onSubmit={(event) => event.preventDefault()} initialFocusRef={fieldRef} actions={<><button type="button" onClick={() => setOpen(false)}>Cancelar</button><button type="submit">Salvar</button></>}><label>Nome<input ref={fieldRef} /></label></CrudModal>}</>;
}

describe("CrudModal", () => {
    it("locks scroll, focuses the requested field, closes with Escape and restores focus", async () => {
        const user = userEvent.setup();
        render(<ModalHarness />);
        const trigger = screen.getByRole("button", { name: "Abrir cadastro" });
        await user.click(trigger);
        await waitFor(() => expect(screen.getByRole("textbox", { name: "Nome" })).toHaveFocus());
        expect(document.body).toHaveStyle({ overflow: "hidden" });
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
        expect(document.body).not.toHaveStyle({ overflow: "hidden" });
    });

    it("traps focus and submits through the shared footer", () => {
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(<CrudModal mode="edit" title="Alterar" onClose={vi.fn()} onSubmit={onSubmit} actions={<><button type="button">Cancelar</button><button type="submit">Salvar</button></>}><input aria-label="Campo" /></CrudModal>);
        const dialog = screen.getByRole("dialog");
        const close = screen.getByRole("button", { name: "Fechar" });
        const save = screen.getByRole("button", { name: "Salvar" });
        save.focus();
        fireEvent.keyDown(dialog, { key: "Tab" });
        expect(close).toHaveFocus();
        fireEvent.click(save);
        expect(onSubmit).toHaveBeenCalledOnce();
    });

    it("asks before discarding dirty changes", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(<CrudModal mode="edit" title="Alterar" dirty onClose={onClose} onSubmit={(event) => event.preventDefault()} actions={<button type="submit">Salvar</button>}><input aria-label="Nome" /></CrudModal>);
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole("alertdialog", { name: "Descartar alterações?" })).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Descartar" }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("exposes processing, general and field errors", () => {
        render(<CrudModal mode="edit" title="Alterar" processing generalError="Falha geral." onClose={vi.fn()} onSubmit={vi.fn()} actions={<button type="submit">Salvar</button>}><label>Nome<input aria-invalid="true" /><span className="form-field-error">Informe o nome.</span></label></CrudModal>);
        expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
        expect(screen.getByRole("alert")).toHaveTextContent("Falha geral.");
        expect(screen.getByRole("button", { name: "Fechar" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
        expect(screen.getByText("Informe o nome.")).toBeInTheDocument();
    });

    it("provides keyboard navigation for modal tabs", () => {
        const onChange = vi.fn();
        render(<><CrudModalTabs tabs={[{ id: "main", label: "Geral" }, { id: "access", label: "Acessos" }]} activeTab="main" onChange={onChange} /><CrudModalTabPanel active ariaLabel="Conteúdo geral">Conteúdo</CrudModalTabPanel></>);
        const general = screen.getByRole("tab", { name: "Geral" });
        fireEvent.keyDown(general, { key: "ArrowRight" });
        expect(onChange).toHaveBeenCalledWith("access");
        expect(screen.getByRole("tab", { name: "Acessos" })).toHaveFocus();
        expect(screen.getByRole("tabpanel", { name: "Conteúdo geral" })).toBeInTheDocument();
    });
});

describe("ConfirmDialog", () => {
    it("supports destructive variant, errors and Escape cancellation", () => {
        const onCancel = vi.fn();
        render(<ConfirmDialog open title="Excluir registro" message="Esta ação não pode ser desfeita." variant="destructive" error="Dependência encontrada." onCancel={onCancel} onConfirm={vi.fn()} />);
        const dialog = screen.getByRole("alertdialog", { name: "Excluir registro" });
        expect(dialog).toHaveClass("confirm-dialog--destructive");
        expect(screen.getByRole("alert")).toHaveTextContent("Dependência encontrada.");
        fireEvent.keyDown(dialog, { key: "Escape" });
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it("blocks cancellation and confirmation while processing", () => {
        const initialFocusRef = createRef();
        render(<ConfirmDialog open title="Processando" message="Aguarde." loading initialFocusRef={initialFocusRef} onCancel={vi.fn()} onConfirm={vi.fn()} />);
        expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-busy", "true");
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Processando..." })).toBeDisabled();
    });

    it("mantém a rolagem bloqueada enquanto ainda existe outro diálogo aberto", () => {
        const modal = <CrudModal mode="view" title="Registro" onClose={vi.fn()}><span>Conteúdo</span></CrudModal>;
        const { rerender, unmount } = render(<>{modal}<ConfirmDialog open title="Confirmação" message="Confirme." onCancel={vi.fn()} onConfirm={vi.fn()} /></>);

        expect(document.body).toHaveStyle({ overflow: "hidden" });
        rerender(modal);
        expect(document.body).toHaveStyle({ overflow: "hidden" });
        unmount();
        expect(document.body).not.toHaveStyle({ overflow: "hidden" });
    });
});
