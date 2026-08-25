// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    createChamadoCategoria,
    createChamadoPrioridade,
    createChamadoResponsavel,
    createChamadoSlaRegra,
    createChamadoTipo,
    createGoogleEmailConta,
    deleteChamadoCategoria,
    deleteChamadoPrioridade,
    deleteChamadoResponsavel,
    deleteChamadoSlaRegra,
    deleteChamadoTipo,
    deleteGoogleEmailConta,
    getCategoriasChamado,
    getGoogleEmailContas,
    getPrioridadesChamado,
    getResponsaveisChamado,
    getResponsaveisChamadoOptions,
    getRegrasSlaChamado,
    getTiposChamado,
    updateChamadoCategoria,
    updateChamadoPrioridade,
    updateChamadoResponsavel,
    updateChamadoSlaRegra,
    updateChamadoTipo,
    updateGoogleEmailConta
} from "../../../services/Chamados/ChamadoService";
import CategoriaChamadoManagement from "../../components/CategoriaChamadoManagement";
import ChamadoConfiguracaoManagement from "../../components/ChamadoConfiguracaoManagement";
import GoogleEmailManagement from "../../components/GoogleEmailManagement";
import ResponsavelChamadoManagement from "../../components/ResponsavelChamadoManagement";
import SlaChamadoManagement from "../../components/SlaChamadoManagement";
import { useAuth } from "../../hooks/useAuth";

vi.mock("../../../services/Chamados/ChamadoService", () => ({
    createChamadoCategoria: vi.fn(), createChamadoPrioridade: vi.fn(), createChamadoResponsavel: vi.fn(), createChamadoSlaRegra: vi.fn(), createChamadoTipo: vi.fn(),
    createGoogleEmailConta: vi.fn(),
    deleteChamadoCategoria: vi.fn(), deleteChamadoPrioridade: vi.fn(), deleteChamadoResponsavel: vi.fn(), deleteChamadoSlaRegra: vi.fn(), deleteChamadoTipo: vi.fn(),
    deleteGoogleEmailConta: vi.fn(),
    getCategoriasChamado: vi.fn(), getPrioridadesChamado: vi.fn(), getRegrasSlaChamado: vi.fn(), getResponsaveisChamado: vi.fn(), getResponsaveisChamadoOptions: vi.fn(), getTiposChamado: vi.fn(),
    getGoogleEmailContas: vi.fn(),
    updateChamadoCategoria: vi.fn(), updateChamadoPrioridade: vi.fn(), updateChamadoResponsavel: vi.fn(), updateChamadoSlaRegra: vi.fn(), updateChamadoTipo: vi.fn(),
    updateGoogleEmailConta: vi.fn()
}));
vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));

const permissions = { podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true };
const admin = { login: "admin", podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true, grupo: { acessoConfigurador: true } };
const tipo = { id: 1, nome: "Incidente", descricao: "Falha do sistema", cor: "#cc0000", ordem: 1, ativo: true };
const prioridade = { id: 2, nome: "Alta", descricao: "Atendimento prioritário", cor: "#ff9900", ordem: 2, ativo: true };
const categoria = { id: 3, nome: "Financeiro", descricao: "Assuntos financeiros", ativo: true };
const regra = { id: 4, prioridadeId: 2, prioridadeNome: "Alta", primeiraRespostaPrazoMinutos: 60, resolucaoPrazoMinutos: 480, modoContagem: "CORRIDO", ativo: true };
const emailAccount = { id: 5, nome: "Notificações", tipo: "GMAIL", emailGoogle: "avisos@teste.local", conectado: false, ativo: true, principal: false };
const responsavel = {
    id: 6, tipo: "USUARIO", usuarioId: "u1", responsavelNome: "Atendente", usuarioEmail: "atendente@teste.local", ativo: true,
    solucoes: [{ solucaoId: 10, solucaoNome: "Controle de Chamados", responsavelGeral: true, ativo: true, funcionalidades: [] }]
};
const responsibleOptions = {
    usuarios: [{ id: "u1", nome: "Atendente", email: "atendente@teste.local", grupoNome: "Suporte" }],
    grupos: [{ id: 7, nome: "Suporte", usuariosCount: 2 }],
    solucoes: [{ id: 10, nome: "Controle de Chamados", funcionalidades: [{ id: 11, label: "Painel de atendimento" }] }]
};

