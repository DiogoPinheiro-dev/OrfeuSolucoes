// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    arquivarProjeto,
    atualizarCicloProjeto,
    createProjeto,
    getProjeto,
    getProjetos,
    reativarProjeto,
    sugerirChaveProjeto,
    updateProjeto
} from "../../../../services/Projetos/ProjetoService";
import ProjectManagement from "../../../components/ProjectManagement";

vi.mock("../../../../services/Projetos/ProjetoService", () => ({
    arquivarProjeto: vi.fn(),
    atualizarCicloProjeto: vi.fn(),
    createProjeto: vi.fn(),
    getProjeto: vi.fn(),
    getProjetos: vi.fn(),
    reativarProjeto: vi.fn(),
    sugerirChaveProjeto: vi.fn(),
    updateProjeto: vi.fn()
}));

const permissions = { podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true };
const project = {
    id: "p1",
    chave: "ORF",
    nome: "Orfeu Evolucao",
    objetivo: "Evoluir o produto",
    descricao: "Projeto principal",
    metodologia: "SCRUM",
    situacao: "PLANEJADO",
    saude: "EM_DIA",
    inicioPrevistoEm: "2026-08-01",
    fimPrevistoEm: "2026-12-15",
    responsavel: { id: "u1", nome: "Gestora" },
    membros: [],
    arquivadoEm: null,
    permissoes: {
        podeVisualizar: true,
        podeAlterar: true,
        podeAlterarStatus: true,
        podeArquivar: true,
        podeReativar: false
    }
};

const page = (items = [project]) => ({
    items,
    total: items.length,
    pagina: 1,
    limite: 20,
    totalPaginas: items.length ? 1 : 0
});

beforeEach(() => {
    getProjetos.mockResolvedValue(page());
    getProjeto.mockResolvedValue(project);
    sugerirChaveProjeto.mockResolvedValue("ORF");
    createProjeto.mockResolvedValue(project);
    updateProjeto.mockResolvedValue(project);
    atualizarCicloProjeto.mockResolvedValue(project);
    arquivarProjeto.mockResolvedValue({ ...project, arquivadoEm: "2026-08-11T12:00:00.000Z" });
    reativarProjeto.mockResolvedValue(project);
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("Cadastro de projetos", () => {
    it("carrega projetos e aplica pesquisa e filtros no contrato da listagem", async () => {
        const user = userEvent.setup();
        render(<ProjectManagement permissions={permissions} />);

        expect(await screen.findByRole("cell", { name: "Orfeu Evolucao" })).toBeInTheDocument();
        await user.type(screen.getByRole("searchbox", { name: "Pesquisar" }), "evolucao");
        await waitFor(() => expect(getProjetos).toHaveBeenLastCalledWith(expect.objectContaining({ termo: "evolucao" })), { timeout: 2000 });

        await user.selectOptions(screen.getByRole("combobox", { name: "Metodologia" }), "KANBAN");
        await waitFor(() => expect(getProjetos).toHaveBeenLastCalledWith(expect.objectContaining({ metodologia: "KANBAN" })));
        await user.click(screen.getByRole("checkbox", { name: "Incluir arquivados" }));
        await waitFor(() => expect(getProjetos).toHaveBeenLastCalledWith(expect.objectContaining({ incluirArquivados: true })));
    });

    it("exibe falha da listagem e permite tentar novamente", async () => {
        const user = userEvent.setup();
        getProjetos.mockRejectedValueOnce(new Error("Projetos indisponiveis."));
        render(<ProjectManagement permissions={permissions} />);

        expect(await screen.findByRole("alert")).toHaveTextContent("Projetos indisponiveis.");
        await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
        expect(await screen.findByRole("cell", { name: "Orfeu Evolucao" })).toBeInTheDocument();
        expect(getProjetos.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("valida campos locais e cria projeto com dados normalizados", async () => {
        const user = userEvent.setup();
        render(<ProjectManagement permissions={permissions} />);
        await screen.findByRole("cell", { name: "Orfeu Evolucao" });

        await user.click(screen.getByRole("button", { name: "Incluir" }));
        const dialog = screen.getByRole("dialog", { name: "Cadastrar projeto" });
        await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
        expect(await within(dialog).findByText("Preencha o nome do projeto.")).toBeInTheDocument();
        expect(within(dialog).getByText("Preencha a chave do projeto.")).toBeInTheDocument();

        await user.type(within(dialog).getByRole("textbox", { name: /Nome/ }), "Novo Projeto");
        await user.click(within(dialog).getByRole("button", { name: "Sugerir" }));
        await waitFor(() => expect(sugerirChaveProjeto).toHaveBeenCalledWith("Novo Projeto"));
        await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

        await waitFor(() => expect(createProjeto).toHaveBeenCalledWith(expect.objectContaining({
            chave: "ORF",
            nome: "Novo Projeto",
            metodologia: "SCRUM",
            situacao: "RASCUNHO",
            saude: "EM_DIA"
        })));
        expect(await screen.findByRole("status")).toHaveTextContent("Projeto criado com sucesso.");
    });

    it("abre visualizacao somente leitura com os dados completos", async () => {
        const user = userEvent.setup();
        render(<ProjectManagement permissions={permissions} />);
        await user.click(await screen.findByRole("cell", { name: "Orfeu Evolucao" }));
        await user.click(screen.getByRole("button", { name: "Visualizar" }));

        await waitFor(() => expect(getProjeto).toHaveBeenCalledWith("p1"));
        const dialog = await screen.findByRole("dialog", { name: "Visualizar projeto" });
        expect(within(dialog).getByRole("textbox", { name: /Nome/ })).toBeDisabled();
        expect(within(dialog).queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
    });

    it("confirma arquivamento e permite alterar o ciclo autorizado", async () => {
        const user = userEvent.setup();
        render(<ProjectManagement permissions={permissions} />);
        await user.click(await screen.findByRole("cell", { name: "Orfeu Evolucao" }));

        await user.click(screen.getByRole("button", { name: "Alterar ciclo" }));
        const cycleDialog = screen.getByRole("dialog", { name: "Ciclo de ORF" });
        await user.selectOptions(within(cycleDialog).getByRole("combobox", { name: "Status" }), "EM_ANDAMENTO");
        await user.selectOptions(within(cycleDialog).getByRole("combobox", { name: /Sa/ }), "EM_RISCO");
        await user.click(within(cycleDialog).getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(atualizarCicloProjeto).toHaveBeenCalledWith({ projetoId: "p1", situacao: "EM_ANDAMENTO", saude: "EM_RISCO" }));

        await user.click(screen.getByRole("cell", { name: "Orfeu Evolucao" }));
        await user.click(screen.getByRole("button", { name: "Arquivar" }));
        const archiveDialog = screen.getByRole("dialog", { name: "Confirmar arquivamento do projeto" });
        await user.click(within(archiveDialog).getByRole("button", { name: "Arquivar" }));
        await waitFor(() => expect(arquivarProjeto).toHaveBeenCalledWith("p1"));
    });
});
