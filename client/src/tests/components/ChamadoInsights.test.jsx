// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    downloadChamadoRelatorio,
    getAtendentesDisponiveis,
    getCategoriasChamado,
    getChamadoDashboard,
    getChamadoNotificacoes,
    getChamadoRelatorio,
    getPrioridadesChamado,
    marcarChamadoNotificacaoComoLida,
    marcarTodasChamadoNotificacoesComoLidas
} from "../../../services/Chamados/ChamadoService";
import ChamadoDashboard from "../../components/ChamadoDashboard";
import ChamadoNotifications from "../../components/ChamadoNotifications";
import ChamadoRelatorio from "../../components/ChamadoRelatorio";

vi.mock("../../../services/Chamados/ChamadoService", () => ({
    downloadChamadoRelatorio: vi.fn(),
    getAtendentesDisponiveis: vi.fn(),
    getCategoriasChamado: vi.fn(),
    getChamadoDashboard: vi.fn(),
    getChamadoNotificacoes: vi.fn(),
    getChamadoRelatorio: vi.fn(),
    getPrioridadesChamado: vi.fn(),
    marcarChamadoNotificacaoComoLida: vi.fn(),
    marcarTodasChamadoNotificacoesComoLidas: vi.fn()
}));

const dashboard = {
    totalAbertos: 8,
    emAtendimento: 3,
    pendentes: 2,
    resolvidos: 12,
    arquivados: 4,
    atrasados: 1,
    tempoMedioPrimeiraRespostaMinutos: 45,
    tempoMedioResolucaoMinutos: 180,
    porPrioridade: [{ chave: "alta", nome: "Alta", total: 5, cor: "#f00" }],
    porCategoria: [],
    porAtendente: [{ chave: "u1", nome: "Atendente", total: 3 }]
};

const reportItem = {
    id: "ch-1",
    numero: 101,
    titulo: "Falha no faturamento",
    solicitante: "Solicitante",
    status: "EM_ATENDIMENTO",
    slaStatus: "NO_PRAZO",
    prioridade: "Alta",
    categoria: "Financeiro",
    atendente: "Atendente",
    criadoEm: "2026-08-11T12:00:00.000Z",
    tempoPrimeiraRespostaMinutos: 30,
    tempoResolucaoMinutos: 120
};

function LocationProbe() {
    const location = useLocation();
    return <output aria-label="Rota atual">{location.pathname}</output>;
}

beforeEach(() => {
    getChamadoDashboard.mockResolvedValue(dashboard);
    getCategoriasChamado.mockResolvedValue([{ id: 3, nome: "Financeiro" }]);
    getPrioridadesChamado.mockResolvedValue([{ id: 2, nome: "Alta" }]);
    getAtendentesDisponiveis.mockResolvedValue([{ id: "u1", nome: "Atendente" }]);
    getChamadoRelatorio.mockResolvedValue({ items: [reportItem], total: 1, page: 1, totalPages: 1 });
    downloadChamadoRelatorio.mockResolvedValue(undefined);
    getChamadoNotificacoes.mockResolvedValue({
        naoLidas: 1,
        items: [{
            id: "n1",
            chamadoId: "ch-1",
            titulo: "Chamado atualizado",
            mensagem: "O status foi alterado.",
            criadoEm: "2026-08-11T12:00:00.000Z",
            lidaEm: null
        }]
    });
    marcarChamadoNotificacaoComoLida.mockResolvedValue(undefined);
    marcarTodasChamadoNotificacoesComoLidas.mockResolvedValue(undefined);
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
});

