// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    alterarStatusChamado,
    criarChamado,
    getAcompanhantesElegiveisChamado,
    getCategoriasChamado,
    getOpcoesAberturaChamado,
    getPrioridadesChamado,
    getResponsaveisParaAberturaChamado,
    getResponsaveisFiltroChamado,
    getTiposChamado,
    uploadChamadoAnexos
} from "../../../services/Chamados/ChamadoService";
import ChamadoCreate from "../../components/ChamadoCreate";
import ChamadosList from "../../components/ChamadosList";
import { useAuth } from "../../hooks/useAuth";

vi.mock("../../../services/Chamados/ChamadoService", () => ({
    alterarStatusChamado: vi.fn(),
    criarChamado: vi.fn(),
    getAcompanhantesElegiveisChamado: vi.fn(),
    getCategoriasChamado: vi.fn(),
    getOpcoesAberturaChamado: vi.fn(),
    getPrioridadesChamado: vi.fn(),
    getResponsaveisParaAberturaChamado: vi.fn(),
    getResponsaveisFiltroChamado: vi.fn(),
    getTiposChamado: vi.fn(),
    uploadChamadoAnexos: vi.fn()
}));
vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../components/ChamadoDetail", () => ({ default: ({ chamadoId }) => <div>Detalhe {chamadoId}</div> }));

const permissions = { podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true };
const solution = { id: 10, nome: "Controle de Chamados", funcionalidades: [{ id: 11, label: "Painel de atendimento" }] };
const responsible = { id: "USUARIO:u2", tipo: "USUARIO", usuarioId: "u2", nome: "Atendente" };
const chamado = {
    id: "ch-1", titulo: "Falha no faturamento", descricao: "Nota fiscal indisponível", status: "ABERTO",
    tipoId: 1, tipoNome: "Incidente", prioridadeId: 2, prioridadeNome: "Alta", solicitanteId: "u1",
    solicitanteNome: "Solicitante", responsavelNome: "Atendente", atualizadoEm: "2026-08-11T12:00:00.000Z", acompanhantes: []
};

function LocationProbe() {
    const location = useLocation();
    return <output aria-label="Rota atual">{location.pathname}</output>;
}

const renderCreate = () => render(
    <MemoryRouter initialEntries={["/hub/controle-de-chamados/abrir-chamado"]}>
        <ChamadoCreate permissions={permissions} />
        <LocationProbe />
    </MemoryRouter>
);

