// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getBacklogProjetos } from "../../../../services/Projetos/BacklogService";
import {
    archiveEntrega,
    archiveMarco,
    createEntrega,
    createMarco,
    getMarcoEntregaPainel,
    updateEntrega,
    updateMarco
} from "../../../../services/Projetos/MarcoEntregaService";
import {
    addSprintItem,
    cancelSprint,
    completeSprint,
    createSprint,
    getSprintPainel,
    removeSprintItem,
    startSprint,
    updateSprint
} from "../../../../services/Projetos/SprintService";
import MarcoEntregaManagement from "../../../components/MarcoEntregaManagement";
import SprintManagement from "../../../components/SprintManagement";

vi.mock("../../../../services/Projetos/BacklogService", () => ({ getBacklogProjetos: vi.fn() }));
vi.mock("../../../../services/Projetos/MarcoEntregaService", () => ({
    archiveEntrega: vi.fn(), archiveMarco: vi.fn(), createEntrega: vi.fn(), createMarco: vi.fn(),
    getMarcoEntregaPainel: vi.fn(), updateEntrega: vi.fn(), updateMarco: vi.fn()
}));
vi.mock("../../../../services/Projetos/SprintService", () => ({
    addSprintItem: vi.fn(), cancelSprint: vi.fn(), completeSprint: vi.fn(), createSprint: vi.fn(),
    getSprintPainel: vi.fn(), removeSprintItem: vi.fn(), startSprint: vi.fn(), updateSprint: vi.fn()
}));

const project = { id: "p1", chave: "ORF", nome: "Orfeu Evolucao", arquivadoEm: null };
const backlogItem = { id: "i1", chave: "ORF-1", titulo: "Implementar autenticacao", status: "ABERTO", prioridade: "ALTA", estimativaMinutos: 120 };
const sprintItem = { ...backlogItem, itemId: "i1", vinculoId: "v1", retiradoEm: null, adicionadoAposInicio: false };
const sprint = {
    id: "s1", nome: "Sprint 1", objetivo: "Entregar autenticacao", status: "PLANEJADA", versao: 2,
    inicioPrevistoEm: "2026-08-11", fimPrevistoEm: "2026-08-22", itens: [sprintItem],
    totalItens: 1, totalConcluidos: 0, progressoPercentual: 0,
    escopoInicialItens: 1, itensAdicionadosAposInicio: 0, itensRetiradosAposInicio: 0
};
const sprintPanel = {
    planejadas: [sprint], ativa: null, historico: [], candidatos: [{ ...backlogItem, id: "i2", chave: "ORF-2", titulo: "Revisar permissoes" }],
    permissoes: { podeCriar: true, podeEditar: true, podeIniciar: true, podeCancelar: true, podePlanejar: true, podeConcluir: true }
};

const responsible = { id: "u1", nome: "Gestora" };
const marco = {
    id: "m1", nome: "MVP", descricao: "Primeira entrega", responsavelId: "u1", responsavel: responsible,
    status: "PLANEJADO", dataPrevistaEm: "2026-09-01", dataRealizadaEm: null, itens: [backlogItem],
    progressoPercentual: 25, itensSemEstimativa: 0, atrasado: false, versao: 1, arquivadoEm: null
};
const entrega = {
    id: "e1", nome: "Portal publicado", resultadoEsperado: "Portal disponivel", criteriosAceite: "Acesso validado",
    responsavelId: "u1", responsavel: responsible, status: "PLANEJADA", inicioPrevistoEm: "2026-08-15",
    fimPrevistoEm: "2026-09-15", concluidaEm: null, marcoId: "m1", marcoNome: "MVP", itens: [],
    progressoPercentual: 0, itensSemEstimativa: 0, atrasada: false, versao: 1, arquivadoEm: null
};
const commitmentPanel = {
    marcos: [marco], entregas: [entrega], itensDisponiveis: [backlogItem], responsaveis: [responsible],
    permissoes: { podeCriar: true, podeEditar: true, podeArquivar: true, podeReativar: true }
};

const renderWithRouter = (component) => render(<MemoryRouter>{component}</MemoryRouter>);

