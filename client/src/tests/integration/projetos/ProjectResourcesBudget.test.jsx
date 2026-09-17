// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";

import {
    aprovarOrcamento,
    excluirCategoriaOrcamento,
    excluirCustoProjeto,
    getOrcamento,
    getOrcamentoProjetos,
    reabrirOrcamento,
    salvarCategoriaOrcamento,
    salvarCustoProjeto,
    salvarOrcamento
} from "../../../../services/Projetos/OrcamentoService";
import ProjectBudgetManagement from "../../../components/ProjectBudgetManagement";
import ProjectResourcePlanningManagement from "../../../components/ProjectResourcePlanningManagement";

vi.mock("../../../../services/Projetos/OrcamentoService", () => ({
    aprovarOrcamento: vi.fn(), excluirCategoriaOrcamento: vi.fn(), excluirCustoProjeto: vi.fn(),
    getOrcamento: vi.fn(), getOrcamentoProjetos: vi.fn(), reabrirOrcamento: vi.fn(),
    salvarCategoriaOrcamento: vi.fn(), salvarCustoProjeto: vi.fn(), salvarOrcamento: vi.fn()
}));
vi.mock("../../../components/ResourceRegistrationManagement", () => ({ default: () => <div>Cadastro operacional de recursos</div> }));
vi.mock("../../../components/ProjectTeamManagement", () => ({ default: () => <div>Cadastro operacional de equipes</div> }));

const project = { id: "p1", chave: "ORF", nome: "Orfeu Evolucao", arquivadoEm: null };
const resource = { id: "r1", ativo: true, usuario: { id: "u1", nome: "Desenvolvedora" } };
const projectItem = { id: "i1", chave: "ORF-1", titulo: "Implementar autenticação", estimativaMinutos: 600, responsavelId: "u1", arquivado: false };
const category = { id: "c1", versao: 1, nome: "Infraestrutura", valorPlanejado: "10000", valorComprometido: "7000", valorRealizado: "4000", variacao: "6000" };
const cost = {
    id: "k1", versao: 3, tipo: "FIXO", descricao: "Hospedagem", categoriaId: "c1", recursoId: null,
    recurso: null, item: null, quantidadeMinutos: null, taxaHora: null, valorPlanejado: "5000",
    valorComprometido: "4500", valorRealizado: "3000", taxas: []
};
const finance = {
    id: "o1", versao: 4, moeda: "BRL", status: "RASCUNHO", totalPlanejado: "10000",
    totalComprometido: "7000", totalRealizado: "4000", variacao: "6000", categorias: [category], custos: [cost]
};
const budgetPanel = {
    financeiro: finance,
    recursos: [{ id: "pr1", cadastroRecursoId: "r1", usuarioId: "u1", ativo: true, usuario: resource.usuario }],
    itens: [projectItem],
    permissoes: { podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: true, podeAprovarOrcamento: true }
};
function LocationProbe() {
    const location = useLocation();
    return <output aria-label="Localização atual">{`${location.pathname}${location.search}`}</output>;
}

const renderPlanning = (entry = "/hub/projetos/planejamento-de-recursos") => render(
    <MemoryRouter initialEntries={[entry]}>
        <ProjectResourcePlanningManagement />
        <LocationProbe />
    </MemoryRouter>
);

