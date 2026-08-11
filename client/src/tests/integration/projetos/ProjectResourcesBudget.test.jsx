// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
import {
    excluirPlanejamentoTarefa,
    getPlanejamentoRecursos,
    salvarPlanejamentoTarefa
} from "../../../../services/Projetos/PlanejamentoRecursoService";
import ProjectBudgetManagement from "../../../components/ProjectBudgetManagement";
import ProjectResourcePlanningManagement from "../../../components/ProjectResourcePlanningManagement";

vi.mock("../../../../services/Projetos/OrcamentoService", () => ({
    aprovarOrcamento: vi.fn(), excluirCategoriaOrcamento: vi.fn(), excluirCustoProjeto: vi.fn(),
    getOrcamento: vi.fn(), getOrcamentoProjetos: vi.fn(), reabrirOrcamento: vi.fn(),
    salvarCategoriaOrcamento: vi.fn(), salvarCustoProjeto: vi.fn(), salvarOrcamento: vi.fn()
}));
vi.mock("../../../../services/Projetos/PlanejamentoRecursoService", () => ({
    excluirPlanejamentoTarefa: vi.fn(), getPlanejamentoRecursos: vi.fn(), salvarPlanejamentoTarefa: vi.fn()
}));
vi.mock("../../../components/ProjectResourceManagement", () => ({ default: () => <div>Cadastro operacional de recursos</div> }));
vi.mock("../../../components/ProjectResourceExecutionManagement", () => ({ default: () => <div>Planejamento operacional carregado</div> }));

const project = { id: "p1", chave: "ORF", nome: "Orfeu Evolucao", arquivadoEm: null };
const resource = { id: "r1", ativo: true, usuario: { id: "u1", nome: "Desenvolvedora" } };
const task = {
    id: "t1", versao: 2, funcionalidade: "Implementar autenticacao", recursoIds: ["r1"],
    recursos: [{ recurso: resource }], estimativaMinutos: 600, planejadoMinutos: 480, saldoMinutos: 120,
    valorHora: "100.0000", moeda: "BRL", observacao: null, ativo: true, pendenteRecurso: false, sobreplanejada: false
};
const resourcePanel = {
    recursos: [resource], projetos: [project], linhas: [{ projetoId: "p1", cadastroRecursoId: "r1", recursoAtivo: true }],
    tarefas: [task], tarefasPendentes: [], permissoes: { podeIncluir: true, podeAlterar: true, podeExcluir: true }
};

const category = { id: "c1", versao: 1, nome: "Infraestrutura", valorPlanejado: "10000", valorComprometido: "7000", valorRealizado: "4000", variacao: "6000" };
const cost = {
    id: "k1", versao: 3, tipo: "FIXO", descricao: "Hospedagem", categoriaId: "c1", recursoId: null,
    recurso: null, tarefa: null, quantidadeMinutos: null, taxaHora: null, valorPlanejado: "5000",
    valorComprometido: "4500", valorRealizado: "3000", taxas: []
};
const finance = {
    id: "o1", versao: 4, moeda: "BRL", status: "RASCUNHO", totalPlanejado: "10000",
    totalComprometido: "7000", totalRealizado: "4000", variacao: "6000", categorias: [category], custos: [cost]
};
const budgetPanel = {
    financeiro: finance,
    recursos: [{ id: "pr1", cadastroRecursoId: "r1", ativo: true, usuario: resource.usuario }],
    tarefas: [task],
    permissoes: { podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: true, podeAprovarOrcamento: true }
};

