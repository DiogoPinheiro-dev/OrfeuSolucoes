// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getBacklogProjetos } from "../../../../services/Projetos/BacklogService";
import {
    abrirProjetoAnexo,
    createProjetoAtualizacao,
    createProjetoComentario,
    excluirProjetoAnexo,
    excluirProjetoComentario,
    getComunicacaoProjetos,
    getProjetoComunicacao,
    updateProjetoAtualizacao,
    updateProjetoComentario,
    uploadProjetoAnexos
} from "../../../../services/Projetos/ComunicacaoService";
import {
    archiveDependencia,
    createDependencia,
    getCronograma,
    updateCronogramaItemDatas
} from "../../../../services/Projetos/CronogramaService";
import CronogramaManagement from "../../../components/CronogramaManagement";
import ProjectCommunicationManagement from "../../../components/ProjectCommunicationManagement";

vi.mock("../../../../services/Projetos/BacklogService", () => ({ getBacklogProjetos: vi.fn() }));
vi.mock("../../../../services/Projetos/CronogramaService", () => ({
    archiveDependencia: vi.fn(), createDependencia: vi.fn(), getCronograma: vi.fn(), updateCronogramaItemDatas: vi.fn()
}));
vi.mock("../../../../services/Projetos/ComunicacaoService", () => ({
    abrirProjetoAnexo: vi.fn(), createProjetoAtualizacao: vi.fn(), createProjetoComentario: vi.fn(),
    excluirProjetoAnexo: vi.fn(), excluirProjetoComentario: vi.fn(), getComunicacaoProjetos: vi.fn(),
    getProjetoComunicacao: vi.fn(), updateProjetoAtualizacao: vi.fn(), updateProjetoComentario: vi.fn(),
    uploadProjetoAnexos: vi.fn()
}));

const project = { id: "p1", chave: "ORF", nome: "Orfeu Evolucao", arquivadoEm: null };
const firstItem = {
    id: "i1", tipo: "ITEM", chave: "ORF-1", titulo: "Implementar autenticacao", grupo: "Backlog",
    inicioEm: "2026-08-11", fimEm: "2026-08-15", progressoPercentual: 25, semPeriodo: false,
    bloqueado: false, riscoAtraso: false, arquivado: false, versao: 3
};
const secondItem = { ...firstItem, id: "i2", chave: "ORF-2", titulo: "Revisar permissoes", inicioEm: "2026-08-18", fimEm: "2026-08-20", versao: 1 };
const dependency = { id: "d1", versao: 2, bloqueador: firstItem, bloqueado: secondItem, arquivadoEm: null };
const timelinePanel = {
    inicioEm: "2026-08-11", fimEm: "2026-08-20", elementos: [firstItem, secondItem], dependencias: [dependency],
    inconsistencias: [{ codigo: "GAP", severidade: "AVISO", mensagem: "Existe intervalo entre as atividades." }],
    permissoes: { podeGerenciarDependencias: true, podeEditarDatas: true }
};

const author = { id: "u1", nome: "Gestora" };
const update = { id: "a1", versao: 2, conteudo: "Projeto dentro do prazo.", saudePercebida: "EM_DIA", podeEditar: true, historico: [] };
const comment = { id: "c1", versao: 1, conteudo: "Validacao concluida.", podeEditar: true, podeExcluir: true, historico: [] };
const feedItem = {
    id: "f1", tipo: "ATUALIZACAO", entidadeId: "a1", conteudo: update.conteudo, saudePercebida: "EM_DIA",
    criadoEm: "2026-08-11T12:00:00.000Z", autor: author, autorAcao: author, funcionalidade: "Comunicacao do projeto",
    evento: "CRIADO", entidade: "ATUALIZACAO", registro: "Atualizacao semanal", contexto: "Projeto ORF", editado: false,
    anexos: [], alteracoes: []
};
const communicationPanel = {
    atualizacoes: [update], comentarios: [comment], feed: [feedItem], feedTotal: 1, feedPagina: 1,
    feedLimite: 5, feedTotalPaginas: 1, itensDisponiveis: [firstItem], ultimaAtualizacaoEm: feedItem.criadoEm,
    permissoes: { podePublicarAtualizacao: true, podeComentar: true, podeGerenciarAnexos: true }
};

