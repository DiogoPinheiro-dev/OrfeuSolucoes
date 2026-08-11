// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    alterarStatusBacklogItem,
    arquivarBacklogItem,
    createBacklogItem,
    getBacklogItem,
    getBacklogItens,
    getBacklogProjetos,
    getBacklogResponsaveis,
    moverBacklogItem,
    reativarBacklogItem,
    updateBacklogItem
} from "../../../../services/Projetos/BacklogService";
import BacklogManagement from "../../../components/BacklogManagement";

vi.mock("../../../../services/Projetos/BacklogService", () => ({
    alterarStatusBacklogItem: vi.fn(),
    arquivarBacklogItem: vi.fn(),
    createBacklogItem: vi.fn(),
    getBacklogItem: vi.fn(),
    getBacklogItens: vi.fn(),
    getBacklogProjetos: vi.fn(),
    getBacklogResponsaveis: vi.fn(),
    moverBacklogItem: vi.fn(),
    reativarBacklogItem: vi.fn(),
    updateBacklogItem: vi.fn()
}));

const project = { id: "p1", chave: "ORF", nome: "Orfeu Evolucao", arquivadoEm: null };
const responsible = { id: "u1", nome: "Atendente" };
const item = {
    id: "i1",
    projetoId: "p1",
    chave: "ORF-1",
    titulo: "Implementar autenticacao",
    descricao: "Proteger o acesso",
    tipo: "HISTORIA",
    prioridade: "ALTA",
    status: "ABERTO",
    responsavelId: "u1",
    responsavel: responsible,
    paiId: null,
    inicioPrevistoEm: null,
    fimPrevistoEm: null,
    estimativaMinutos: 120,
    ordemBacklog: 1,
    versao: 3,
    arquivadoEm: null,
    permissoes: { podeAlterar: true, podeArquivar: true, podeReativar: false }
};
const secondItem = { ...item, id: "i2", chave: "ORF-2", titulo: "Revisar permissoes", ordemBacklog: 2, versao: 1 };

const backlogPage = (items = [item, secondItem], permissoes = { podeCriar: true, podePriorizar: true }) => ({
    items,
    total: items.length,
    pagina: 1,
    limite: 100,
    totalPaginas: items.length ? 1 : 0,
    backlogVersao: 7,
    permissoes
});

const renderBacklog = (entry = "/hub/projetos/backlog-de-demandas") => render(
    <MemoryRouter initialEntries={[entry]}>
        <BacklogManagement />
    </MemoryRouter>
);