beforeEach(() => {
    getPlanejamentoRecursos.mockResolvedValue(resourcePanel);
    salvarPlanejamentoTarefa.mockResolvedValue(task);
    excluirPlanejamentoTarefa.mockResolvedValue(true);
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

describe("Planejamento de recursos", () => {
    it("preserva as tres visoes especializadas e carrega as tarefas", async () => {
        const user = userEvent.setup();
        render(<ProjectResourcePlanningManagement />);
        expect(await screen.findByText("Cadastro operacional de recursos")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Cadastro de tarefas" }));
        expect(await screen.findByRole("cell", { name: "Implementar autenticacao" })).toBeInTheDocument();
        expect(screen.getAllByText("10 h")).toHaveLength(2);
        await user.click(screen.getByRole("button", { name: "Cadastro de planejamento" }));
        expect(screen.getByText("Planejamento operacional carregado")).toBeInTheDocument();
    });

    it("cria tarefa convertendo horas e valor para o contrato do servico", async () => {
        const user = userEvent.setup();
        render(<ProjectResourcePlanningManagement />);
        await user.click(await screen.findByRole("button", { name: "Cadastro de tarefas" }));
        await screen.findByRole("cell", { name: "Implementar autenticacao" });
        await user.click(screen.getByRole("button", { name: "Incluir" }));
        const dialog = screen.getByRole("dialog", { name: "Cadastrar tarefa" });
        await user.type(within(dialog).getByRole("textbox", { name: /Funcionalidade/ }), "Revisar autorizacao");
        await user.type(within(dialog).getByRole("spinbutton", { name: "Horas estimadas" }), "12.5");
        await user.type(within(dialog).getByRole("spinbutton", { name: "Valor por hora" }), "150");
        await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(salvarPlanejamentoTarefa).toHaveBeenCalledWith(expect.objectContaining({
            recursoIds: ["r1"], funcionalidade: "Revisar autorizacao", estimativaMinutos: 750,
            valorHora: "150.0000", moeda: "BRL", ativo: true
        })));
    });

    it("bloqueia manutencao sem permissao e apresenta falha de carga", async () => {
        const user = userEvent.setup();
        getPlanejamentoRecursos.mockResolvedValue({ ...resourcePanel, recursos: [], permissoes: {} });
        const view = render(<ProjectResourcePlanningManagement />);
        await user.click(await screen.findByRole("button", { name: "Cadastro de tarefas" }));
        await screen.findByRole("cell", { name: "Implementar autenticacao" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Incluir\. Indisponível/ })).toBeDisabled(),
    );
        view.unmount();

        getPlanejamentoRecursos.mockRejectedValue(new Error("Planejamento indisponivel."));
        render(<ProjectResourcePlanningManagement />);
        expect(await screen.findByRole("alert")).toHaveTextContent("Planejamento indisponivel.");
    });
});

describe("Orcamento do projeto", () => {
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
        getOrcamento.mockResolvedValue({ financeiro: null, recursos: [], tarefas: [], permissoes: { podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: true } });
        render(<ProjectBudgetManagement />);
        const create = await screen.findByRole("button", { name: /Criar or.amento em BRL/ });
        await user.click(create);
        await waitFor(() => expect(salvarOrcamento).toHaveBeenCalledWith({ projetoId: "p1", moeda: "BRL" }));
    });

    it("registra categoria, custo fixo e aprova o orcamento versionado", async () => {
        const user = userEvent.setup();
        render(<ProjectBudgetManagement />);
        expect(await screen.findByText("Hospedagem")).toBeInTheDocument();

        const categoryForm = screen.getByRole("heading", { name: "Nova categoria" }).closest("form");
        await user.type(within(categoryForm).getByRole("textbox", { name: "Nome" }), "Licencas");
        const categoryValues = within(categoryForm).getAllByRole("spinbutton");
        await user.clear(categoryValues[0]); await user.type(categoryValues[0], "2000");
        await user.click(within(categoryForm).getByRole("button", { name: "Adicionar categoria" }));
        await waitFor(() => expect(salvarCategoriaOrcamento).toHaveBeenCalledWith(expect.objectContaining({ projetoId: "p1", nome: "Licencas", valorPlanejado: "2000" })));

        const costForm = screen.getByRole("heading", { name: "Novo custo" }).closest("form");
        await user.type(within(costForm).getByRole("textbox", { name: /Descri/ }), "Certificado digital");
        const costValues = within(costForm).getAllByRole("spinbutton");
        await user.clear(costValues[0]); await user.type(costValues[0], "500");
        await user.click(within(costForm).getByRole("button", { name: "Adicionar custo" }));
        await waitFor(() => expect(salvarCustoProjeto).toHaveBeenCalledWith(expect.objectContaining({ projetoId: "p1", tipo: "FIXO", descricao: "Certificado digital", valorPlanejado: "500" })));

        await user.click(screen.getByRole("button", { name: /Aprovar or.amento/ }));
        await waitFor(() => expect(aprovarOrcamento).toHaveBeenCalledWith({ projetoId: "p1", id: "o1", versao: 4 }));
    });

    it("oculta dados financeiros e manutencao quando o backend nega acesso", async () => {
        getOrcamento.mockResolvedValue({ ...budgetPanel, permissoes: { podeVisualizarFinanceiro: false } });
        render(<ProjectBudgetManagement />);
        expect(await screen.findByText(/n.o possui acesso aos dados financeiros/)).toBeInTheDocument();
        expect(screen.queryByText("Hospedagem")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Aprovar or.amento/ })).not.toBeInTheDocument();
    });
});