function LocationProbe() {
    const location = useLocation();
    return <output aria-label="Rota atual">{location.pathname}{location.search}</output>;
}

const renderCronograma = () => render(
    <MemoryRouter initialEntries={["/hub/projetos/cronograma-e-gantt"]}>
        <CronogramaManagement />
        <LocationProbe />
    </MemoryRouter>
);

beforeEach(() => {
    getBacklogProjetos.mockResolvedValue([project]);
    getCronograma.mockResolvedValue(timelinePanel);
    createDependencia.mockResolvedValue(dependency);
    archiveDependencia.mockResolvedValue({ ...dependency, arquivadoEm: "2026-08-11T12:00:00.000Z" });
    updateCronogramaItemDatas.mockResolvedValue(firstItem);
    getComunicacaoProjetos.mockResolvedValue([project]);
    getProjetoComunicacao.mockResolvedValue(communicationPanel);
    createProjetoAtualizacao.mockResolvedValue(update);
    updateProjetoAtualizacao.mockResolvedValue(update);
    createProjetoComentario.mockResolvedValue(comment);
    updateProjetoComentario.mockResolvedValue(comment);
    excluirProjetoComentario.mockResolvedValue(true);
    uploadProjetoAnexos.mockResolvedValue([]);
    abrirProjetoAnexo.mockResolvedValue({ objectUrl: "blob:test", nomeArquivo: "arquivo.txt" });
    excluirProjetoAnexo.mockResolvedValue(true);
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("Cronograma e Gantt", () => {
    it("protege o preenchimento parcial da dependencia ao fechar pelo teclado", async () => {
        const user = userEvent.setup();
        renderCronograma();
        await screen.findByText("Existe intervalo entre as atividades.");

        await user.click(screen.getByRole("button", { name: /Incluir depend.ncia/ }));
        const dependencyDialog = screen.getByRole("dialog", { name: /Incluir depend.ncia/ });
        await user.selectOptions(within(dependencyDialog).getAllByRole("combobox")[0], "i1");
        await user.keyboard("{Escape}");

        expect(screen.getByRole("alertdialog", { name: /Descartar altera/ })).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Descartar" }));
        expect(screen.queryByRole("dialog", { name: /Incluir depend.ncia/ })).not.toBeInTheDocument();
    });

    it("carrega elementos, inconsistencias e navega ao backlog", async () => {
        const user = userEvent.setup();
        renderCronograma();
        expect(await screen.findByRole("heading", { name: /Inconsist.ncias do cronograma/ })).toBeInTheDocument();
        expect(screen.getByLabelText("Resumo do cronograma")).toHaveTextContent("2 elementos");
        expect(screen.getByText("Existe intervalo entre as atividades.")).toBeInTheDocument();

        await user.click(screen.getByTitle("Abrir Implementar autenticacao"));
        expect(screen.getByRole("status", { name: "Rota atual" })).toHaveTextContent("/hub/projetos/backlog-de-demandas?projetoId=p1&itemId=i1");
    });

    it("inclui dependencia valida e atualiza datas pelo contrato versionado", async () => {
        const user = userEvent.setup();
        renderCronograma();
        await screen.findByText("Existe intervalo entre as atividades.");
        await user.click(screen.getByRole("button", { name: /Incluir depend.ncia/ }));
        const dependencyDialog = screen.getByRole("dialog", { name: /Incluir depend.ncia/ });
        const selects = within(dependencyDialog).getAllByRole("combobox");
        await user.selectOptions(selects[0], "i1");
        await user.selectOptions(selects[1], "i2");
        await user.click(within(dependencyDialog).getByRole("button", { name: "Incluir" }));
        await waitFor(() => expect(createDependencia).toHaveBeenCalledWith({ projetoId: "p1", bloqueadorId: "i1", bloqueadoId: "i2" }));

        await user.click(screen.getByText("Tabela equivalente do cronograma"));
        const firstRow = screen.getByRole("cell", { name: /ORF-1/ }).closest("tr");
        await user.click(within(firstRow).getByRole("button", { name: /Datas/ }));
        const dateDialog = screen.getByRole("dialog", { name: /Editar per/ });
        const dateInputs = within(dateDialog).getAllByDisplayValue(/2026-08/);
        await user.clear(dateInputs[1]);
        await user.type(dateInputs[1], "2026-08-16");
        await user.click(within(dateDialog).getByRole("button", { name: /Confirmar altera/ }));
        await waitFor(() => expect(updateCronogramaItemDatas).toHaveBeenCalledWith({
            id: "i1", versao: 3, inicioPrevistoEm: "2026-08-11", fimPrevistoEm: "2026-08-16"
        }));
    });

    it("mantem operacoes bloqueadas sem permissao e apresenta falha de carga", async () => {
        getCronograma.mockResolvedValueOnce({ ...timelinePanel, permissoes: {} });
        const view = renderCronograma();
        expect(await screen.findByRole("button", { name: /Incluir depend.ncia/ })).toBeDisabled();
        view.unmount();

        getCronograma.mockRejectedValue(new Error("Cronograma indisponivel."));
        renderCronograma();
        expect(await screen.findByRole("alert")).toHaveTextContent("Cronograma indisponivel.");
    });
});

describe("Comunicacao do projeto", () => {
    it("carrega o feed e publica atualizacao com saude percebida", async () => {
        const user = userEvent.setup();
        render(<ProjectCommunicationManagement />);
        expect(await screen.findByRole("button", { name: /Ver detalhes: Projeto dentro do prazo/ })).toBeInTheDocument();
        await user.type(screen.getByRole("textbox", { name: /Nova atualiza/ }), "Marco principal concluido.");
        await user.selectOptions(screen.getByRole("combobox", { name: /Percep/ }), "EM_DIA");
        await user.click(screen.getByRole("button", { name: "Publicar" }));

        await waitFor(() => expect(createProjetoAtualizacao).toHaveBeenCalledWith({
            projetoId: "p1", conteudo: "Marco principal concluido.", saudePercebida: "EM_DIA"
        }));
        expect(await screen.findByText(/Publica..o adicionada ao feed/)).toBeInTheDocument();
    });

    it("publica comentario vinculado a item do backlog", async () => {
        const user = userEvent.setup();
        render(<ProjectCommunicationManagement />);
        await screen.findByRole("button", { name: /Ver detalhes/ });
        await user.click(screen.getByRole("button", { name: /Coment.rio/ }));
        await user.selectOptions(screen.getByRole("combobox", { name: "Comentar em" }), "ITEM");
        await user.selectOptions(screen.getByRole("combobox", { name: /Alvo/ }), "i1");
        await user.type(screen.getByRole("textbox", { name: /Novo coment.rio/ }), "Validar com seguranca.");
        await user.click(screen.getByRole("button", { name: "Publicar" }));
        await waitFor(() => expect(createProjetoComentario).toHaveBeenCalledWith({
            projetoId: "p1", conteudo: "Validar com seguranca.", atualizacaoId: null, itemId: "i1"
        }));
    });

    it("abre detalhes do evento por teclado e oculta o compositor sem permissao", async () => {
        const user = userEvent.setup();
        const view = render(<ProjectCommunicationManagement />);
        const card = await screen.findByRole("button", { name: /Ver detalhes/ });
        card.focus();
        await user.keyboard("{Enter}");
        expect(await screen.findByRole("dialog", { name: "Detalhes do evento do projeto" })).toHaveTextContent("Atualizacao semanal");
        view.unmount();

        getProjetoComunicacao.mockResolvedValue({ ...communicationPanel, permissoes: {} });
        render(<ProjectCommunicationManagement />);
        await screen.findByRole("button", { name: /Ver detalhes/ });
        expect(screen.queryByRole("button", { name: "Publicar" })).not.toBeInTheDocument();
    });
});
