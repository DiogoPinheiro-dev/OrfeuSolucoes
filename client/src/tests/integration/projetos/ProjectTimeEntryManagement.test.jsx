// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    descartarApontamento,
    enviarApontamentos,
    excluirApontamento,
    getApontamentoItens,
    getApontamentoProjetos,
    getMeusApontamentos,
    recolherApontamento,
    salvarApontamento
} from "../../../../services/Projetos/ApontamentoService";
import ProjectTimeEntryManagement from "../../../components/ProjectTimeEntryManagement";

vi.mock("../../../../services/Projetos/ApontamentoService", () => ({
    descartarApontamento: vi.fn(),
    enviarApontamentos: vi.fn(),
    excluirApontamento: vi.fn(),
    getApontamentoItens: vi.fn(),
    getApontamentoProjetos: vi.fn(),
    getMeusApontamentos: vi.fn(),
    recolherApontamento: vi.fn(),
    salvarApontamento: vi.fn()
}));

const projeto = { id: "p1", chave: "ORF", nome: "Orfeu Evolução", situacao: "EM_ANDAMENTO", arquivadoEm: null };
const outroProjeto = { id: "p2", chave: "CRM", nome: "CRM Comercial", situacao: "PLANEJADO", arquivadoEm: null };
const item = { id: "i1", chave: "ORF-12", titulo: "Tela de login" };
const acoes = (overrides = {}) => ({
    podeAlterar: false, podeEnviar: false, podeRecolher: false, podeExcluir: false, podeDescartar: false, bloqueio: null, ...overrides
});
const apontamento = (overrides = {}) => ({
    id: "a1", projetoId: "p1", usuarioId: "u1", itemId: null, dataTrabalho: "2026-10-13", competencia: "2026-10", minutos: 90,
    descricao: "Revisão do fluxo de login", faturavel: true, status: "RASCUNHO", motivo: null, versao: 1, enviadoEm: null,
    decididoEm: null, decididoPor: null, projeto, item: null, acoes: acoes({ podeAlterar: true, podeEnviar: true, podeExcluir: true }),
    ...overrides
});
const rascunho = apontamento();
const rejeitado = apontamento({
    id: "a2", dataTrabalho: "2026-10-12", minutos: 120, status: "REJEITADO", motivo: "Faltou detalhar a tarefa.", versao: 3,
    itemId: "i1", item, acoes: acoes({ podeAlterar: true, podeEnviar: true, podeDescartar: true })
});
const enviado = apontamento({ id: "a3", dataTrabalho: "2026-10-14", status: "ENVIADO", versao: 2, enviadoEm: "2026-10-14T12:00:00.000Z", acoes: acoes({ podeRecolher: true }) });
const fechado = apontamento({
    id: "a4", dataTrabalho: "2026-09-30", competencia: "2026-09",
    acoes: acoes({ bloqueio: "A competência 09/2026 deste projeto está fechada." })
});
const pagina = (items = [rascunho, rejeitado, enviado], extra = {}) => ({
    items,
    total: items.length,
    pagina: 1,
    limite: 5,
    totalPaginas: 1,
    totalMinutos: 2790,
    totaisPorDia: [{ data: "2026-10-12", minutos: 1260 }, { data: "2026-10-13", minutos: 1440 }, { data: "2026-10-14", minutos: 90 }],
    totaisPorProjeto: [{ projetoId: "p1", chave: "ORF", nome: "Orfeu Evolução", minutos: 2790 }],
    permissoes: { podeIncluir: true },
    ...extra
});
const falha = (message, type) => Object.assign(new Error(message), { type });

const renderTela = async () => {
    const user = userEvent.setup();
    render(<ProjectTimeEntryManagement />);
    await screen.findByRole("heading", { name: "Lançamentos do período" });
    return user;
};
const linha = (texto) => screen.getByRole("row", { name: new RegExp(texto) });
const ultimaConsulta = () => getMeusApontamentos.mock.calls.at(-1)[0];

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14, 10, 0, 0));
    getMeusApontamentos.mockResolvedValue(pagina());
    getApontamentoProjetos.mockResolvedValue([projeto, outroProjeto]);
    getApontamentoItens.mockResolvedValue([item]);
    salvarApontamento.mockResolvedValue({ id: "a9", status: "RASCUNHO", versao: 1 });
    enviarApontamentos.mockResolvedValue([]);
    recolherApontamento.mockResolvedValue({ id: "a3", status: "RASCUNHO", versao: 3 });
    excluirApontamento.mockResolvedValue(true);
    descartarApontamento.mockResolvedValue(true);
});

afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    vi.useRealTimers();
});

describe("Meus apontamentos", () => {
    it("abre a semana atual com o resumo por dia e por projeto e avisa o dia perto de 24 horas", async () => {
        render(<ProjectTimeEntryManagement />);

        expect(screen.getByText("Carregando apontamentos...")).toBeInTheDocument();
        await screen.findByRole("heading", { name: "Lançamentos do período" });
        expect(ultimaConsulta()).toEqual({ inicio: "2026-10-12", fim: "2026-10-18", pagina: 1, limite: 5 });

        const resumo = screen.getByRole("region", { name: "Resumo do período" });
        expect(within(resumo).getByText("Total do período").closest("div")).toHaveTextContent("46:30");
        expect(within(resumo).getAllByRole("listitem").filter((dia) => dia.classList.contains("project-hours-day"))).toHaveLength(7);
        expect(within(resumo).getByText("Perto do limite de 24 horas")).toBeInTheDocument();
        expect(within(resumo).getByText("Limite de 24 horas atingido")).toBeInTheDocument();
        expect(within(resumo).getByText("ORF — Orfeu Evolução")).toBeInTheDocument();
        expect(screen.getAllByText("12/10/2026 a 18/10/2026").length).toBeGreaterThan(0);

        expect(within(linha("13/10/2026")).getByText("Rascunho")).toBeInTheDocument();
        expect(within(linha("12/10/2026")).getByText("Faltou detalhar a tarefa.")).toBeInTheDocument();
        expect(within(linha("12/10/2026")).getByText("ORF-12 — Tela de login")).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: "Selecionar apontamento de 14/10/2026 em ORF. Indisponível: O apontamento já foi enviado e aguarda decisão." })).toBeDisabled();
    });

    it("navega entre semanas e meses sem abrir períodos futuros", async () => {
        const user = await renderTela();

        expect(screen.getByRole("button", { name: /^Próxima semana\. Indisponível/ })).toBeDisabled();
        await user.click(screen.getByRole("button", { name: "Semana anterior" }));
        await waitFor(() => expect(ultimaConsulta()).toMatchObject({ inicio: "2026-10-05", fim: "2026-10-11", pagina: 1 }));
        await user.click(screen.getByRole("button", { name: "Semana atual" }));
        await waitFor(() => expect(ultimaConsulta()).toMatchObject({ inicio: "2026-10-12", fim: "2026-10-18" }));

        await user.click(screen.getByRole("button", { name: "Mês" }));
        await waitFor(() => expect(ultimaConsulta()).toMatchObject({ inicio: "2026-10-01", fim: "2026-10-31" }));
        expect(screen.getByRole("button", { name: "Mês" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", { name: /^Próximo mês\. Indisponível/ })).toBeDisabled();
        await user.click(screen.getByRole("button", { name: "Mês anterior" }));
        await waitFor(() => expect(ultimaConsulta()).toMatchObject({ inicio: "2026-09-01", fim: "2026-09-30" }));
        expect(screen.getByRole("group", { name: "Período dos apontamentos" })).toHaveTextContent("Setembro de 2026");
    });

    it("filtra por projeto e situação e pagina no servidor", async () => {
        getMeusApontamentos.mockResolvedValue(pagina([rascunho, rejeitado, enviado, fechado, apontamento({ id: "a5" })], { total: 6, totalPaginas: 2 }));
        const user = await renderTela();

        await user.click(screen.getByRole("button", { name: "Próxima" }));
        await waitFor(() => expect(ultimaConsulta()).toMatchObject({ pagina: 2 }));

        await user.selectOptions(screen.getByRole("combobox", { name: "Projeto" }), "p2");
        await waitFor(() => expect(ultimaConsulta()).toMatchObject({ projetoId: "p2", pagina: 1 }));
        await user.selectOptions(screen.getByRole("combobox", { name: "Situação" }), "REJEITADO");
        await waitFor(() => expect(ultimaConsulta()).toMatchObject({ projetoId: "p2", status: "REJEITADO", pagina: 1 }));
    });

    it("lança um apontamento em hh:mm com item opcional e faturável marcado", async () => {
        const user = await renderTela();

        await user.click(screen.getByRole("button", { name: "Novo apontamento" }));
        const dialogo = screen.getByRole("dialog", { name: "Novo apontamento" });
        await waitFor(() => expect(within(dialogo).getByRole("combobox", { name: /^Projeto/ })).toHaveFocus());
        expect(within(dialogo).getByRole("checkbox", { name: "Faturável" })).toBeChecked();
        await user.selectOptions(within(dialogo).getByRole("combobox", { name: /^Projeto/ }), "p1");
        await waitFor(() => expect(getApontamentoItens).toHaveBeenLastCalledWith("p1"));
        await user.selectOptions(within(dialogo).getByRole("combobox", { name: /^Item do backlog/ }), "i1");
        fireEvent.change(within(dialogo).getByLabelText("Data"), { target: { value: "2026-10-13" } });
        await user.type(within(dialogo).getByRole("textbox", { name: /^Duração/ }), "01:30");
        await user.type(within(dialogo).getByRole("textbox", { name: /^Descrição/ }), "  Ajuste da tela de login  ");
        await user.click(within(dialogo).getByRole("button", { name: "Salvar apontamento" }));

        await waitFor(() => expect(salvarApontamento).toHaveBeenCalledWith({
            projetoId: "p1", itemId: "i1", data: "2026-10-13", minutos: 90, descricao: "Ajuste da tela de login", faturavel: true
        }));
        expect(await screen.findByText("Apontamento salvo como rascunho.")).toBeInTheDocument();
        expect(screen.queryByRole("dialog", { name: "Novo apontamento" })).not.toBeInTheDocument();
    });

    it("confere os campos antes de enviar e leva a recusa do limite diário ao campo de duração", async () => {
        const user = await renderTela();

        await user.click(screen.getByRole("button", { name: "Novo apontamento" }));
        const dialogo = screen.getByRole("dialog", { name: "Novo apontamento" });
        await user.click(within(dialogo).getByRole("button", { name: "Salvar apontamento" }));
        expect(within(dialogo).getByText("Selecione o projeto.")).toBeInTheDocument();
        expect(within(dialogo).getByText("Informe a duração no formato hh:mm, por exemplo 01:30.")).toBeInTheDocument();
        expect(within(dialogo).getByText("Informe a descrição do apontamento.")).toBeInTheDocument();
        expect(salvarApontamento).not.toHaveBeenCalled();

        await user.selectOptions(within(dialogo).getByRole("combobox", { name: /^Projeto/ }), "p1");
        await user.type(within(dialogo).getByRole("textbox", { name: /^Duração/ }), "25:00");
        await user.type(within(dialogo).getByRole("textbox", { name: /^Descrição/ }), "Plantão");
        await user.click(within(dialogo).getByRole("button", { name: "Salvar apontamento" }));
        expect(within(dialogo).getByText("A duração deve ficar entre 00:01 e 24:00.")).toBeInTheDocument();

        salvarApontamento.mockRejectedValueOnce(falha("O dia já tem 23:00 lançadas e só cabem mais 01:00.", "validation"));
        await user.clear(within(dialogo).getByRole("textbox", { name: /^Duração/ }));
        await user.type(within(dialogo).getByRole("textbox", { name: /^Duração/ }), "02:00");
        await user.click(within(dialogo).getByRole("button", { name: "Salvar apontamento" }));

        expect(await within(dialogo).findByText("O dia já tem 23:00 lançadas e só cabem mais 01:00.")).toBeInTheDocument();
        expect(within(dialogo).getByRole("textbox", { name: /^Duração/ })).toHaveAttribute("aria-invalid", "true");
    });

    it("corrige o rejeitado mostrando o motivo, sem trocar de projeto", async () => {
        const user = await renderTela();

        await user.click(linha("12/10/2026"));
        await user.click(screen.getByRole("button", { name: "Alterar apontamento" }));
        const dialogo = screen.getByRole("dialog", { name: "Alterar apontamento" });
        expect(within(dialogo).getByText("Motivo da rejeição")).toBeInTheDocument();
        expect(within(dialogo).getByText("Faltou detalhar a tarefa.")).toBeInTheDocument();
        expect(within(dialogo).getByRole("combobox", { name: /^Projeto/ })).toBeDisabled();
        await waitFor(() => expect(within(dialogo).getByRole("combobox", { name: /^Item do backlog/ })).toHaveFocus());
        await waitFor(() => expect(within(dialogo).getByRole("combobox", { name: /^Item do backlog/ })).toHaveValue("i1"));

        const duracao = within(dialogo).getByRole("textbox", { name: /^Duração/ });
        expect(duracao).toHaveValue("02:00");
        await user.clear(duracao);
        await user.type(duracao, "2:30");
        await user.click(within(dialogo).getByRole("button", { name: "Salvar apontamento" }));

        await waitFor(() => expect(salvarApontamento).toHaveBeenCalledWith({
            id: "a2", versao: 3, projetoId: "p1", itemId: "i1", data: "2026-10-12", minutos: 150, descricao: "Revisão do fluxo de login", faturavel: true
        }));
        expect(await screen.findByText("Apontamento alterado.")).toBeInTheDocument();
    });

    it("mantém o item arquivado do apontamento e avisa quando os itens não carregam", async () => {
        getApontamentoItens.mockRejectedValue(falha("Não foi possível conectar ao servidor.", "network"));
        const user = await renderTela();

        await user.click(linha("12/10/2026"));
        await user.click(screen.getByRole("button", { name: "Alterar apontamento" }));
        const dialogo = screen.getByRole("dialog", { name: "Alterar apontamento" });

        expect(await within(dialogo).findByRole("alert")).toHaveTextContent("Não foi possível carregar os itens do projeto.");
        expect(within(dialogo).getByRole("combobox", { name: /^Item do backlog/ })).toHaveValue("i1");
    });

    it("envia em lote os marcados, recolhe o envio e descarta o rejeitado", async () => {
        const user = await renderTela();

        await user.click(screen.getByRole("checkbox", { name: "Selecionar apontamento de 13/10/2026 em ORF" }));
        await user.click(screen.getByRole("checkbox", { name: "Selecionar apontamento de 12/10/2026 em ORF" }));
        await user.click(screen.getByRole("button", { name: "Enviar para aprovação" }));
        await waitFor(() => expect(enviarApontamentos).toHaveBeenCalledWith([{ id: "a1", versao: 1 }, { id: "a2", versao: 3 }]));
        expect(await screen.findByText("2 apontamentos enviados para aprovação.")).toBeInTheDocument();

        await user.click(linha("14/10/2026"));
        await user.click(screen.getByRole("button", { name: "Recolher envio" }));
        await waitFor(() => expect(recolherApontamento).toHaveBeenCalledWith({ id: "a3", versao: 2 }));
        expect(await screen.findByText("Envio recolhido. O apontamento voltou para rascunho.")).toBeInTheDocument();

        await user.click(linha("12/10/2026"));
        await user.click(screen.getByRole("button", { name: "Descartar" }));
        const confirmacao = screen.getByRole("alertdialog", { name: "Descartar apontamento rejeitado" });
        await user.click(within(confirmacao).getByRole("button", { name: "Descartar" }));
        await waitFor(() => expect(descartarApontamento).toHaveBeenCalledWith({ id: "a2", versao: 3 }));
        expect(await screen.findByText("Apontamento descartado.")).toBeInTheDocument();
    });

    it("explica por que as ações em lote ficam indisponíveis", async () => {
        const user = await renderTela();

        expect(screen.getByRole("button", { name: "Enviar para aprovação. Indisponível: Marque ao menos um apontamento em rascunho ou rejeitado." })).toBeDisabled();
        await user.click(linha("13/10/2026"));
        expect(screen.getByRole("button", { name: "Recolher envio. Indisponível: Somente apontamentos enviados e ainda sem decisão podem ser recolhidos." })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Descartar. Indisponível: Somente apontamentos rejeitados podem ser descartados." })).toBeDisabled();

        await user.click(screen.getByRole("checkbox", { name: "Selecionar apontamento de 12/10/2026 em ORF" }));
        expect(screen.getByRole("button", { name: "Excluir rascunhos marcados. Indisponível: Marque somente rascunhos para excluir." })).toBeDisabled();
    });

    it("exclui o rascunho marcado e mostra a falha dentro da confirmação", async () => {
        excluirApontamento.mockRejectedValueOnce(falha("O apontamento foi alterado em outra tela ou por outra pessoa. Atualize os dados.", "conflict"));
        const user = await renderTela();

        await user.click(screen.getByRole("checkbox", { name: "Selecionar apontamento de 13/10/2026 em ORF" }));
        await user.click(screen.getByRole("button", { name: "Excluir rascunhos marcados" }));
        const confirmacao = screen.getByRole("alertdialog", { name: "Excluir rascunho" });
        expect(confirmacao).toHaveTextContent("Excluir o rascunho de 13/10/2026? Esta ação não pode ser desfeita.");
        await user.click(within(confirmacao).getByRole("button", { name: "Excluir" }));
        expect(await within(confirmacao).findByRole("alert")).toHaveTextContent("O apontamento foi alterado em outra tela ou por outra pessoa.");

        await user.click(within(confirmacao).getByRole("button", { name: "Excluir" }));
        await waitFor(() => expect(excluirApontamento).toHaveBeenLastCalledWith({ id: "a1", versao: 1 }));
        expect(await screen.findByText("Rascunho excluído.")).toBeInTheDocument();
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("mostra a competência fechada como somente leitura com a explicação do backend", async () => {
        getMeusApontamentos.mockResolvedValue(pagina([fechado]));
        const user = await renderTela();

        expect(within(linha("30/09/2026")).getByText("Somente consulta")).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: "Selecionar apontamento de 30/09/2026 em ORF. Indisponível: A competência 09/2026 deste projeto está fechada." })).toBeDisabled();
        await user.click(linha("30/09/2026"));
        expect(screen.getByText("Apontamento somente para consulta")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Alterar apontamento. Indisponível: A competência 09/2026 deste projeto está fechada." })).toBeDisabled();

        await user.click(screen.getByRole("button", { name: "Visualizar apontamento" }));
        const dialogo = screen.getByRole("dialog", { name: "Apontamento" });
        expect(within(dialogo).getByText("Revisão do fluxo de login")).toBeInTheDocument();
        expect(within(dialogo).getByText("A competência 09/2026 deste projeto está fechada.")).toBeInTheDocument();
        await user.click(within(dialogo).getAllByRole("button", { name: "Fechar" }).at(-1));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("mostra a lista vazia e impede lançar sem projeto aberto para horas", async () => {
        getMeusApontamentos.mockResolvedValue(pagina([], { totalMinutos: 0, totaisPorDia: [], totaisPorProjeto: [] }));
        getApontamentoProjetos.mockResolvedValue([]);
        await renderTela();

        expect(screen.getByText("Nenhum apontamento neste período.")).toBeInTheDocument();
        expect(screen.getByText("Nenhum projeto com horas neste período.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Novo apontamento. Indisponível: Você não participa de nenhum projeto aberto para lançamento de horas." })).toBeDisabled();
    });

    it("oferece nova tentativa quando a consulta falha e quando os projetos não carregam", async () => {
        getMeusApontamentos.mockRejectedValue(falha("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", "network"));
        getApontamentoProjetos.mockRejectedValue(falha("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", "network"));
        const user = await renderTela();

        expect(screen.getByText(/Não foi possível carregar os projetos para lançar horas/)).toBeInTheDocument();
        getMeusApontamentos.mockResolvedValue(pagina());
        getApontamentoProjetos.mockResolvedValue([projeto]);
        for (const botao of screen.getAllByRole("button", { name: "Tentar novamente" })) await user.click(botao);

        await waitFor(() => expect(screen.queryByText(/Não foi possível carregar os projetos/)).not.toBeInTheDocument());
        expect(await screen.findByRole("row", { name: /13\/10\/2026/ })).toBeInTheDocument();
        expect(screen.queryByText(/Verifique sua conexão/)).not.toBeInTheDocument();
    });

    it("mostra acesso negado sem revelar os apontamentos", async () => {
        getMeusApontamentos.mockRejectedValue(falha("Você não possui permissão para realizar esta operação.", "permission"));
        render(<ProjectTimeEntryManagement />);

        expect(await screen.findByText("Acesso não permitido")).toBeInTheDocument();
        expect(screen.getByText("Você não possui permissão para consultar os seus apontamentos.")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
        expect(screen.queryByRole("group", { name: "Período dos apontamentos" })).not.toBeInTheDocument();
    });
});
