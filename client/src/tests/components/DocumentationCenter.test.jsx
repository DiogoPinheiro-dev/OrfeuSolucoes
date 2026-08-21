// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buscarDocumentacao, getDocumentacaoArtigo, getDocumentacaoIndice } from "../../../services/Documentacao/DocumentacaoService";
import DocumentationCenter from "../../pages/DocumentationCenter";

vi.mock("../../../services/Documentacao/DocumentacaoService", () => ({
    buscarDocumentacao: vi.fn(),
    getDocumentacaoArtigo: vi.fn(),
    getDocumentacaoIndice: vi.fn()
}));
vi.mock("../../components/Header", () => ({ default: () => <header>Header</header> }));
vi.mock("../../components/Footer", () => ({ default: () => <footer>Footer</footer> }));

const metadata = {
    id: "solucoes.projetos.backlog-visao-geral",
    slug: "backlog-visao-geral",
    titulo: "Backlog de demandas",
    resumo: "Como trabalhar com demandas.",
    categoria: "solucao",
    audiencia: "usuario",
    ordem: 20,
    validadoEm: "2026-08-10",
    palavrasChave: ["backlog", "demanda"],
    solucao: "projetos",
    funcionalidade: "backlog-de-demandas",
    registryKey: "projetos.backlog-de-demandas"
};

function LocationProbe() {
    return <output aria-label="Rota atual">{useLocation().pathname}</output>;
}

const renderAt = (path) => render(
    <MemoryRouter initialEntries={[path]}>
        <LocationProbe />
        <Routes>
            <Route path="/hub/documentacao" element={<DocumentationCenter />} />
            <Route path="/hub/documentacao/:articleSlug" element={<DocumentationCenter />} />
        </Routes>
    </MemoryRouter>
);

describe("Central de Documentação", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getDocumentacaoIndice.mockResolvedValue([metadata]);
        getDocumentacaoArtigo.mockResolvedValue({ ...metadata, conteudo: "# Backlog de demandas\n\n## Pré-requisitos\n\nConteúdo validado." });
        buscarDocumentacao.mockResolvedValue([{ ...metadata, trecho: "Organize a prioridade das demandas." }]);
    });
    afterEach(() => {
        cleanup();
        document.title = "";
    });

    it("carrega o catálogo e apresenta o estado inicial orientativo", async () => {
        renderAt("/hub/documentacao");
        expect(screen.getByRole("heading", { name: "Documentação" })).toBeInTheDocument();
        expect(await screen.findByRole("link", { name: "Backlog de demandas" })).toHaveAttribute("href", "/hub/documentacao/backlog-visao-geral");
        expect(screen.getByRole("heading", { name: "Selecione um artigo" })).toBeInTheDocument();
        expect(getDocumentacaoArtigo).not.toHaveBeenCalled();
    });

    it("resolve ajuda contextual pelo registry key e abre o artigo correspondente", async () => {
        renderAt("/hub/documentacao?registryKey=projetos.backlog-de-demandas");
        await waitFor(() => expect(getDocumentacaoIndice).toHaveBeenCalledWith({ registryKey: "projetos.backlog-de-demandas" }));
        await waitFor(() => expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/hub/documentacao/backlog-visao-geral"));
        expect(await screen.findByText("Conteúdo validado.")).toBeInTheDocument();
    });

    it("orienta a consulta geral quando não existe ajuda contextual", async () => {
        getDocumentacaoIndice.mockResolvedValue([]);
        renderAt("/hub/documentacao?registryKey=configurador.cadastro-de-usuarios");
        expect(await screen.findByText("Nenhuma ajuda contextual disponível para esta funcionalidade.")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Consultar toda a documentação" })).toHaveAttribute("href", "/hub/documentacao");
    });

    it("carrega artigo pela URL, renderiza o conteúdo e o sumário", async () => {
        renderAt("/hub/documentacao/backlog-visao-geral");
        expect(await screen.findByText("Conteúdo validado.")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Pré-requisitos" })).toHaveAttribute("href", "#user-content-pré-requisitos");
        expect(screen.getByText("Validado em 10/08/2026")).toBeInTheDocument();
        expect(screen.getByText("Nível: Usuário")).toBeInTheDocument();
        await waitFor(() => {
            expect(document.title).toBe("Backlog de demandas | Documentação | Orfeu Soluções");
        });
    });

    it("pesquisa no backend e navega para o resultado escolhido", async () => {
        const user = userEvent.setup();
        renderAt("/hub/documentacao");
        await screen.findByRole("link", { name: "Backlog de demandas" });
        await user.type(screen.getByRole("searchbox", { name: "Pesquisar na documentação" }), "prioridade");
        expect(await screen.findByText("Organize a prioridade das demandas.")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /Backlog de demandas/ }));
        expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/hub/documentacao/backlog-visao-geral");
        await waitFor(() => expect(getDocumentacaoArtigo).toHaveBeenCalledWith("backlog-visao-geral"));
    });

    it("oferece nova tentativa quando o catálogo falha", async () => {
        const user = userEvent.setup();
        getDocumentacaoIndice.mockRejectedValue(new Error("Serviço indisponível."));
        renderAt("/hub/documentacao");
        expect(await screen.findByRole("alert")).toHaveTextContent("Serviço indisponível.");
        getDocumentacaoIndice.mockResolvedValue([metadata]);
        await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
        expect(await screen.findByRole("link", { name: "Backlog de demandas" })).toBeInTheDocument();
        expect(getDocumentacaoIndice).toHaveBeenCalledTimes(3);
    });

    it("diferencia catálogo vazio e pesquisa sem resultados", async () => {
        getDocumentacaoIndice.mockResolvedValue([]);
        buscarDocumentacao.mockResolvedValue([]);
        const user = userEvent.setup();
        renderAt("/hub/documentacao");
        expect(await screen.findByText("Nenhum artigo disponível para seu perfil.")).toBeInTheDocument();
        await user.type(screen.getByRole("searchbox", { name: "Pesquisar na documentação" }), "inexistente");
        expect(await screen.findByText("Nenhum artigo encontrado. Tente termos mais gerais.")).toBeInTheDocument();
    });
});
