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
    getBacklogCandidatosPai,
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
    getBacklogCandidatosPai: vi.fn(),
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
const nestedParent = {
    id: "i3",
    chave: "ORF-3",
    titulo: "Implementar tela",
    paiId: "i1",
    nivel: 1,
    trilha: "ORF-1 — Implementar autenticacao › ORF-3 — Implementar tela"
};

const backlogPage = (items = [item, secondItem], permissoes = { podeCriar: true, podePriorizar: true }) => ({
    items,
    total: items.length,
    pagina: 1,
    limite: 5,
    totalPaginas: items.length ? 1 : 0,
    backlogVersao: 7,
    permissoes
});

const renderBacklog = (entry = "/hub/projetos/backlog-de-demandas", props = {}) => render(
    <MemoryRouter initialEntries={[entry]}>
        <BacklogManagement {...props} />
    </MemoryRouter>
);

beforeEach(() => {
    getBacklogProjetos.mockResolvedValue([project]);
    getBacklogResponsaveis.mockResolvedValue([responsible]);
    getBacklogCandidatosPai.mockResolvedValue([
        { id: item.id, chave: item.chave, titulo: item.titulo, paiId: null, nivel: 0, trilha: `${item.chave} — ${item.titulo}` },
        nestedParent
    ]);
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

    it("carrega candidatos fora da lista e permite selecionar um item hierárquico como pai", async () => {
        const user = userEvent.setup();
        getBacklogItens.mockResolvedValue(backlogPage([item]));
        renderBacklog();
        await screen.findByRole("row", { name: /ORF-1/ });

        await user.click(screen.getByRole("button", { name: "Incluir demanda" }));
        const dialog = screen.getByRole("dialog", { name: "Formulário da demanda" });
        const parentSelect = await within(dialog).findByRole("combobox", { name: "Item pai" });
        await waitFor(() => expect(parentSelect).toBeEnabled());
        expect(getBacklogCandidatosPai).toHaveBeenCalledWith("p1", undefined);
        expect(within(parentSelect).getByRole("option", { name: nestedParent.trilha })).toBeInTheDocument();

        await user.type(within(dialog).getByRole("textbox", { name: "Título" }), "Nova subtarefa");
        await user.selectOptions(parentSelect, nestedParent.id);
        await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

        await waitFor(() => expect(createBacklogItem).toHaveBeenCalledWith(
            expect.objectContaining({ projetoId: "p1", paiId: nestedParent.id })
        ));
    });

    it("bloqueia o salvamento e permite repetir quando os candidatos a pai falham", async () => {
        const user = userEvent.setup();
        getBacklogCandidatosPai
            .mockRejectedValueOnce(new Error("Não foi possível carregar os itens disponíveis como pai."))
            .mockResolvedValueOnce([nestedParent]);
        renderBacklog();
        await screen.findByRole("row", { name: /ORF-1/ });

        await user.click(screen.getByRole("button", { name: "Incluir demanda" }));
        const dialog = screen.getByRole("dialog", { name: "Formulário da demanda" });
        expect(await within(dialog).findByRole("alert")).toHaveTextContent(
            "Não foi possível carregar os itens disponíveis como pai."
        );
        expect(within(dialog).getByRole("button", { name: "Salvar" })).toBeDisabled();

        await user.click(within(dialog).getByRole("button", { name: "Tentar novamente" }));
        await waitFor(() => expect(within(dialog).getByRole("combobox", { name: "Item pai" })).toBeEnabled());
        expect(getBacklogCandidatosPai).toHaveBeenCalledTimes(2);
    });

    it("abre a demanda em modo somente leitura", async () => {
        const user = userEvent.setup();
        renderBacklog();
        await user.click(await screen.findByRole("button", { name: "Implementar autenticacao" }));

        await waitFor(() => expect(getBacklogItem).toHaveBeenCalledWith("i1"));
        await waitFor(() => expect(getBacklogCandidatosPai).toHaveBeenCalledWith("p1", "i1"));
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

    const paginarNoServidor = (itens) => async ({ pagina = 1, limite }) => ({
        ...backlogPage(itens.slice((pagina - 1) * limite, pagina * limite)),
        pagina,
        limite,
        total: itens.length,
        totalPaginas: Math.ceil(itens.length / limite)
    });
    const demandas = (quantidade) => Array.from({ length: quantidade }, (_, index) => ({
        ...item,
        id: `d${index + 1}`,
        chave: `ORF-${index + 1}`,
        titulo: `Demanda ${index + 1}`,
        ordemBacklog: index + 1
    }));

    it("pagina o backlog de cinco em cinco e prioriza entre paginas acompanhando a demanda", async () => {
        const user = userEvent.setup();
        getBacklogItens.mockImplementation(paginarNoServidor(demandas(7)));
        renderBacklog();

        expect(await screen.findByRole("row", { name: /ORF-5, Demanda 5/ })).toBeInTheDocument();
        expect(getBacklogItens).toHaveBeenCalledWith(expect.objectContaining({ pagina: 1, limite: 5 }));
        expect(screen.queryByRole("row", { name: /ORF-6/ })).not.toBeInTheDocument();
        expect(screen.getByText("7 demanda(s) · Página 1 de 2")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Próxima" }));
        const sexta = await screen.findByRole("row", { name: /ORF-6, Demanda 6/ });
        const subir = within(sexta).getByRole("button", { name: "Subir uma posição: ORF-6" });
        expect(subir).toBeEnabled();
        await user.click(subir);

        await waitFor(() => expect(moverBacklogItem).toHaveBeenCalledWith({ itemId: "d6", backlogVersao: 7, direcao: "SUBIR" }));
        await waitFor(() => expect(getBacklogItens).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 1, limite: 5 })));
    });

    it("volta para a ultima pagina valida quando a pagina atual fica vazia", async () => {
        const user = userEvent.setup();
        getBacklogItens.mockImplementation(paginarNoServidor(demandas(6)));
        renderBacklog();
        await screen.findByRole("row", { name: /ORF-1, Demanda 1/ });

        getBacklogItens.mockImplementation(paginarNoServidor(demandas(5)));
        await user.click(screen.getByRole("button", { name: "Próxima" }));

        await waitFor(() => expect(getBacklogItens).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 1 })));
        expect(await screen.findByRole("row", { name: /ORF-5, Demanda 5/ })).toBeInTheDocument();
    });

    it("agrupa o backlog inteiro no servidor, pagina de cinco em cinco e mostra os totais reais", async () => {
        const user = userEvent.setup();
        const agrupadas = [
            ...demandas(6).map((demanda) => ({ ...demanda, status: "ABERTO" })),
            { ...item, id: "d7", chave: "ORF-7", titulo: "Demanda 7", status: "EM_ANDAMENTO", ordemBacklog: 7 }
        ];
        getBacklogItens.mockImplementation(async (filtro) => ({
            ...await paginarNoServidor(agrupadas)(filtro),
            grupos: filtro.agruparPor === "STATUS" ? [{ valor: "ABERTO", total: 6 }, { valor: "EM_ANDAMENTO", total: 1 }] : []
        }));
        renderBacklog();
        await screen.findByRole("row", { name: /ORF-1, Demanda 1/ });

        await user.selectOptions(screen.getByRole("combobox", { name: "Agrupar" }), "status");

        await waitFor(() => expect(getBacklogItens).toHaveBeenLastCalledWith(expect.objectContaining({ agruparPor: "STATUS", pagina: 1, limite: 5 })));
        expect(await screen.findByText("Aberto · 6")).toBeInTheDocument();
        expect(screen.getByText("Para priorizar, remova os filtros e o agrupamento.")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Próxima" }));

        expect(await screen.findByText("Aberto · 6 (continuação)")).toBeInTheDocument();
        expect(screen.getByText("Em andamento · 1")).toBeInTheDocument();
        expect(getBacklogItens).toHaveBeenLastCalledWith(expect.objectContaining({ agruparPor: "STATUS", pagina: 2 }));
    });
});