beforeEach(() => {
    useAuth.mockReturnValue({ user: admin });
    getTiposChamado.mockResolvedValue([tipo]);
    getPrioridadesChamado.mockResolvedValue([prioridade]);
    getCategoriasChamado.mockResolvedValue([categoria]);
    getRegrasSlaChamado.mockResolvedValue([regra]);
    getGoogleEmailContas.mockResolvedValue([emailAccount]);
    getResponsaveisChamado.mockResolvedValue([responsavel]);
    getResponsaveisChamadoOptions.mockResolvedValue(responsibleOptions);
    createChamadoTipo.mockResolvedValue(tipo);
    updateChamadoTipo.mockResolvedValue(tipo);
    deleteChamadoTipo.mockResolvedValue(true);
    createChamadoPrioridade.mockResolvedValue(prioridade);
    updateChamadoPrioridade.mockResolvedValue(prioridade);
    deleteChamadoPrioridade.mockResolvedValue(true);
    createChamadoCategoria.mockResolvedValue(categoria);
    updateChamadoCategoria.mockResolvedValue(categoria);
    deleteChamadoCategoria.mockResolvedValue(true);
    createChamadoSlaRegra.mockResolvedValue(regra);
    updateChamadoSlaRegra.mockResolvedValue(regra);
    deleteChamadoSlaRegra.mockResolvedValue(true);
    createGoogleEmailConta.mockResolvedValue(emailAccount);
    updateGoogleEmailConta.mockResolvedValue(emailAccount);
    deleteGoogleEmailConta.mockResolvedValue(true);
    createChamadoResponsavel.mockResolvedValue(responsavel);
    updateChamadoResponsavel.mockResolvedValue(responsavel);
    deleteChamadoResponsavel.mockResolvedValue(true);
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("Configurações do Controle de Chamados", () => {
    it.each([
        ["tipos", "Tipos de chamados", "Incidente"],
        ["prioridades", "Prioridades de chamados", "Alta"]
    ])("carrega, pesquisa e visualiza %s em modo somente leitura", async (kind, title, rowName) => {
        const user = userEvent.setup();
        render(<ChamadoConfiguracaoManagement kind={kind} permissions={permissions} />);

        expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
        await user.type(screen.getByRole("searchbox", { name: "Pesquisar" }), "inexistente");
        expect(screen.queryByRole("cell", { name: rowName })).not.toBeInTheDocument();
        await user.clear(screen.getByRole("searchbox", { name: "Pesquisar" }));
        await user.click(await screen.findByRole("cell", { name: rowName }));
        await user.click(screen.getByRole("button", { name: "Visualizar" }));

        const dialog = screen.getByRole("dialog", { name: kind === "tipos" ? "Tipo de chamado" : "Prioridade de chamado" });
        expect(within(dialog).getByRole("textbox", { name: /Nome/ })).toBeDisabled();
        expect(within(dialog).queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
    });

    it("preserva inclusão, alteração e desativação de tipo", async () => {
        const user = userEvent.setup();
        render(<ChamadoConfiguracaoManagement kind="tipos" permissions={permissions} />);
        await screen.findByRole("cell", { name: "Incidente" });

        await user.click(screen.getByRole("button", { name: "Incluir" }));
        await user.type(screen.getByRole("textbox", { name: /Nome/ }), "Solicitação");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(createChamadoTipo).toHaveBeenCalledWith(expect.objectContaining({ nome: "Solicitação" })));

        await user.click(screen.getByRole("cell", { name: "Incidente" }));
        await user.click(screen.getByRole("button", { name: "Alterar" }));
        const name = screen.getByRole("textbox", { name: /Nome/ });
        await user.clear(name);
        await user.type(name, "Incidente crítico");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(updateChamadoTipo).toHaveBeenCalledWith(expect.objectContaining({ id: 1, nome: "Incidente crítico" })));

        await user.click(screen.getByRole("checkbox", { name: "Selecionar Incidente" }));
        await user.click(screen.getByRole("button", { name: "Desativar selecionados" }));
        await user.click(screen.getByRole("button", { name: "OK" }));
        await waitFor(() => expect(deleteChamadoTipo).toHaveBeenCalledWith(1));
    }, 15000);

    it("mantém o erro de validação da categoria associado ao campo", async () => {
        const user = userEvent.setup();
        createChamadoCategoria.mockRejectedValueOnce(Object.assign(new Error("Revise os campos."), { fieldErrors: { nome: "Categoria já cadastrada." } }));
        render(<CategoriaChamadoManagement permissions={permissions} />);
        await screen.findByRole("cell", { name: "Financeiro" });

        await user.click(screen.getByRole("button", { name: "Incluir" }));
        await user.type(screen.getByRole("textbox", { name: /Nome/ }), "Financeiro");
        await user.click(screen.getByRole("button", { name: "Salvar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Categoria já cadastrada.");
        expect(screen.getByRole("textbox", { name: /Nome/ })).toHaveAttribute("aria-invalid", "true");
    });

    it("valida, visualiza e desativa uma regra de SLA", async () => {
        const user = userEvent.setup();
        render(<SlaChamadoManagement permissions={permissions} />);
        await screen.findByRole("cell", { name: "Alta" });

        await user.click(screen.getByRole("button", { name: "Incluir" }));
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        expect(await screen.findByRole("alert")).toHaveTextContent(/prioridade/i);
        await user.click(screen.getAllByRole("button", { name: "Fechar" }).at(-1));

        await user.click(screen.getByRole("cell", { name: "Alta" }));
        await user.click(screen.getByRole("button", { name: "Visualizar" }));
        const dialog = screen.getByRole("dialog", { name: "Regra de SLA" });
        expect(within(dialog).getByRole("combobox", { name: /Prioridade/ })).toBeDisabled();
        expect(within(dialog).queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
        await user.click(within(dialog).getAllByRole("button", { name: "Fechar" }).at(-1));

        await user.click(screen.getByRole("checkbox", { name: /Selecionar/ }));
        await user.click(screen.getByRole("button", { name: "Desativar selecionados" }));
        await user.click(screen.getByRole("button", { name: "OK" }));
        await waitFor(() => expect(deleteChamadoSlaRegra).toHaveBeenCalledWith(4));
    });

    it("bloqueia todas as ações sem permissão", async () => {
        useAuth.mockReturnValue({ user: { login: "usuario", grupo: {} } });
        render(<ChamadoConfiguracaoManagement kind="prioridades" permissions={{ podeVisualizar: true, podeIncluir: false, podeAlterar: false, podeExcluir: false }} />);
        await screen.findByRole("cell", { name: "Alta" });

        expect(screen.getByRole("button", { name: /Incluir\. Indisponível/ })).toBeDisabled();
        expect(screen.getByRole("button", { name: /Desativar selecionados\. Indisponível/ })).toBeDisabled();
    });

    it("preserva inclusão, alteração e confirmação destrutiva da conta Google", async () => {
        const user = userEvent.setup();
        render(<GoogleEmailManagement permissions={permissions} />);
        await screen.findByText(/avisos@teste\.local/);

        await user.type(screen.getByPlaceholderText("Nome da conta"), "Suporte");
        await user.type(screen.getByPlaceholderText("notificacoes@empresa.com"), "suporte@teste.local");
        await user.click(screen.getByRole("button", { name: "Cadastrar conta" }));
        await waitFor(() => expect(createGoogleEmailConta).toHaveBeenCalledWith(expect.objectContaining({ nome: "Suporte", emailGoogle: "suporte@teste.local" })));

        await user.click(screen.getByRole("button", { name: "Editar" }));
        const name = screen.getByPlaceholderText("Nome da conta");
        await user.clear(name);
        await user.type(name, "Avisos atualizados");
        await user.click(screen.getByRole("button", { name: "Salvar conta" }));
        await waitFor(() => expect(updateGoogleEmailConta).toHaveBeenCalledWith(expect.objectContaining({ id: 5, nome: "Avisos atualizados" })));

        await user.click(screen.getByRole("button", { name: "Desativar" }));
        const dialog = screen.getByRole("alertdialog", { name: "Desativar conta Google" });
        await user.click(within(dialog).getByRole("button", { name: "Desativar" }));
        await waitFor(() => expect(deleteGoogleEmailConta).toHaveBeenCalledWith(5));
    }, 15000);

    it("preserva validação, CRUD e modo somente leitura de responsáveis", async () => {
        const user = userEvent.setup();
        render(<ResponsavelChamadoManagement permissions={permissions} />);
        await screen.findByRole("cell", { name: "Atendente" });

        await user.click(screen.getByRole("button", { name: "Incluir" }));
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        expect(await screen.findByText("Selecione o usuário responsável.")).toBeInTheDocument();
        await user.selectOptions(screen.getByRole("combobox", { name: /Usuário responsável/ }), "u1");
        await user.click(screen.getByRole("checkbox", { name: "Controle de Chamados" }));
        await user.click(screen.getByRole("checkbox", { name: "Responsável geral?" }));
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(createChamadoResponsavel).toHaveBeenCalledWith(expect.objectContaining({
            tipo: "USUARIO", usuarioId: "u1", solucoes: [{ solucaoId: 10, responsavelGeral: true, funcionalidadeIds: [] }]
        })));

        await user.click(screen.getByRole("cell", { name: "Atendente" }));
        await user.click(screen.getByRole("button", { name: "Visualizar" }));
        const dialog = screen.getByRole("dialog", { name: "Responsável por atendimento" });
        expect(within(dialog).getByRole("combobox", { name: /Usuário responsável/ })).toBeDisabled();
        expect(within(dialog).queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
        await user.click(within(dialog).getAllByRole("button", { name: "Fechar" }).at(-1));

        await user.click(screen.getByRole("checkbox", { name: "Selecionar Atendente" }));
        await user.click(screen.getByRole("button", { name: "Desativar selecionados" }));
        await user.click(screen.getByRole("button", { name: "OK" }));
        await waitFor(() => expect(deleteChamadoResponsavel).toHaveBeenCalledWith(6));
    }, 15000);

    it.each([
        ["tipos", "Tipo legado", "Incidente", () => {
            getTiposChamado.mockResolvedValue([tipo, { ...tipo, id: 11, nome: "Tipo legado", ativo: false }]);
            return <ChamadoConfiguracaoManagement kind="tipos" permissions={permissions} />;
        }],
        ["prioridades", "Prioridade legada", "Alta", () => {
            getPrioridadesChamado.mockResolvedValue([prioridade, { ...prioridade, id: 12, nome: "Prioridade legada", ativo: false }]);
            return <ChamadoConfiguracaoManagement kind="prioridades" permissions={permissions} />;
        }],
        ["categorias", "Categoria legada", "Financeiro", () => {
            getCategoriasChamado.mockResolvedValue([categoria, { ...categoria, id: 13, nome: "Categoria legada", ativo: false }]);
            return <CategoriaChamadoManagement permissions={permissions} />;
        }],
        ["SLA", "Prioridade legada", "Alta", () => {
            getRegrasSlaChamado.mockResolvedValue([regra, { ...regra, id: 14, prioridadeNome: "Prioridade legada", ativo: false }]);
            return <SlaChamadoManagement permissions={permissions} />;
        }],
        ["responsáveis", "Atendente legado", "Atendente", () => {
            getResponsaveisChamado.mockResolvedValue([responsavel, { ...responsavel, id: 15, responsavelNome: "Atendente legado", ativo: false }]);
            return <ResponsavelChamadoManagement permissions={permissions} />;
        }]
    ])("impede nova desativação de registros inativos em %s", async (_kind, inactiveName, activeName, renderComponent) => {
        const user = userEvent.setup();
        render(renderComponent());

        await screen.findByRole("cell", { name: inactiveName });
        expect(screen.getByRole("checkbox", { name: `Selecionar ${inactiveName}. Indisponível: Este registro já está inativo.` })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Desativar selecionados. Indisponível: Marque ao menos um registro ativo para desativação." })).toBeDisabled();

        await user.click(screen.getByRole("checkbox", { name: `Selecionar ${activeName}` }));
        expect(screen.getByRole("button", { name: "Desativar selecionados" })).toBeEnabled();
    });

    it("reativa um cadastro inativo pela alteração do campo Ativo", async () => {
        const user = userEvent.setup();
        getTiposChamado.mockResolvedValue([{ ...tipo, ativo: false }]);
        render(<ChamadoConfiguracaoManagement kind="tipos" permissions={permissions} />);

        await user.click(await screen.findByRole("cell", { name: "Incidente" }));
        await user.click(screen.getByRole("button", { name: "Alterar" }));
        const activeField = screen.getByRole("checkbox", { name: "Ativo" });
        expect(activeField).not.toBeChecked();
        await user.click(activeField);
        await user.click(screen.getByRole("button", { name: "Salvar" }));

        await waitFor(() => expect(updateChamadoTipo).toHaveBeenCalledWith(expect.objectContaining({ id: 1, ativo: true })));
    });

    it("reativa um responsável pela alteração do campo Ativo", async () => {
        const user = userEvent.setup();
        getResponsaveisChamado.mockResolvedValue([{ ...responsavel, ativo: false }]);
        render(<ResponsavelChamadoManagement permissions={permissions} />);

        await user.click(await screen.findByRole("cell", { name: "Atendente" }));
        await user.click(screen.getByRole("button", { name: "Alterar" }));
        const activeField = screen.getByRole("checkbox", { name: "Ativo" });
        expect(activeField).not.toBeChecked();
        await user.click(activeField);
        await user.click(screen.getByRole("button", { name: "Salvar" }));

        await waitFor(() => expect(updateChamadoResponsavel).toHaveBeenCalledWith(expect.objectContaining({ id: 6, ativo: true })));
    });
});
