// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    alterarCategoriaChamado,
    alterarPrioridadeChamado,
    alterarStatusChamado,
    arquivarChamado,
    assumirChamado,
    getAcompanhantesElegiveisChamado,
    getCategoriasChamado,
    getChamado,
    getPrioridadesChamado,
    getResponsaveisParaAberturaChamado,
    reabrirChamado,
    resolverChamado,
    responderChamado
} from "../../../services/Chamados/ChamadoService";
import ChamadoDetail from "../../components/ChamadoDetail";
import { useAuth } from "../../hooks/useAuth";
import { useHubNavigation } from "../../hooks/useHubNavigation";

vi.mock("../../../services/Chamados/ChamadoService", () => ({
    alterarCategoriaChamado: vi.fn(), alterarPrioridadeChamado: vi.fn(), alterarStatusChamado: vi.fn(),
    abrirChamadoAnexo: vi.fn(), atualizarAcompanhantesChamado: vi.fn(), arquivarChamado: vi.fn(), assumirChamado: vi.fn(),
    atribuirChamado: vi.fn(), chamadoAnexoDownloadUrl: vi.fn((url) => url || "#"), getAcompanhantesElegiveisChamado: vi.fn(),
    getCategoriasChamado: vi.fn(), getChamado: vi.fn(), getPrioridadesChamado: vi.fn(), getResponsaveisParaAberturaChamado: vi.fn(),
    liberarAtendimentoChamado: vi.fn(), reabrirChamado: vi.fn(), resolverChamado: vi.fn(), responderChamado: vi.fn(),
    transferirChamado: vi.fn(), uploadChamadoAnexos: vi.fn()
}));
vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useHubNavigation", () => ({ useHubNavigation: vi.fn() }));

const permissions = { podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true };
const chamado = {
    id: "ch-1", numero: 1, titulo: "Falha no faturamento", descricao: "Nota fiscal indisponível", status: "ABERTO",
    tipoId: 1, tipoNome: "Incidente", prioridadeId: 2, prioridadeNome: "Alta", categoriaId: 3, categoriaNome: "Financeiro",
    solucaoId: 10, solucaoNome: "Controle de Chamados", funcionalidadeId: 11, funcionalidadeNome: "Painel de atendimento",
    solicitanteId: "u1", solicitanteNome: "Solicitante", responsavelId: "admin", responsavelNome: "Administrador",
    liderAtendimentoId: null, liderAtendimentoNome: null, criadoEm: "2026-08-11T10:00:00.000Z", atualizadoEm: "2026-08-11T11:00:00.000Z",
    mensagens: [], historico: [], anexos: [], acompanhantes: [], slaTempoPausadoMinutos: 0
};