beforeEach(() => {
    getBacklogProjetos.mockResolvedValue([project]);
    getBacklogResponsaveis.mockResolvedValue([responsible]);
    getBacklogItens.mockResolvedValue(backlogPage());
    getBacklogItem.mockResolvedValue(item);
    createBacklogItem.mockResolvedValue(item);
    updateBacklogItem.mockResolvedValue(item);
    alterarStatusBacklogItem.mockResolvedValue(item);
    arquivarBacklogItem.mockResolvedValue({ ...item, arquivadoEm: "2026-08-11T12:00:00.000Z" });
    reativarBacklogItem.mockResolvedValue(item);
    moverBacklogItem.mockResolvedValue({ backlogVersao: 8 });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("Backlog de demandas", () => {
    it("carrega o projeto, responsaveis e aplica filtros ao backlog", async () => {
        const user = userEvent.setup();
        renderBacklog();

        expect(await screen.findByRole("row", { name: /ORF-1, Implementar autenticacao/ })).toBeInTheDocument();
        expect(getBacklogResponsaveis).toHaveBeenCalledWith("p1");
        await user.type(screen.getByRole("searchbox", { name: "Pesquisar" }), "autenticacao");
        await waitFor(() => expect(getBacklogItens).toHaveBeenLastCalledWith(expect.objectContaining({ termo: "autenticacao" })), { timeout: 2000 });
        await user.selectOptions(screen.getByRole("combobox", { name: "Prioridade" }), "ALTA");
        await waitFor(() => expect(getBacklogItens).toHaveBeenLastCalledWith(expect.objectContaining({ prioridade: "ALTA" })));
        await user.selectOptions(screen.getByRole("combobox", { name: /Respons/ }), "u1");
        await waitFor(() => expect(getBacklogItens).toHaveBeenLastCalledWith(expect.objectContaining({ responsavelId: "u1" })));
    });

    it("cria demanda com campos opcionais normalizados", async () => {
        const user = userEvent.setup();
        renderBacklog();
        await screen.findByRole("row", { name: /ORF-1/ });

        await user.click(screen.getByRole("button", { name: "Incluir demanda" }));
        const dialog = screen.getByRole("dialog", { name: /Formul/ });
        const save = within(dialog).getByRole("button", { name: "Salvar" });
        expect(save).toBeDisabled();
        await user.type(within(dialog).getByRole("textbox", { name: /T/ }), "Nova demanda");
        await user.selectOptions(within(dialog).getByRole("combobox", { name: /Respons/ }), "u1");
        await user.type(within(dialog).getByRole("spinbutton", { name: /Estimativa/ }), "90");
        await user.click(save);

        await waitFor(() => expect(createBacklogItem).toHaveBeenCalledWith(expect.objectContaining({
            projetoId: "p1",
            titulo: "Nova demanda",
            descricao: null,
            responsavelId: "u1",
            estimativaMinutos: 90,
            tipo: "TAREFA",
            status: "ABERTO"
        })));
        expect(await screen.findByRole("status")).toHaveTextContent("Demanda criada com sucesso.");
    });

    it("abre a demanda em modo somente leitura", async () => {
        const user = userEvent.setup();
        renderBacklog();
        await user.click(await screen.findByRole("button", { name: "Implementar autenticacao" }));

        await waitFor(() => expect(getBacklogItem).toHaveBeenCalledWith("i1"));
        const dialog = await screen.findByRole("dialog", { name: "Detalhes da demanda" });
        expect(within(dialog).getByRole("textbox", { name: /T/ })).toBeDisabled();
        expect(within(dialog).queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
    });

    it("prioriza somente com o backlog completo e restaura a ordem quando falha", async () => {
        const user = userEvent.setup();
        moverBacklogItem.mockRejectedValueOnce(new Error("Conflito de versao."));
        renderBacklog();
        const row = await screen.findByRole("row", { name: /ORF-2, Revisar permissoes/ });
        await user.click(within(row).getByRole("button", { name: /Mover para o topo/ }));

        await waitFor(() => expect(moverBacklogItem).toHaveBeenCalledWith({ itemId: "i2", backlogVersao: 7, direcao: "TOPO" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Conflito de versao. A ordem exibida foi restaurada.");
        expect(screen.getAllByRole("row")[1]).toHaveAccessibleName(/ORF-1/);
    });

    it("confirma o arquivamento e bloqueia mutacoes em projeto arquivado", async () => {
        const user = userEvent.setup();
        const view = renderBacklog();
        await user.click(await screen.findByRole("row", { name: /ORF-1, Implementar autenticacao/ }));
        await user.click(screen.getByRole("button", { name: "Arquivar demanda selecionada" }));
        const confirmation = screen.getByRole("alertdialog", { name: "Arquivar demanda" });
        await user.click(within(confirmation).getByRole("button", { name: "Arquivar" }));
        await waitFor(() => expect(arquivarBacklogItem).toHaveBeenCalledWith({ id: "i1", versao: 3 }));
        view.unmount();

        getBacklogProjetos.mockResolvedValue([{ ...project, arquivadoEm: "2026-08-11T12:00:00.000Z" }]);
        renderBacklog();
        expect(await screen.findByRole("status")).toHaveTextContent("Projeto arquivado");
        expect(screen.getByRole("button", { name: "Incluir demanda" })).toBeDisabled();
    });
});