beforeEach(() => {
    getBacklogProjetos.mockResolvedValue([project]);
    getSprintPainel.mockResolvedValue(sprintPanel);
    createSprint.mockResolvedValue(sprint);
    updateSprint.mockResolvedValue(sprint);
    addSprintItem.mockResolvedValue(sprint);
    removeSprintItem.mockResolvedValue(sprint);
    startSprint.mockResolvedValue({ ...sprint, status: "ATIVA" });
    completeSprint.mockResolvedValue({ ...sprint, status: "CONCLUIDA" });
    cancelSprint.mockResolvedValue({ ...sprint, status: "CANCELADA" });
    getMarcoEntregaPainel.mockResolvedValue(commitmentPanel);
    createMarco.mockResolvedValue(marco);
    updateMarco.mockResolvedValue(marco);
    archiveMarco.mockResolvedValue({ ...marco, arquivadoEm: "2026-08-11T12:00:00.000Z" });
    createEntrega.mockResolvedValue(entrega);
    updateEntrega.mockResolvedValue(entrega);
    archiveEntrega.mockResolvedValue({ ...entrega, arquivadoEm: "2026-08-11T12:00:00.000Z" });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("Planejamento de sprints", () => {
    it("carrega o painel e cria uma sprint vinculada ao projeto", async () => {
        const user = userEvent.setup();
        renderWithRouter(<SprintManagement />);
        expect(await screen.findByRole("heading", { name: "Sprint 1" })).toBeInTheDocument();
        expect(getSprintPainel).toHaveBeenCalledWith("p1");

        await user.click(screen.getByRole("button", { name: /Nova sprint/ }));
        const dialog = screen.getByRole("dialog");
        await user.type(within(dialog).getByRole("textbox", { name: /Nome/ }), "Sprint 2");
        await user.type(within(dialog).getByLabelText(/In/), "2026-08-25");
        await user.type(within(dialog).getByLabelText(/Fim previsto/), "2026-09-05");
        await user.click(within(dialog).getByRole("button", { name: "Salvar sprint" }));

        await waitFor(() => expect(createSprint).toHaveBeenCalledWith(expect.objectContaining({
            projetoId: "p1", nome: "Sprint 2", inicioPrevistoEm: "2026-08-25", fimPrevistoEm: "2026-09-05"
        })));
        expect(await screen.findByText("Sprint criada.")).toBeInTheDocument();
    });

    it("adiciona item ao escopo e inicia sprint conforme permissoes", async () => {
        const user = userEvent.setup();
        renderWithRouter(<SprintManagement />);
        const card = (await screen.findByRole("heading", { name: "Sprint 1" })).closest("article");
        await user.selectOptions(within(card).getByRole("combobox"), "i2");
        await user.click(within(card).getByRole("button", { name: /Adicionar ao escopo/ }));
        await waitFor(() => expect(addSprintItem).toHaveBeenCalledWith({ sprintId: "s1", itemId: "i2", versao: 2 }));

        await user.click(within(card).getByRole("button", { name: /Iniciar/ }));
        await waitFor(() => expect(startSprint).toHaveBeenCalledWith({ id: "s1", versao: 2 }));
    });

    it("bloqueia criacao e planejamento quando o backend nega permissao", async () => {
        getSprintPainel.mockResolvedValue({ ...sprintPanel, permissoes: {} });
        renderWithRouter(<SprintManagement />);
        expect(await screen.findByRole("heading", { name: "Sprint 1" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Nova sprint/ })).toBeDisabled();
        expect(screen.queryByRole("button", { name: /Iniciar/ })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Adicionar ao escopo/ })).not.toBeInTheDocument();
    });
});

describe("Marcos e entregas", () => {
    it("carrega os compromissos e cria marco com item relacionado", async () => {
        const user = userEvent.setup();
        renderWithRouter(<MarcoEntregaManagement />);
        expect(await screen.findByRole("heading", { name: "MVP" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /ORF-1/ })).toHaveAttribute("href", "/hub/projetos/backlog-de-demandas?projetoId=p1&itemId=i1");

        await user.click(screen.getByRole("button", { name: "Incluir" }));
        const dialog = screen.getByRole("dialog");
        await user.type(within(dialog).getByRole("textbox", { name: /Nome/ }), "Beta publico");
        await user.selectOptions(within(dialog).getByRole("combobox", { name: /Respons/ }), "u1");
        await user.type(within(dialog).getByLabelText(/Data prevista/), "2026-10-01");
        await user.click(within(dialog).getByRole("checkbox", { name: /ORF-1/ }));
        await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

        await waitFor(() => expect(createMarco).toHaveBeenCalledWith(expect.objectContaining({
            projetoId: "p1", nome: "Beta publico", responsavelId: "u1", dataPrevistaEm: "2026-10-01", itemIds: ["i1"]
        })));
    });

    it("alterna para entregas e arquiva pelo contrato versionado", async () => {
        const user = userEvent.setup();
        renderWithRouter(<MarcoEntregaManagement />);
        await screen.findByRole("heading", { name: "MVP" });
        await user.click(screen.getByRole("button", { name: /Entregas/ }));
        const card = (await screen.findByRole("heading", { name: "Portal publicado" })).closest("article");
        await user.click(within(card).getByRole("button", { name: "Arquivar" }));
        await waitFor(() => expect(archiveEntrega).toHaveBeenCalledWith({ id: "e1", versao: 1 }, false));
    });

    it("mantem marcos e entregas somente leitura sem permissoes", async () => {
        getMarcoEntregaPainel.mockResolvedValue({ ...commitmentPanel, permissoes: {} });
        renderWithRouter(<MarcoEntregaManagement />);
        const card = (await screen.findByRole("heading", { name: "MVP" })).closest("article");
        expect(screen.getByRole("button", { name: "Incluir" })).toBeDisabled();
        expect(within(card).getByRole("button", { name: "Alterar" })).toBeDisabled();
        expect(within(card).getByRole("button", { name: "Arquivar" })).toBeDisabled();
    });
});