describe("Indicadores e relatorios do Controle de Chamados", () => {
    it("apresenta metricas, duracoes e rankings do dashboard", async () => {
        render(<ChamadoDashboard />);

        expect(await screen.findByRole("heading", { name: "Dashboard de chamados" })).toBeInTheDocument();
        expect(screen.getByText("8")).toBeInTheDocument();
        expect(screen.getByText("45 min")).toBeInTheDocument();
        expect(screen.getByText("3.0 h")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Chamados por prioridade" })).toBeInTheDocument();
        expect(screen.getByText("Nenhum chamado para exibir.")).toBeInTheDocument();
    });

    it("expõe falha do dashboard e permite tentar novamente", async () => {
        const user = userEvent.setup();
        getChamadoDashboard.mockRejectedValueOnce(new Error("Dashboard indisponivel."));
        render(<ChamadoDashboard />);

        expect(await screen.findByRole("alert")).toHaveTextContent("Dashboard indisponivel.");
        await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
        expect(await screen.findByRole("heading", { name: "Dashboard de chamados" })).toBeInTheDocument();
        expect(getChamadoDashboard.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("carrega o relatorio, converte filtros e exporta o resultado", async () => {
        const user = userEvent.setup();
        render(<ChamadoRelatorio />);

        expect(await screen.findByText("Falha no faturamento")).toBeInTheDocument();
        await user.selectOptions(screen.getByRole("combobox", { name: "Categoria" }), "3");
        await user.selectOptions(screen.getByRole("combobox", { name: "Prioridade" }), "2");
        await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "EM_ATENDIMENTO");
        await user.click(screen.getByRole("button", { name: "Consultar" }));

        await waitFor(() => expect(getChamadoRelatorio).toHaveBeenLastCalledWith(expect.objectContaining({
            categoriaId: 3,
            prioridadeId: 2,
            status: "EM_ATENDIMENTO",
            page: 1,
            pageSize: 25
        })));
        await user.click(screen.getByRole("button", { name: "CSV" }));
        await waitFor(() => expect(downloadChamadoRelatorio).toHaveBeenCalledWith(expect.objectContaining({ categoriaId: 3 }), "csv"));
    });

    it("mantem filtros disponiveis quando o relatorio falha", async () => {
        getChamadoRelatorio.mockRejectedValueOnce(new Error("Relatorio indisponivel."));
        render(<ChamadoRelatorio />);

        expect(await screen.findByRole("alert")).toHaveTextContent("Relatorio indisponivel.");
        expect(screen.getByRole("button", { name: "Consultar" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "CSV" })).toBeEnabled();
    });
});

describe("Notificacoes do Controle de Chamados", () => {
    it("marca a notificacao como lida e navega ao chamado", async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter initialEntries={["/hub"]}>
                <ChamadoNotifications />
                <LocationProbe />
            </MemoryRouter>
        );

        const trigger = await screen.findByRole("button", { name: "Notificações de chamados. 1 não lidas" });
        await user.click(trigger);
        await user.click(await screen.findByRole("button", { name: /Chamado atualizado/ }));

        await waitFor(() => expect(marcarChamadoNotificacaoComoLida).toHaveBeenCalledWith("n1"));
        await waitFor(() => {
            expect(screen.getByRole("status", { name: "Rota atual" }))
                .toHaveTextContent("/hub/controle-de-chamados/painel-atendimento/ch-1");
        });
    });

    it("marca todas como lidas e trata falha de carregamento como estado vazio", async () => {
        const user = userEvent.setup();
        const view = render(<MemoryRouter><ChamadoNotifications /></MemoryRouter>);

        await user.click(await screen.findByRole("button", { name: "Notificações de chamados. 1 não lidas" }));
        await user.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));
        await waitFor(() => expect(marcarTodasChamadoNotificacoesComoLidas).toHaveBeenCalledTimes(1));
        expect(screen.getByRole("button", { name: "Notificações de chamados. 0 não lidas" })).toBeInTheDocument();
        view.unmount();

        getChamadoNotificacoes.mockRejectedValue(new Error("Notificacoes indisponiveis."));
        render(<MemoryRouter><ChamadoNotifications /></MemoryRouter>);
        await user.click(await screen.findByRole("button", { name: "Notificações de chamados. 0 não lidas" }));
        expect(screen.getByText("Nenhuma notificação.")).toBeInTheDocument();
    });
});