beforeEach(() => {
    getOrcamentoProjetos.mockResolvedValue([project]);
    getOrcamento.mockResolvedValue(budgetPanel);
    salvarOrcamento.mockResolvedValue(finance);
    salvarCategoriaOrcamento.mockResolvedValue(category);
    excluirCategoriaOrcamento.mockResolvedValue(true);
    salvarCustoProjeto.mockResolvedValue(cost);
    excluirCustoProjeto.mockResolvedValue(true);
    aprovarOrcamento.mockResolvedValue({ ...finance, status: "APROVADO" });
    reabrirOrcamento.mockResolvedValue(finance);
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("Recursos e equipes", () => {
    it("abre o cadastro de recursos sem abas internas", async () => {
        renderPlanning();

        expect(await screen.findByText("Cadastro operacional de recursos")).toBeInTheDocument();
        expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
        expect(screen.queryByText("Cadastro operacional de equipes")).not.toBeInTheDocument();
    });

    it("apresenta a seção de equipes pelo provider de Equipes", async () => {
        render(
            <MemoryRouter initialEntries={["/hub/projetos/equipes"]}>
                <ProjectResourcePlanningManagement secao="equipes" />
            </MemoryRouter>
        );

        expect(await screen.findByText("Cadastro operacional de equipes")).toBeInTheDocument();
        expect(screen.queryByText("Cadastro operacional de recursos")).not.toBeInTheDocument();
    });

    it.each([
        ["equipes", "/hub/projetos/equipes"],
        ["planejamento", "/hub/projetos/backlog-de-demandas"]
    ])("redireciona o link antigo da aba %s para a funcionalidade correspondente", async (aba, destino) => {
        renderPlanning(`/hub/projetos/planejamento-de-recursos?tab=${aba}`);

        await waitFor(() => expect(screen.getByLabelText("Localização atual")).toHaveTextContent(destino));
    });

    it("ignora valores desconhecidos no parâmetro antigo", async () => {
        renderPlanning("/hub/projetos/planejamento-de-recursos?tab=constructor");

        expect(await screen.findByText("Cadastro operacional de recursos")).toBeInTheDocument();
        expect(screen.getByLabelText("Localização atual")).toHaveTextContent("/hub/projetos/planejamento-de-recursos");
    });
});

describe("Orcamento do projeto", () => {
    it("orienta o usuario quando nao existem projetos em orcamento", async () => {
        getOrcamentoProjetos.mockResolvedValue([]);

        render(<ProjectBudgetManagement />);

        expect(await screen.findByText("Nenhum projeto em orçamento")).toBeInTheDocument();
        expect(screen.getByText(/Cadastre um projeto para iniciar o orçamento/)).toBeInTheDocument();
        expect(screen.queryByText(/não possui acesso aos dados financeiros/)).not.toBeInTheDocument();
        expect(getOrcamento).not.toHaveBeenCalled();
    });

    it("usa os grids compartilhados para selecionar, alterar e excluir itens financeiros", async () => {
        const user = userEvent.setup();
        render(<ProjectBudgetManagement />);

        const categoriesGrid = (await screen.findByRole("heading", { name: "Categorias" })).closest("section");
        await user.click(within(categoriesGrid).getByRole("row", { name: /Infraestrutura/ }));
        await user.click(within(categoriesGrid).getByRole("button", { name: "Alterar" }));
        expect(screen.getByRole("dialog", { name: "Alterar categoria" })).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Cancelar" }));

        await user.click(within(categoriesGrid).getByRole("checkbox", { name: "Selecionar Infraestrutura" }));
        await user.click(within(categoriesGrid).getByRole("button", { name: "Excluir selecionados" }));
        await user.click(screen.getByRole("button", { name: "Excluir" }));

        await waitFor(() => expect(excluirCategoriaOrcamento).toHaveBeenCalledWith({
            projetoId: "p1",
            id: "c1",
            versao: 1
        }));
    });

    it("cria o orcamento-base quando o projeto ainda nao possui financeiro", async () => {
        const user = userEvent.setup();
        getOrcamento.mockResolvedValue({ financeiro: null, recursos: [], itens: [], permissoes: { podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: true } });
        render(<ProjectBudgetManagement />);
        const create = await screen.findByRole("button", { name: /Criar or.amento em BRL/ });
        await user.click(create);
        await waitFor(() => expect(salvarOrcamento).toHaveBeenCalledWith({ projetoId: "p1", moeda: "BRL" }));
    });

    it("registra categoria, custo fixo e aprova o orcamento versionado", async () => {
        const user = userEvent.setup();
        render(<ProjectBudgetManagement />);
        expect(await screen.findByText("Hospedagem")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Nova categoria" }));
        const categoryForm = screen.getByRole("dialog", { name: "Nova categoria" });
        await user.type(within(categoryForm).getByRole("textbox", { name: "Nome" }), "Licencas");
        const categoryValues = within(categoryForm).getAllByRole("spinbutton");
        await user.clear(categoryValues[0]); await user.type(categoryValues[0], "2000");
        await user.click(within(categoryForm).getByRole("button", { name: "Adicionar categoria" }));
        await waitFor(() => expect(salvarCategoriaOrcamento).toHaveBeenCalledWith(expect.objectContaining({ projetoId: "p1", nome: "Licencas", valorPlanejado: "2000" })));

        await user.click(screen.getByRole("button", { name: "Novo custo" }));
        const costForm = screen.getByRole("dialog", { name: "Novo custo" });
        await user.type(within(costForm).getByRole("textbox", { name: /Descri/ }), "Certificado digital");
        const costValues = within(costForm).getAllByRole("spinbutton");
        await user.clear(costValues[0]); await user.type(costValues[0], "500");
        await user.click(within(costForm).getByRole("button", { name: "Adicionar custo" }));
        await waitFor(() => expect(salvarCustoProjeto).toHaveBeenCalledWith(expect.objectContaining({ projetoId: "p1", tipo: "FIXO", descricao: "Certificado digital", valorPlanejado: "500" })));

        await user.click(screen.getByRole("button", { name: /Aprovar or.amento/ }));
        await waitFor(() => expect(aprovarOrcamento).toHaveBeenCalledWith({ projetoId: "p1", id: "o1", versao: 4 }));
    });

    it("atualiza a lista após aprovar e remove os controles do projeto aprovado", async () => {
        const user = userEvent.setup();
        render(<ProjectBudgetManagement />);
        const approve = await screen.findByRole("button", { name: "Aprovar orçamento" });
        const initialLoads = getOrcamentoProjetos.mock.calls.length;
        getOrcamentoProjetos.mockResolvedValue([]);
        await user.click(approve);
        expect(await screen.findByText("Orçamento aprovado. O projeto passou para Rascunho.")).toBeInTheDocument();
        await waitFor(() => expect(getOrcamentoProjetos).toHaveBeenCalledTimes(initialLoads + 1));
        expect(screen.queryByRole("option", { name: "ORF — Orfeu Evolucao" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Aprovar orçamento" })).not.toBeInTheDocument();
        expect(screen.queryByText("Hospedagem")).not.toBeInTheDocument();
    });

    it("preserva o orçamento e informa falha quando a aprovação é rejeitada", async () => {
        const user = userEvent.setup();
        aprovarOrcamento.mockRejectedValueOnce(new Error("O orçamento foi alterado por outra pessoa."));
        render(<ProjectBudgetManagement />);
        const approve = await screen.findByRole("button", { name: "Aprovar orçamento" });
        const initialLoads = getOrcamentoProjetos.mock.calls.length;
        await user.click(approve);
        expect(await screen.findByRole("alert")).toHaveTextContent("O orçamento foi alterado por outra pessoa.");
        expect(screen.getByText("Hospedagem")).toBeInTheDocument();
        expect(getOrcamentoProjetos).toHaveBeenCalledTimes(initialLoads);
    });

    it("mantém a aprovação concluída explícita quando falha a atualização da lista", async () => {
        const user = userEvent.setup();
        render(<ProjectBudgetManagement />);
        const approve = await screen.findByRole("button", { name: "Aprovar orçamento" });
        getOrcamentoProjetos.mockRejectedValueOnce(new Error("Falha de rede"));
        await user.click(approve);
        expect(await screen.findByRole("alert")).toHaveTextContent("A aprovação foi concluída");
        expect(screen.getByText("Orçamento aprovado. O projeto passou para Rascunho.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Aprovar orçamento" })).not.toBeInTheDocument();
    });

    it("oferece somente itens do backlog atribuídos ao recurso no custo", async () => {
        const user = userEvent.setup();
        render(<ProjectBudgetManagement />);

        await user.click(await screen.findByRole("button", { name: "Novo custo" }));
        const costForm = screen.getByRole("dialog", { name: "Novo custo" });
        await user.selectOptions(within(costForm).getByRole("combobox", { name: "Tipo" }), "RECURSO");
        await user.selectOptions(within(costForm).getByRole("combobox", { name: "Recurso cadastrado" }), "pr1");

        expect(within(costForm).getByRole("option", { name: "ORF-1 — Implementar autenticação" })).toBeInTheDocument();
        expect(within(costForm).getByText("Somente itens do backlog atribuídos ao recurso selecionado.")).toBeInTheDocument();
    });

    it("oculta dados financeiros e manutencao quando o backend nega acesso", async () => {
        getOrcamento.mockResolvedValue({ ...budgetPanel, permissoes: { podeVisualizarFinanceiro: false } });
        render(<ProjectBudgetManagement />);
        expect(await screen.findByText(/n.o possui acesso aos dados financeiros/)).toBeInTheDocument();
        expect(screen.queryByText("Hospedagem")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Aprovar or.amento/ })).not.toBeInTheDocument();
    });
});
