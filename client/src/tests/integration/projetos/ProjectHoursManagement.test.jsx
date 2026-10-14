// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    aprovarApontamentos,
    fecharCompetencia,
    getHorasDoProjeto,
    getHorasProjetos,
    reabrirApontamento,
    reabrirCompetencia,
    recalcularCustosPendentes,
    rejeitarApontamentos
} from "../../../../services/Projetos/ApontamentoService";
import ProjectHoursManagement from "../../../components/ProjectHoursManagement";

vi.mock("../../../../services/Projetos/ApontamentoService", () => ({
    aprovarApontamentos: vi.fn(),
    fecharCompetencia: vi.fn(),
    getHorasDoProjeto: vi.fn(),
    getHorasProjetos: vi.fn(),
    reabrirApontamento: vi.fn(),
    reabrirCompetencia: vi.fn(),
    recalcularCustosPendentes: vi.fn(),
    rejeitarApontamentos: vi.fn()
}));

const projeto = { id: "p1", chave: "ORF", nome: "Orfeu Evolução", situacao: "EM_ANDAMENTO", arquivadoEm: null };
const outroProjeto = { id: "p2", chave: "CRM", nome: "CRM Comercial", situacao: "PLANEJADO", arquivadoEm: null };
const arquivado = { id: "p9", chave: "ANT", nome: "Projeto antigo", situacao: "CONCLUIDO", arquivadoEm: "2026-08-01T00:00:00.000Z" };
const gestora = { id: "u1", nome: "Gestora", login: "gestora", email: "gestora@orfeu.test" };
const ana = { id: "u2", nome: "Ana Analista", login: "ana", email: "ana@orfeu.test" };
const bruno = { id: "u3", nome: "Bruno Dev", login: "bruno", email: "bruno@orfeu.test" };
const item = { id: "i1", chave: "ORF-12", titulo: "Tela de login" };
const acoes = (overrides = {}) => ({ podeAprovar: false, podeRejeitar: false, podeReabrir: false, bloqueio: null, ...overrides });
const apontamento = (overrides = {}) => ({
    id: "h1", projetoId: "p1", usuarioId: "u2", itemId: "i1", dataTrabalho: "2026-10-13", competencia: "2026-10", minutos: 90,
    descricao: "Ajuste da tela de login", faturavel: true, status: "ENVIADO", motivo: null, versao: 2,
    enviadoEm: "2026-10-13T20:00:00.000Z", decididoEm: null, decididoPor: null, usuario: ana, item,
    acoes: acoes({ podeAprovar: true, podeRejeitar: true }), custo: null, ...overrides
});
const enviadoDaAna = apontamento();
const enviadoDoBruno = apontamento({ id: "h2", usuarioId: "u3", usuario: bruno, itemId: null, item: null, dataTrabalho: "2026-10-12", minutos: 60, versao: 4, faturavel: false });
const aprovado = apontamento({
    id: "h3", status: "APROVADO", versao: 5, dataTrabalho: "2026-10-09", decididoPor: gestora, decididoEm: "2026-10-10T12:00:00.000Z",
    acoes: acoes({ podeReabrir: true }), custo: { situacao: "CALCULADO", custoId: "c1", taxaHoraAplicada: "120.0000", valorCusto: "180.00", moeda: "BRL" }
});
const proprio = apontamento({ id: "h4", usuarioId: "u1", usuario: gestora, dataTrabalho: "2026-10-08", acoes: acoes({ bloqueio: "Você não pode aprovar os próprios apontamentos." }) });
const semTaxa = apontamento({ id: "h5", status: "APROVADO", dataTrabalho: "2026-10-07", acoes: acoes(), custo: { situacao: "SEM_TAXA", custoId: null, taxaHoraAplicada: null, valorCusto: null, moeda: null } });
const competencia = (overrides = {}) => ({
    competencia: "2026-10", fechada: false, situacao: null, versao: null, fechadoEm: null, fechadoPor: null, reabertoEm: null,
    reabertoPor: null, motivoReabertura: null, minutos: 300, enviadosPendentes: 2, podeFechar: false, podeReabrir: false,
    bloqueio: "Há 2 apontamento(s) enviado(s) aguardando decisão na competência 10/2026.", ...overrides
});
const financeiro = {
    moeda: "BRL", totalCusto: "180.00", apontamentosSemCusto: 2,
    custosPorUsuario: [{ usuario: ana, minutos: 90, valor: "180.00" }],
    custosPorItem: [{ item, minutos: 90, valor: "180.00" }],
    linhas: [{ custoId: "c1", descricao: "Desenvolvimento", usuario: ana, item: null, quantidadeMinutos: 6000, taxaHora: "120.0000", valorPlanejado: "12000.00", minutosAprovados: 90, valorRealizadoHoras: "180.00" }]
};
const permissoesCompletas = { podeAprovar: true, podeReabrir: true, podeFecharPeriodo: true, podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: true };
const pagina = (items = [enviadoDaAna, enviadoDoBruno, aprovado, proprio], extra = {}) => ({
    items,
    total: items.length,
    pagina: 1,
    limite: 5,
    totalPaginas: 1,
    totalMinutos: 330,
    totaisPorUsuario: [{ usuario: ana, minutos: 180 }, { usuario: bruno, minutos: 60 }, { usuario: gestora, minutos: 90 }],
    totaisPorItem: [{ item, minutos: 270 }, { item: null, minutos: 60 }],
    competencias: [competencia()],
    permissoes: permissoesCompletas,
    financeiro,
    ...extra
});
const falha = (message, type) => Object.assign(new Error(message), { type });