beforeEach(() => {
    useAuth.mockReturnValue({ user: { id: "u1", login: "solicitante", grupo: {} } });
    getCategoriasChamado.mockResolvedValue([{ id: 3, nome: "Financeiro" }]);
    getTiposChamado.mockResolvedValue([{ id: 1, nome: "Incidente" }]);
    getPrioridadesChamado.mockResolvedValue([{ id: 2, nome: "Alta" }]);
    getOpcoesAberturaChamado.mockResolvedValue({ solucoes: [solution] });
    getAcompanhantesElegiveisChamado.mockResolvedValue([{ id: "u3", nome: "Observadora", grupoNome: "Suporte" }]);
    getResponsaveisParaAberturaChamado.mockResolvedValue([responsible]);
    getResponsaveisFiltroChamado.mockResolvedValue([{ tipo: "USUARIO", usuarioId: "u2", responsavelNome: "Atendente" }]);
    criarChamado.mockResolvedValue({ id: "ch-1" });
    alterarStatusChamado.mockResolvedValue({ ...chamado, status: "EM_ATENDIMENTO" });
    uploadChamadoAnexos.mockResolvedValue([]);
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("Fluxos operacionais do Controle de Chamados", () => {
    it("carrega opções e impede abertura incompleta", async () => {
        renderCreate();

        expect(await screen.findByRole("heading", { name: "Abrir chamado" })).toBeInTheDocument();
        const submitButton = await screen.findByRole("button", { name: "Abrir chamado" });
        fireEvent.submit(submitButton.closest("form"));
        expect(await screen.findByRole("alert")).toHaveTextContent("Preencha titulo e descricao");
        expect(criarChamado).not.toHaveBeenCalled();
    });

    it("abre chamado com responsável e acompanhantes e navega ao detalhe", async () => {
        const user = userEvent.setup();
        renderCreate();
        await screen.findByRole("heading", { name: "Abrir chamado" });

        await user.type(screen.getByRole("textbox", { name: "Titulo" }), "Falha no faturamento");
        await user.type(screen.getByRole("textbox", { name: "Descricao" }), "Não foi possível emitir a nota fiscal.");
        await user.selectOptions(screen.getByRole("combobox", { name: "Solucao" }), "10");
        await user.selectOptions(screen.getByRole("combobox", { name: "Funcionalidade" }), "11");
        await user.click(screen.getByRole("checkbox", { name: /Observadora/ }));
        await user.click(screen.getByRole("button", { name: "Abrir chamado" }));

        const dialog = await screen.findByRole("dialog", { name: "Selecionar responsavel" });
        expect(dialog).toHaveTextContent("Atendente");
        await user.click(screen.getAllByRole("button", { name: "Abrir chamado" }).at(-1));

        await waitFor(() => expect(criarChamado).toHaveBeenCalledWith({
            titulo: "Falha no faturamento",
            descricao: "Não foi possível emitir a nota fiscal.",
            tipoId: 1,
            prioridadeId: 2,
            categoriaId: null,
            solucaoId: 10,
            funcionalidadeId: 11,
            responsavelId: "u2",
            responsavelGrupoId: null,
            acompanhanteIds: ["u3"]
        }));
        expect(screen.getByRole("status", { name: "Rota atual" })).toHaveTextContent("/hub/controle-de-chamados/meus-chamados/ch-1");
    }, 15000);

    it("permite abrir sem responsável quando não existe candidato", async () => {
        const user = userEvent.setup();
        getResponsaveisParaAberturaChamado.mockResolvedValue([]);
        renderCreate();
        await screen.findByRole("heading", { name: "Abrir chamado" });

        await user.type(screen.getByRole("textbox", { name: "Titulo" }), "Dúvida operacional");
        await user.type(screen.getByRole("textbox", { name: "Descricao" }), "Preciso de orientação para concluir o processo.");
        await user.selectOptions(screen.getByRole("combobox", { name: "Solucao" }), "10");
        await user.click(screen.getByRole("button", { name: "Abrir chamado" }));
        await user.click(await screen.findByRole("button", { name: "Abrir sem responsavel" }));

        await waitFor(() => expect(criarChamado).toHaveBeenCalledWith(expect.objectContaining({ responsavelId: null, responsavelGrupoId: null })));
    });

    it("expõe falha de carregamento e bloqueia o formulário sem permissão", async () => {
        getCategoriasChamado.mockRejectedValue(new Error("Serviço indisponível."));
        const view = renderCreate();
        expect(await screen.findByRole("alert")).toHaveTextContent("Serviço indisponível.");
        view.unmount();

        getCategoriasChamado.mockResolvedValue([{ id: 3, nome: "Financeiro" }]);
        useAuth.mockReturnValue({ user: { id: "u1", login: "solicitante", grupo: {} } });
        render(
            <MemoryRouter>
                <ChamadoCreate permissions={{ podeVisualizar: true, podeIncluir: false }} />
            </MemoryRouter>
        );
        expect(await screen.findByRole("button", { name: "Abrir chamado" })).toBeDisabled();
        expect(screen.getByText(/nao possui permissao para abrir chamados/i)).toBeInTheDocument();
    });

    it("carrega o Kanban, aplica filtros e abre o detalhe por teclado", async () => {
        const user = userEvent.setup();
        const loadChamados = vi.fn().mockResolvedValue({ items: [chamado], total: 1, page: 1, pageSize: 100 });
        render(
            <MemoryRouter initialEntries={["/hub/controle-de-chamados/meus-chamados"]}>
                <ChamadosList title="Meus chamados" description="Acompanhe" areaSlug="meus-chamados" loadChamados={loadChamados} permissions={permissions} mode="meus" />
                <LocationProbe />
            </MemoryRouter>
        );

        await screen.findByRole("button", { name: /Falha no faturamento/ });
        expect(screen.getByLabelText("Chamados por status")).toBeInTheDocument();
        await user.type(screen.getByRole("searchbox", { name: "Buscar" }), "faturamento");
        await waitFor(() => expect(loadChamados).toHaveBeenLastCalledWith(expect.objectContaining({ termo: "faturamento", page: 1, pageSize: 100 })));
        (await screen.findByRole("button", { name: /Falha no faturamento/ })).focus();
        await user.keyboard("{Enter}");
        await waitFor(() => expect(screen.getByRole("status", { name: "Rota atual" })).toHaveTextContent("/hub/controle-de-chamados/meus-chamados/ch-1"));
    });

    it("mostra falha e estado vazio da fila sem esconder os filtros", async () => {
        const loadChamados = vi.fn().mockRejectedValueOnce(new Error("Fila indisponível.")).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 100 });
        const view = render(
            <MemoryRouter>
                <ChamadosList title="Painel de atendimento" description="Fila" areaSlug="painel-atendimento" loadChamados={loadChamados} permissions={permissions} mode="painel" />
            </MemoryRouter>
        );
        expect(await screen.findByRole("alert")).toHaveTextContent("Fila indisponível.");
        expect(screen.getByRole("searchbox", { name: "Buscar" })).toBeInTheDocument();
        view.unmount();

        render(
            <MemoryRouter>
                <ChamadosList title="Chamados arquivados" description="Arquivo" areaSlug="chamados-arquivados" loadChamados={loadChamados} permissions={permissions} mode="arquivados" />
            </MemoryRouter>
        );
        expect(await screen.findByText("Nenhum chamado encontrado para os filtros atuais.")).toBeInTheDocument();
    });

    it("move chamado no Kanban somente pelo contrato autorizado", async () => {
        useAuth.mockReturnValue({ user: { id: "admin", login: "admin", grupo: {} } });
        const loadChamados = vi.fn().mockResolvedValue({ items: [chamado], total: 1, page: 1, pageSize: 100 });
        render(
            <MemoryRouter>
                <ChamadosList title="Painel de atendimento" description="Fila" areaSlug="painel-atendimento" loadChamados={loadChamados} permissions={permissions} mode="painel" />
            </MemoryRouter>
        );
        const card = await screen.findByRole("button", { name: /Falha no faturamento/ });
        const destination = screen.getByText("Em atendimento", { selector: "span" }).closest("section");
        const data = new Map();
        const dataTransfer = {
            effectAllowed: "none",
            dropEffect: "none",
            setData: (type, value) => data.set(type, value),
            getData: (type) => data.get(type) || ""
        };

        fireEvent.dragStart(card, { dataTransfer });
        fireEvent.dragOver(destination, { dataTransfer });
        fireEvent.drop(destination, { dataTransfer });

        await waitFor(() => expect(alterarStatusChamado).toHaveBeenCalledWith({
            chamadoId: "ch-1",
            status: "EM_ATENDIMENTO",
            observacao: "Status alterado pelo Kanban."
        }));
    });
});