beforeEach(() => {
    useAuth.mockReturnValue({ user: { id: "admin", login: "admin", nome: "Administrador", grupo: { id: 1, nome: "Administradores" } } });
    useHubNavigation.mockReturnValue({ solutions: [] });
    getChamado.mockResolvedValue(chamado);
    getPrioridadesChamado.mockResolvedValue([{ id: 2, nome: "Alta" }, { id: 4, nome: "Urgente" }]);
    getCategoriasChamado.mockResolvedValue([{ id: 3, nome: "Financeiro" }, { id: 5, nome: "Fiscal" }]);
    getResponsaveisParaAberturaChamado.mockResolvedValue([{ id: "USUARIO:admin", tipo: "USUARIO", usuarioId: "admin", nome: "Administrador" }]);
    getAcompanhantesElegiveisChamado.mockResolvedValue([]);
    responderChamado.mockResolvedValue({ ...chamado, mensagens: [{ id: "m1", conteudo: "Resposta enviada" }] });
    assumirChamado.mockResolvedValue({ ...chamado, liderAtendimentoId: "admin", liderAtendimentoNome: "Administrador" });
    alterarStatusChamado.mockResolvedValue({ ...chamado, status: "EM_ATENDIMENTO" });
    alterarCategoriaChamado.mockResolvedValue({ ...chamado, categoriaId: 5, categoriaNome: "Fiscal" });
    alterarPrioridadeChamado.mockResolvedValue({ ...chamado, prioridadeId: 4, prioridadeNome: "Urgente" });
    resolverChamado.mockResolvedValue({ ...chamado, status: "RESOLVIDO" });
    reabrirChamado.mockResolvedValue(chamado);
    arquivarChamado.mockResolvedValue({ ...chamado, status: "ARQUIVADO" });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("Detalhe e atendimento de chamados", () => {
    it("exibe falha de carregamento e permite voltar", async () => {
        const onBack = vi.fn();
        getChamado.mockRejectedValue(new Error("Chamado indisponível."));
        render(<ChamadoDetail chamadoId="ch-1" mode="painel" permissions={permissions} onBack={onBack} />);

        expect(await screen.findByRole("alert")).toHaveTextContent("Chamado indisponível.");
        await userEvent.click(screen.getByRole("button", { name: "Voltar" }));
        expect(onBack).toHaveBeenCalledOnce();
    });

    it("valida e envia resposta pelo serviço", async () => {
        const user = userEvent.setup();
        render(<ChamadoDetail chamadoId="ch-1" mode="painel" permissions={permissions} onBack={vi.fn()} />);
        await screen.findByRole("heading", { name: "Falha no faturamento" });
        const responseForm = screen.getByRole("heading", { name: "Responder" }).closest("article").querySelector("form");

        await user.click(within(responseForm).getByRole("button", { name: "Enviar resposta" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Digite uma resposta");
        await user.type(within(responseForm).getByRole("textbox"), "Resposta enviada");
        await user.click(within(responseForm).getByRole("button", { name: "Enviar resposta" }));

        await waitFor(() => expect(responderChamado).toHaveBeenCalledWith({ chamadoId: "ch-1", conteudo: "Resposta enviada" }));
        expect(await screen.findByText("Resposta enviada")).toBeInTheDocument();
    });

    it("executa assumir, alterar status, categoria e prioridade pelos contratos corretos", async () => {
        const user = userEvent.setup();
        render(<ChamadoDetail chamadoId="ch-1" mode="painel" permissions={permissions} onBack={vi.fn()} />);
        await screen.findByRole("heading", { name: "Ações do atendimento" });

        await user.click(screen.getByRole("button", { name: "Assumir" }));
        await waitFor(() => expect(assumirChamado).toHaveBeenCalledWith("ch-1"));

        await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "EM_ATENDIMENTO");
        await user.click(screen.getByRole("button", { name: "Alterar status" }));
        await waitFor(() => expect(alterarStatusChamado).toHaveBeenCalledWith({ chamadoId: "ch-1", status: "EM_ATENDIMENTO", observacao: null }));

        await user.selectOptions(screen.getByRole("combobox", { name: "Categoria" }), "5");
        await user.click(screen.getByRole("button", { name: "Alterar categoria" }));
        await waitFor(() => expect(alterarCategoriaChamado).toHaveBeenCalledWith({ chamadoId: "ch-1", categoriaId: 5 }));

        await user.selectOptions(screen.getByRole("combobox", { name: "Prioridade" }), "4");
        await user.click(screen.getByRole("button", { name: "Alterar prioridade" }));
        await waitFor(() => expect(alterarPrioridadeChamado).toHaveBeenCalledWith({ chamadoId: "ch-1", prioridadeId: 4 }));
    }, 15000);

    it("resolve e reabre respeitando o estado retornado pelo backend", async () => {
        const user = userEvent.setup();
        render(<ChamadoDetail chamadoId="ch-1" mode="painel" permissions={permissions} onBack={vi.fn()} />);
        await screen.findByRole("heading", { name: "Ações do atendimento" });

        await user.click(screen.getByRole("button", { name: "Resolver" }));
        await waitFor(() => expect(resolverChamado).toHaveBeenCalledWith("ch-1", null));
        expect(screen.getByRole("button", { name: "Reabrir" })).toBeEnabled();
        await user.click(screen.getByRole("button", { name: "Reabrir" }));
        await waitFor(() => expect(reabrirChamado).toHaveBeenCalledWith("ch-1", null));
    });

    it("arquiva o chamado somente quando o usuário é responsável autorizado", async () => {
        const user = userEvent.setup();
        render(<ChamadoDetail chamadoId="ch-1" mode="painel" permissions={permissions} onBack={vi.fn()} />);
        await screen.findByRole("heading", { name: "Ações do atendimento" });

        expect(screen.getByRole("button", { name: "Arquivar" })).toBeEnabled();
        await user.click(screen.getByRole("button", { name: "Arquivar" }));
        await waitFor(() => expect(arquivarChamado).toHaveBeenCalledWith("ch-1", null));
        expect(screen.getByRole("button", { name: "Arquivar" })).toBeDisabled();
    });

    it("desarquiva como administrador e retorna à listagem", async () => {
        const user = userEvent.setup();
        const onBack = vi.fn();
        getChamado.mockResolvedValue({ ...chamado, status: "ARQUIVADO" });
        render(<ChamadoDetail chamadoId="ch-1" mode="arquivados" permissions={permissions} onBack={onBack} />);

        const button = await screen.findByRole("button", { name: "Desarquivar chamado" });
        expect(button).toBeEnabled();
        await user.click(button);
        await waitFor(() => expect(reabrirChamado).toHaveBeenCalledWith("ch-1", null));
        expect(onBack).toHaveBeenCalledOnce();
    });
});