const renderTela = async () => {
    const user = userEvent.setup();
    render(<ProjectHoursManagement />);
    await screen.findByRole("heading", { name: "Apontamentos do projeto" });
    await waitFor(() => expect(getHorasDoProjeto).toHaveBeenCalled());
    return user;
};
const linha = (texto) => screen.getByRole("row", { name: new RegExp(texto) });
const ultimaConsulta = () => getHorasDoProjeto.mock.calls.at(-1)[0];

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14, 10, 0, 0));
    getHorasProjetos.mockResolvedValue([projeto, outroProjeto]);
    getHorasDoProjeto.mockResolvedValue(pagina());
    aprovarApontamentos.mockResolvedValue([]);
    rejeitarApontamentos.mockResolvedValue([]);
    reabrirApontamento.mockResolvedValue({ id: "h3", status: "RASCUNHO", versao: 6 });
    fecharCompetencia.mockResolvedValue({ competencia: "2026-10", fechada: true, versao: 1 });
    reabrirCompetencia.mockResolvedValue({ competencia: "2026-09", fechada: false, versao: 2 });
    recalcularCustosPendentes.mockResolvedValue({ calculados: 1, pendentes: 1 });
});

afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    vi.useRealTimers();
});

describe("Horas do projeto", () => {
    it("abre o primeiro projeto ativo no mês atual com totais, competências e o custo das horas", async () => {
        render(<ProjectHoursManagement />);

        expect(screen.getByText("Carregando projetos...")).toBeInTheDocument();
        await screen.findByRole("heading", { name: "Apontamentos do projeto" });
        expect(getHorasProjetos).toHaveBeenLastCalledWith(false);
        await waitFor(() => expect(ultimaConsulta()).toEqual({ projetoId: "p1", inicio: "2026-10-01", fim: "2026-10-31", pagina: 1, limite: 5 }));

        const totais = screen.getByRole("region", { name: "Totais das horas" });
        expect(within(totais).getByText("Total no filtro").closest("div")).toHaveTextContent("05:30");
        expect(within(totais).getByText("Ana Analista").closest("li")).toHaveTextContent("03:00");
        expect(within(totais).getByText("Sem item").closest("li")).toHaveTextContent("01:00");

        const competencias = screen.getByRole("region", { name: "Competências do período" });
        expect(within(competencias).getByText("10/2026")).toBeInTheDocument();
        expect(within(competencias).getByText("Aberta")).toBeInTheDocument();
        expect(within(competencias).getByText("05:00 lançadas · 2 enviados aguardando decisão")).toBeInTheDocument();
        expect(within(competencias).getByRole("button", { name: "Fechar competência 10/2026. Indisponível: Há 2 apontamento(s) enviado(s) aguardando decisão na competência 10/2026." })).toBeDisabled();

        const custo = screen.getByRole("region", { name: "Custo das horas aprovadas" });
        expect(within(custo).getByText("Custo no filtro").closest("div")).toHaveTextContent("R$ 180,00");
        expect(within(custo).getByText("2 apontamentos aprovados estão sem custo calculado.")).toBeInTheDocument();
        expect(within(custo).getByRole("row", { name: /Desenvolvimento/ })).toHaveTextContent("100:00");
        expect(within(linha("09/10/2026")).getByText("R$ 180,00")).toBeInTheDocument();
    });

    it("aprova em lote os enviados marcados e reaproveita a chave de idempotência na nova tentativa", async () => {
        aprovarApontamentos.mockRejectedValueOnce(falha("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", "network"));
        const user = await renderTela();

        expect(screen.getByRole("button", { name: "Aprovar selecionados. Indisponível: Marque ao menos um apontamento enviado." })).toBeDisabled();
        await user.click(screen.getByRole("checkbox", { name: "Selecionar apontamento de Ana Analista em 13/10/2026" }));
        await user.click(screen.getByRole("checkbox", { name: "Selecionar apontamento de Bruno Dev em 12/10/2026" }));
        await user.click(screen.getByRole("button", { name: "Aprovar selecionados" }));
        expect(await screen.findByText(/Verifique sua conexão/)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Aprovar selecionados" }));
        expect(await screen.findByText("2 apontamentos aprovados.")).toBeInTheDocument();
        const [primeira, segunda] = aprovarApontamentos.mock.calls.map(([input]) => input);
        expect(primeira).toEqual({ projetoId: "p1", apontamentos: [{ id: "h1", versao: 2 }, { id: "h2", versao: 4 }], chaveIdempotencia: expect.any(String) });
        expect(segunda.chaveIdempotencia).toBe(primeira.chaveIdempotencia);
    });

    it("rejeita com motivo obrigatório que a pessoa vê depois", async () => {
        const user = await renderTela();

        await user.click(screen.getByRole("checkbox", { name: "Selecionar apontamento de Ana Analista em 13/10/2026" }));
        await user.click(screen.getByRole("button", { name: "Rejeitar selecionados" }));
        const dialogo = screen.getByRole("dialog", { name: "Rejeitar apontamentos" });
        expect(dialogo).toHaveClass("crud-modal--warning");
        await waitFor(() => expect(within(dialogo).getByRole("textbox", { name: /Motivo da rejeição/ })).toHaveFocus());
        expect(within(dialogo).getByText("Ana Analista · 13/10/2026").closest("li")).toHaveTextContent("01:30");

        await user.type(within(dialogo).getByRole("textbox", { name: /Motivo da rejeição/ }), "abc");
        await user.click(within(dialogo).getByRole("button", { name: "Rejeitar" }));
        expect(within(dialogo).getByRole("alert")).toHaveTextContent("Informe um motivo com 5 a 500 caracteres.");
        expect(rejeitarApontamentos).not.toHaveBeenCalled();

        await user.type(within(dialogo).getByRole("textbox", { name: /Motivo da rejeição/ }), " — detalhe a tarefa realizada.");
        await user.click(within(dialogo).getByRole("button", { name: "Rejeitar" }));
        await waitFor(() => expect(rejeitarApontamentos).toHaveBeenCalledWith({
            projetoId: "p1", apontamentos: [{ id: "h1", versao: 2 }], motivo: "abc — detalhe a tarefa realizada.", chaveIdempotencia: expect.any(String)
        }));
        expect(await screen.findByText("Apontamento rejeitado.")).toBeInTheDocument();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("reabre o aprovado com motivo na variante destrutiva e mostra a falha no diálogo", async () => {
        reabrirApontamento.mockRejectedValueOnce(falha("A competência 10/2026 deste projeto está fechada.", "validation"));
        const user = await renderTela();

        await user.click(linha("09/10/2026"));
        await user.click(screen.getByRole("button", { name: "Reabrir apontamento" }));
        const dialogo = screen.getByRole("dialog", { name: "Reabrir apontamento" });
        expect(dialogo).toHaveClass("crud-modal--destructive");
        expect(dialogo).toHaveTextContent("O apontamento aprovado volta para rascunho e o custo calculado é removido.");
        await user.type(within(dialogo).getByRole("textbox", { name: /Motivo da reabertura/ }), "Data lançada errada.");
        await user.click(within(dialogo).getByRole("button", { name: "Reabrir apontamento" }));
        expect(await within(dialogo).findByRole("alert")).toHaveTextContent("A competência 10/2026 deste projeto está fechada.");

        await user.click(within(dialogo).getByRole("button", { name: "Reabrir apontamento" }));
        await waitFor(() => expect(reabrirApontamento).toHaveBeenLastCalledWith({ projetoId: "p1", id: "h3", versao: 5, motivo: "Data lançada errada." }));
        expect(await screen.findByText("Apontamento reaberto. Ele voltou para rascunho e o custo calculado foi removido.")).toBeInTheDocument();
    });

    it("impede a autoaprovação com a explicação do backend e mostra o detalhe do apontamento", async () => {
        const user = await renderTela();

        expect(screen.getByRole("checkbox", { name: "Selecionar apontamento de Gestora em 08/10/2026. Indisponível: Você não pode aprovar os próprios apontamentos." })).toBeDisabled();
        expect(within(linha("08/10/2026")).getByText("Somente consulta")).toBeInTheDocument();
        await user.click(linha("08/10/2026"));
        expect(screen.getByRole("button", { name: "Reabrir apontamento. Indisponível: Somente apontamentos aprovados podem ser reabertos." })).toBeDisabled();

        await user.click(screen.getByRole("button", { name: "Visualizar apontamento" }));
        const dialogo = screen.getByRole("dialog", { name: "Apontamento" });
        expect(within(dialogo).getByText("Sem decisão disponível")).toBeInTheDocument();
        expect(within(dialogo).getByText("Ajuste da tela de login")).toBeInTheDocument();
        await user.click(within(dialogo).getAllByRole("button", { name: "Fechar" }).at(-1));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("fecha a competência com confirmação e reabre a fechada com motivo", async () => {
        getHorasDoProjeto.mockResolvedValue(pagina(undefined, {
            competencias: [
                competencia({ competencia: "2026-09", fechada: true, situacao: "FECHADO", versao: 1, fechadoEm: "2026-10-01T12:00:00.000Z", fechadoPor: gestora, enviadosPendentes: 0, podeReabrir: true, bloqueio: null }),
                competencia({ enviadosPendentes: 0, podeFechar: true, bloqueio: null })
            ]
        }));
        const user = await renderTela();
        const competencias = screen.getByRole("region", { name: "Competências do período" });
        expect(within(competencias).getByText(/Fechada por Gestora em/)).toBeInTheDocument();

        await user.click(within(competencias).getByRole("button", { name: "Fechar competência 10/2026" }));
        const confirmacao = screen.getByRole("alertdialog", { name: "Fechar competência" });
        expect(confirmacao).toHaveTextContent("Fechar a competência 10/2026? Os apontamentos desse mês não poderão mais ser alterados.");
        await user.click(within(confirmacao).getByRole("button", { name: "Fechar competência" }));
        await waitFor(() => expect(fecharCompetencia).toHaveBeenCalledWith({ projetoId: "p1", competencia: "2026-10" }));
        expect(await screen.findByText("Competência 10/2026 fechada.")).toBeInTheDocument();

        await user.click(within(competencias).getByRole("button", { name: "Reabrir competência 09/2026" }));
        const dialogo = screen.getByRole("dialog", { name: "Reabrir competência 09/2026" });
        await user.type(within(dialogo).getByRole("textbox", { name: /Motivo da reabertura/ }), "  Ajuste das horas da equipe.  ");
        await user.click(within(dialogo).getByRole("button", { name: "Reabrir competência" }));
        await waitFor(() => expect(reabrirCompetencia).toHaveBeenCalledWith({ projetoId: "p1", competencia: "2026-09", versao: 1, motivo: "Ajuste das horas da equipe." }));
        expect(await screen.findByText("Competência 09/2026 reaberta.")).toBeInTheDocument();
    });

    it("recalcula os custos pendentes e mostra a situação do custo sem taxa", async () => {
        getHorasDoProjeto.mockResolvedValue(pagina([aprovado, semTaxa]));
        const user = await renderTela();

        expect(within(linha("07/10/2026")).getByText("Sem taxa")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Recalcular custos pendentes" }));
        await waitFor(() => expect(recalcularCustosPendentes).toHaveBeenCalledWith("p1"));
        expect(await screen.findByText("1 custo calculado. 1 apontamento continua sem custo.")).toBeInTheDocument();
    });

    it("não mostra valores, coluna de custo nem recálculo sem acesso ao financeiro", async () => {
        getHorasDoProjeto.mockResolvedValue(pagina(undefined, {
            financeiro: null,
            permissoes: { ...permissoesCompletas, podeVisualizarFinanceiro: false, podeGerenciarFinanceiro: false }
        }));
        await renderTela();

        expect(screen.queryByRole("region", { name: "Custo das horas aprovadas" })).not.toBeInTheDocument();
        expect(screen.queryByRole("columnheader", { name: "Custo" })).not.toBeInTheDocument();
        expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Recalcular custos pendentes/ })).not.toBeInTheDocument();
    });

    it("filtra por pessoa, item, situação, faturável e período e troca de projeto", async () => {
        const user = await renderTela();

        await user.selectOptions(screen.getByRole("combobox", { name: "Pessoa" }), "u3");
        await waitFor(() => expect(ultimaConsulta()).toMatchObject({ usuarioId: "u3", pagina: 1 }));
        await user.selectOptions(screen.getByRole("combobox", { name: "Item" }), "i1");
        await user.selectOptions(screen.getByRole("combobox", { name: "Situação" }), "ENVIADO");
        await user.selectOptions(screen.getByRole("combobox", { name: "Faturável" }), "false");
        await waitFor(() => expect(ultimaConsulta()).toMatchObject({ usuarioId: "u3", itemId: "i1", status: "ENVIADO", faturavel: false }));
        expect(screen.getByRole("option", { name: "Ana Analista" })).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-10-05" } });
        await waitFor(() => expect(ultimaConsulta()).toMatchObject({ inicio: "2026-10-05", fim: "2026-10-31" }));
        const consultas = getHorasDoProjeto.mock.calls.length;
        fireEvent.change(screen.getByLabelText("Fim"), { target: { value: "2026-10-01" } });
        expect(await screen.findByText("Informe o início e o fim do período, com o fim igual ou posterior ao início.")).toBeInTheDocument();
        expect(getHorasDoProjeto).toHaveBeenCalledTimes(consultas);

        fireEvent.change(screen.getByLabelText("Fim"), { target: { value: "2026-10-31" } });
        await user.selectOptions(screen.getByRole("combobox", { name: "Projeto" }), "p2");
        await waitFor(() => expect(ultimaConsulta()).toEqual({
            projetoId: "p2", inicio: "2026-10-05", fim: "2026-10-31", status: "ENVIADO", faturavel: false, pagina: 1, limite: 5
        }));
    });

    it("deixa o projeto arquivado somente para consulta", async () => {
        getHorasProjetos.mockResolvedValue([arquivado]);
        getHorasDoProjeto.mockResolvedValue(pagina([enviadoDaAna], {
            permissoes: { podeAprovar: false, podeReabrir: false, podeFecharPeriodo: false, podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: false },
            competencias: [competencia({ bloqueio: null })]
        }));
        await renderTela();

        expect(screen.getByText("Projeto arquivado. As horas ficam disponíveis somente para consulta.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Aprovar selecionados. Indisponível: O projeto arquivado fica somente para consulta." })).toBeDisabled();
        expect(screen.queryByRole("button", { name: /Fechar competência/ })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Recalcular custos pendentes/ })).not.toBeInTheDocument();
    });

    it("orienta quando não há projetos ativos e consulta os arquivados", async () => {
        getHorasProjetos.mockImplementation(async (incluirArquivados) => (incluirArquivados ? [arquivado] : []));
        const user = userEvent.setup();
        render(<ProjectHoursManagement />);

        expect(await screen.findByText("Nenhum projeto para acompanhar")).toBeInTheDocument();
        expect(getHorasDoProjeto).not.toHaveBeenCalled();
        await user.click(screen.getByRole("checkbox", { name: "Incluir arquivados" }));
        await waitFor(() => expect(getHorasProjetos).toHaveBeenLastCalledWith(true));
        await waitFor(() => expect(ultimaConsulta()).toMatchObject({ projetoId: "p9" }));
    });

    it("oferece nova tentativa quando a consulta das horas falha", async () => {
        getHorasDoProjeto.mockRejectedValue(falha("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", "network"));
        const user = await renderTela();

        expect(await screen.findByText(/Verifique sua conexão/)).toBeInTheDocument();
        getHorasDoProjeto.mockResolvedValue(pagina());
        await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
        expect(await screen.findByRole("row", { name: /13\/10\/2026/ })).toBeInTheDocument();
    });

    it("mostra acesso negado sem revelar projetos nem horas", async () => {
        getHorasProjetos.mockRejectedValue(falha("Você não possui permissão para realizar esta operação.", "permission"));
        render(<ProjectHoursManagement />);

        expect(await screen.findByText("Acesso não permitido")).toBeInTheDocument();
        expect(screen.getByText("Você não possui permissão para acompanhar as horas dos projetos.")).toBeInTheDocument();
        expect(screen.queryByRole("combobox", { name: "Projeto" })).not.toBeInTheDocument();
        expect(getHorasDoProjeto).not.toHaveBeenCalled();
    });
});
