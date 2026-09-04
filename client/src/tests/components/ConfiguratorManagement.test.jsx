// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getEmpresas as getAuthEmpresas } from "../../../services/Auth/AuthService";
import { createEmpresa, deleteEmpresa, getEmpresas, updateEmpresa } from "../../../services/Empresas/EmpresaService";
import { createGrupoUsuario, deleteGrupoUsuario, getGruposUsuarios, updateGrupoUsuario } from "../../../services/GruposUsuarios/GrupoUsuarioService";
import { createFuncionalidade, createSolucao, deleteFuncionalidade, deleteSolucao, getSolucoes, updateFuncionalidade, updateSolucao } from "../../../services/Solucoes/SolucaoService";
import {
    createActionDraft,
    createFeatureDraft,
    getActionDraft,
    getCatalogProviders,
    getFeatureDraft,
    publishActionDraft,
    publishFeatureDraft,
    validateActionDraft,
    validateFeatureDraft
} from "../../../services/Solucoes/CatalogoService";
import { createUser, deleteUser, getUsers, updateUser } from "../../../services/Users/UserService";
import CompanyManagement from "../../components/CompanyManagement";
import FeatureManagement from "../../components/FeatureManagement";
import GroupManagement from "../../components/GroupManagement";
import SolutionManagement from "../../components/SolutionManagement";
import UserManagement from "../../components/UserManagement";
import { useAuth } from "../../hooks/useAuth";

vi.mock("../../../services/Auth/AuthService", () => ({ getEmpresas: vi.fn() }));
vi.mock("../../../services/Empresas/EmpresaService", () => ({
    createEmpresa: vi.fn(), deleteEmpresa: vi.fn(), getEmpresas: vi.fn(), updateEmpresa: vi.fn()
}));
vi.mock("../../../services/GruposUsuarios/GrupoUsuarioService", () => ({
    createGrupoUsuario: vi.fn(), deleteGrupoUsuario: vi.fn(), getGruposUsuarios: vi.fn(), updateGrupoUsuario: vi.fn()
}));
vi.mock("../../../services/Solucoes/SolucaoService", () => ({
    createFuncionalidade: vi.fn(), createSolucao: vi.fn(), deleteFuncionalidade: vi.fn(), deleteSolucao: vi.fn(),
    getSolucoes: vi.fn(), updateFuncionalidade: vi.fn(), updateSolucao: vi.fn()
}));
vi.mock("../../../services/Solucoes/CatalogoService", () => ({
    createActionDraft: vi.fn(), createFeatureDraft: vi.fn(), getActionDraft: vi.fn(), getCatalogProviders: vi.fn(),
    getFeatureDraft: vi.fn(), publishActionDraft: vi.fn(), publishFeatureDraft: vi.fn(),
    validateActionDraft: vi.fn(), validateFeatureDraft: vi.fn()
}));
vi.mock("../../../services/Users/UserService", () => ({
    createUser: vi.fn(), deleteUser: vi.fn(), getUsers: vi.fn(), updateUser: vi.fn()
}));
vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));

const adminUser = {
    login: "admin",
    podeVisualizar: true,
    podeIncluir: true,
    podeAlterar: true,
    podeExcluir: true,
    grupo: { acessoEcommerce: true, acessoProjetos: true, acessoHoras: true, acessoConfigurador: true }
};
const permissions = { podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true };
const solution = {
    id: 1,
    slug: "configurador",
    nome: "Configurador",
    descricao: "Cadastros administrativos",
    ordem: 1,
    ativo: true,
    exibirNoHub: true,
    somenteAdminSistema: false,
    padraoSistema: false,
    funcionalidades: [{
        id: 11,
        slug: "usuarios",
        titulo: "Usuários",
        label: "Usuários",
        registryKey: "configurador.cadastro-de-usuarios",
        providerKey: "configurador.cadastro-de-usuarios",
        providerVersion: 1,
        statusPublicacao: "PUBLICADA",
        ordem: 1,
        ativo: true,
        padraoSistema: true,
        acoes: []
    }, {
        id: 12,
        slug: "rotina-customizada",
        titulo: "Rotina customizada",
        label: "Rotina customizada",
        registryKey: "configurador.rotina-customizada",
        providerKey: "configurador.cadastro-de-usuarios",
        providerVersion: 1,
        statusPublicacao: "RASCUNHO",
        ordem: 2,
        ativo: false,
        padraoSistema: false,
        acoes: []
    }]
};
const standardSolution = {
    id: 90,
    slug: "documentacao",
    nome: "Documentação",
    descricao: "Central de conhecimento",
    ordem: 900,
    ativo: true,
    exibirNoHub: true,
    somenteAdminSistema: false,
    padraoSistema: true,
    funcionalidades: []
};
const inactiveHoursSolution = {
    id: 91,
    slug: "horas",
    nome: "Controle de Horas",
    descricao: "Módulo indisponível",
    ordem: 20,
    ativo: false,
    exibirNoHub: false,
    somenteAdminSistema: false,
    padraoSistema: true,
    funcionalidades: []
};
const projectSolution = {
    id: 92,
    slug: "projetos",
    nome: "Gerenciador de Projetos",
    descricao: "Gestão de projetos",
    ordem: 30,
    ativo: true,
    exibirNoHub: true,
    somenteAdminSistema: false,
    padraoSistema: true,
    funcionalidades: [{
        id: 921,
        slug: "cadastro-de-projetos",
        titulo: "Cadastro de projetos",
        label: "Projetos",
        registryKey: "projetos.cadastro-de-projetos",
        ordem: 1,
        ativo: true,
        padraoSistema: true,
        acoes: [
            { id: 1, chave: "visualizar", nome: "Visualizar", ativo: true },
            { id: 2, chave: "incluir", nome: "Incluir", ativo: true },
            { id: 3, chave: "alterar", nome: "Alterar", ativo: true },
            { id: 4, chave: "excluir", nome: "Excluir", ativo: true },
            { id: 5, chave: "gerenciar_membros", nome: "Gerenciar membros", ativo: true },
            { id: 6, chave: "alterar_status", nome: "Alterar status", ativo: true },
            { id: 7, chave: "reativar_projeto", nome: "Reativar projeto", ativo: true }
        ]
    }]
};
const company = { id: 1, nome: "Empresa teste", padraoSistema: false, solucaoIds: [1], funcionalidadeIds: [11] };
const systemCompany = { id: 2, nome: "Empresa padrão", padraoSistema: true, solucaoIds: [1], funcionalidadeIds: [11] };
const customGroup = { id: 2, nome: "Equipe", descricao: "Grupo customizado", padraoSistema: false, solucaoIds: [], funcionalidadeIds: [], funcionalidadePermissoes: [] };
const group = { id: 1, nome: "Administradores", descricao: "Grupo padrão", padraoSistema: true, solucaoIds: [1], funcionalidadeIds: [11], funcionalidadePermissoes: [] };
const registeredUser = { id: "u1", nome: "Usuário teste", login: "usuario", email: "usuario@teste.local", padraoSistema: false, grupo: group, empresas: [company] };

const systemUser = { id: "admin", nome: "Administrador", login: "admin", email: "admin@teste.local", padraoSistema: true, grupo: group, empresas: [systemCompany] };

const screens = [
    ["usuários", UserManagement, "Cadastro de usuários"],
    ["grupos", GroupManagement, "Cadastro de grupos"],
    ["empresas", CompanyManagement, "Cadastro de empresas"],
    ["soluções", SolutionManagement, "Cadastro de soluções"],
    ["funcionalidades", FeatureManagement, "Cadastro de funcionalidades"]
];

const readonlyScreens = [
    ["usuários", UserManagement, "usuario@teste.local", "Cadastro de usuário"],
    ["grupos", GroupManagement, "Equipe", "Cadastro de grupo"],
    ["empresas", CompanyManagement, "Empresa teste", "Cadastro de empresa"],
    ["soluções", SolutionManagement, "Configurador", "Cadastro de solução"],
    ["funcionalidades", FeatureManagement, "Rotina customizada", "Cadastro de funcionalidade"]
];

beforeEach(() => {
    useAuth.mockReturnValue({ user: adminUser });
    getAuthEmpresas.mockResolvedValue([company, systemCompany]);
    getEmpresas.mockResolvedValue([company, systemCompany]);
    getGruposUsuarios.mockResolvedValue([group, customGroup]);
    getSolucoes.mockResolvedValue([solution, standardSolution]);
    getCatalogProviders.mockResolvedValue([
        { key: "configurador.cadastro-de-usuarios", version: 1 },
        { key: "projetos.backlog-de-demandas", version: 1 }
    ]);
    getFeatureDraft.mockResolvedValue(null);
    getActionDraft.mockResolvedValue(null);
    createFeatureDraft.mockResolvedValue({ id: "feature-draft", revisao: 1 });
    createActionDraft.mockResolvedValue({ id: "action-draft", revisao: 1 });
    validateFeatureDraft.mockResolvedValue([]);
    validateActionDraft.mockResolvedValue([]);
    publishFeatureDraft.mockResolvedValue({ id: "feature-draft", estado: "PUBLICADA" });
    publishActionDraft.mockResolvedValue({ id: "action-draft", estado: "PUBLICADA" });
    getUsers.mockResolvedValue([registeredUser, systemUser]);
    createEmpresa.mockResolvedValue(company);
    updateEmpresa.mockResolvedValue(company);
    deleteEmpresa.mockResolvedValue(true);
    createGrupoUsuario.mockResolvedValue(group);
    updateGrupoUsuario.mockResolvedValue(group);
    deleteGrupoUsuario.mockResolvedValue(true);
    createSolucao.mockResolvedValue(solution);
    updateSolucao.mockResolvedValue(solution);
    deleteSolucao.mockResolvedValue(true);
    createFuncionalidade.mockResolvedValue(solution.funcionalidades[0]);
    updateFuncionalidade.mockResolvedValue(solution.funcionalidades[0]);
    deleteFuncionalidade.mockResolvedValue(true);
    createUser.mockResolvedValue(registeredUser);
    updateUser.mockResolvedValue(registeredUser);
    deleteUser.mockResolvedValue(true);
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("CRUDs do Configurador", () => {
    it.each(screens)("carrega %s no CrudGrid compartilhado", async (_name, Component, title) => {
        render(<Component permissions={permissions} />);

        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText("Processando...")).not.toBeInTheDocument());
        expect(screen.getByRole("toolbar", { name: "Ações do cadastro" })).toBeInTheDocument();
        expect(screen.getByRole("searchbox", { name: "Pesquisar" })).toBeInTheDocument();
    });

    it("explica a quantidade de funcionalidades ativas e cadastradas", async () => {
        render(<SolutionManagement permissions={permissions} />);

        expect(await screen.findByRole("cell", { name: "1 ativa / 2 cadastradas" })).toBeInTheDocument();
        expect(screen.getAllByRole("cell", { name: "0 ativas / 0 cadastradas" })).toHaveLength(1);
    });

    it.each(readonlyScreens)("mantém %s realmente somente leitura ao visualizar", async (_name, Component, rowText, dialogName) => {
        const user = userEvent.setup();
        render(<Component permissions={permissions} />);

        await user.click(await screen.findByRole("cell", { name: rowText }));
        await user.click(screen.getByRole("button", { name: "Visualizar" }));

        const dialog = screen.getByRole("dialog", { name: dialogName });
        expect(within(dialog).getAllByRole("textbox")[0]).toBeDisabled();
        expect(within(dialog).queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
    });

    it("recupera o cadastro de soluções após falha de carregamento", async () => {
        const user = userEvent.setup();
        getSolucoes.mockRejectedValue(new Error("Serviço indisponível."));
        render(<SolutionManagement permissions={permissions} />);

        expect(await screen.findByRole("alert")).toHaveTextContent("Serviço indisponível.");
        getSolucoes.mockResolvedValue([solution]);
        await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

        expect(await screen.findByRole("cell", { name: "Configurador" })).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("explica por que um registro padrão não pode ser marcado para exclusão", async () => {
        render(<GroupManagement permissions={permissions} />);

        const checkbox = await screen.findByRole("checkbox", {
            name: /Selecionar Administradores\. Indisponível: Grupos padrão do sistema não podem ser excluídos\./
        });
        expect(checkbox).toBeDisabled();
        expect(checkbox).toHaveAttribute("title", "Grupos padrão do sistema não podem ser excluídos.");
    });

    it.each([
        ["empresa", CompanyManagement, "Cadastro de empresa"],
        ["grupo", GroupManagement, "Cadastro de grupo"]
    ])("não oferece soluções sistêmicas ou inativas como vínculo de %s", async (_name, Component, dialogName) => {
        const user = userEvent.setup();
        getSolucoes.mockResolvedValue([solution, standardSolution, inactiveHoursSolution]);
        render(<Component permissions={permissions} />);

        await waitFor(() => expect(screen.queryByText("Processando...")).not.toBeInTheDocument());
        await user.click(screen.getByRole("button", { name: "Incluir" }));
        const dialog = screen.getByRole("dialog", { name: dialogName });

        expect(within(dialog).queryByRole("checkbox", { name: "Documentação" })).not.toBeInTheDocument();
        expect(within(dialog).queryByRole("checkbox", { name: "Controle de Horas" })).not.toBeInTheDocument();
        expect(screen.queryByRole("columnheader", { name: "Documentação" })).not.toBeInTheDocument();
        expect(screen.queryByRole("columnheader", { name: "Controle de Horas" })).not.toBeInTheDocument();
    });

    it("mantém as ações bloqueadas quando a funcionalidade não concede permissão", async () => {
        useAuth.mockReturnValue({ user: { login: "usuario", podeVisualizar: true, grupo: {} } });
        render(<SolutionManagement permissions={{ podeVisualizar: true, podeIncluir: false, podeAlterar: false, podeExcluir: false }} />);
        await screen.findByRole("cell", { name: "Configurador" });

        expect(screen.getByRole("button", { name: /Incluir\. Indisponível/ })).toBeDisabled();
        expect(screen.getByRole("button", { name: /Excluir selecionados\. Indisponível/ })).toBeDisabled();
    });

    it("preserva o fluxo completo de solução: incluir, visualizar, alterar e excluir", async () => {
        const user = userEvent.setup();
        render(<SolutionManagement permissions={permissions} />);
        await screen.findByRole("cell", { name: "Configurador" });

        await user.click(screen.getByRole("button", { name: "Incluir" }));
        await user.type(screen.getByRole("textbox", { name: "Nome" }), "Nova solução");
        await user.type(screen.getByRole("textbox", { name: "Identificador" }), "nova-solucao");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(createSolucao).toHaveBeenCalledWith(expect.objectContaining({ nome: "Nova solução", slug: "nova-solucao" })));

        await user.click(screen.getByRole("cell", { name: "Configurador" }));
        await user.click(screen.getByRole("button", { name: "Visualizar" }));
        const viewDialog = screen.getByRole("dialog", { name: "Cadastro de solução" });
        expect(viewDialog).toBeInTheDocument();
        await user.click(within(viewDialog).getAllByRole("button", { name: "Fechar" }).at(-1));

        await user.click(screen.getByRole("button", { name: "Alterar" }));
        const nameInput = screen.getByRole("textbox", { name: "Nome" });
        await user.clear(nameInput);
        await user.type(nameInput, "Configurador atualizado");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(updateSolucao).toHaveBeenCalledWith(expect.objectContaining({ id: 1, nome: "Configurador atualizado" })));

        await user.click(screen.getByRole("checkbox", { name: "Selecionar Configurador" }));
        await user.click(screen.getByRole("button", { name: "Excluir selecionados" }));
        await user.click(screen.getByRole("button", { name: "OK" }));
        await waitFor(() => expect(deleteSolucao).toHaveBeenCalledWith(1));
    }, 15000);

    it("permite alterar somente a ordem de uma solução padrão", async () => {
        const user = userEvent.setup();
        render(<SolutionManagement permissions={permissions} />);

        await screen.findByRole("cell", { name: "Documentação" });
        expect(screen.getByRole("checkbox", { name: /Selecionar Documentação\. Indisponível:/ })).toBeDisabled();
        await user.click(screen.getByRole("cell", { name: "Documentação" }));
        await user.click(screen.getByRole("button", { name: "Alterar" }));
        const dialog = screen.getByRole("dialog", { name: "Cadastro de solução" });
        expect(within(dialog).getByRole("textbox", { name: "Nome" })).toBeDisabled();
        const orderInput = within(dialog).getByRole("spinbutton", { name: "Ordem" });
        expect(orderInput).toBeEnabled();
        await user.clear(orderInput);
        await user.type(orderInput, "850");
        await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(updateSolucao).toHaveBeenCalledWith({ id: 90, ordem: 850 }));
    });

    it("permite alterar a ordem de uma funcionalidade padrão", async () => {
        const user = userEvent.setup();
        render(<FeatureManagement permissions={permissions} />);

        await user.click(await screen.findByRole("button", { name: /Mostrar funcionalidades padrão/ }));
        await user.click(await screen.findByRole("cell", { name: "Usuários" }));
        await user.click(screen.getByRole("button", { name: "Alterar" }));
        const dialog = screen.getByRole("dialog", { name: "Cadastro de funcionalidade" });
        expect(within(dialog).getByRole("textbox", { name: /T.tulo/ })).toBeDisabled();
        const orderInput = within(dialog).getByRole("spinbutton", { name: "Ordem" });
        expect(orderInput).toBeEnabled();
        await user.clear(orderInput);
        await user.type(orderInput, "15");
        await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(updateFuncionalidade).toHaveBeenCalledWith(expect.objectContaining({ id: 11, ordem: 15 })));
    });

    it("executa inclusão, alteração e exclusão de usuário", async () => {
        const user = userEvent.setup();
        render(<UserManagement permissions={permissions} />);
        await screen.findByText("usuario@teste.local");

        await user.click(screen.getByRole("button", { name: "Incluir" }));
        await user.type(screen.getByRole("textbox", { name: "Nome" }), "Nova usuária");
        await user.type(screen.getByRole("textbox", { name: "Login" }), "nova.usuario");
        await user.type(screen.getByRole("textbox", { name: "E-mail" }), "nova@teste.local");
        await user.type(screen.getByLabelText("Senha"), "Senha@123");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ login: "nova.usuario" })));

        await user.click(screen.getByText("usuario@teste.local"));
        await user.click(screen.getByRole("button", { name: "Alterar" }));
        const email = screen.getByRole("textbox", { name: "E-mail" });
        await user.clear(email);
        await user.type(email, "alterado@teste.local");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ id: "u1", email: "alterado@teste.local" })));

        await user.click(screen.getByRole("checkbox", { name: /Selecionar Usu/ }));
        await user.click(screen.getByRole("button", { name: "Excluir selecionados" }));
        await user.click(screen.getByRole("button", { name: "OK" }));
        await waitFor(() => expect(deleteUser).toHaveBeenCalledWith("u1"));
    }, 15000);

    it("executa inclusão, alteração e exclusão de grupo customizado", async () => {
        const user = userEvent.setup();
        render(<GroupManagement permissions={permissions} />);
        await screen.findByRole("cell", { name: "Equipe" });

        await user.click(screen.getByRole("button", { name: "Incluir" }));
        await user.type(screen.getByRole("textbox", { name: /Nome/ }), "Operadores");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(createGrupoUsuario).toHaveBeenCalledWith(expect.objectContaining({ nome: "Operadores" })));

        await user.click(screen.getByRole("cell", { name: "Equipe" }));
        await user.click(screen.getByRole("button", { name: "Alterar" }));
        const description = screen.getByRole("textbox", { name: /Descri/ });
        await user.clear(description);
        await user.type(description, "Equipe atualizada");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(updateGrupoUsuario).toHaveBeenCalledWith(expect.objectContaining({ id: 2, descricao: "Equipe atualizada" })));

        await user.click(screen.getByRole("checkbox", { name: "Selecionar Equipe" }));
        await user.click(screen.getByRole("button", { name: "Excluir selecionados" }));
        await user.click(screen.getByRole("button", { name: "OK" }));
        await waitFor(() => expect(deleteGrupoUsuario).toHaveBeenCalledWith(2));
    }, 15000);

    it("identifica cada permissão pelo nome da ação e da rotina", async () => {
        const user = userEvent.setup();
        render(<GroupManagement permissions={permissions} />);
        await user.click(await screen.findByRole("cell", { name: "Equipe" }));
        await user.click(screen.getByRole("button", { name: "Alterar" }));
        await user.click(screen.getByRole("tab", { name: "Soluções" }));
        await user.click(screen.getByRole("checkbox", { name: "Configurador" }));
        await user.click(screen.getByRole("tab", { name: "Permissões por rotina" }));

        const contextualNames = [
            "Visualizar — Usuários",
            "Incluir — Usuários",
            "Alterar — Usuários",
            "Excluir — Usuários",
            "Visualizar — Rotina customizada",
            "Incluir — Rotina customizada",
            "Alterar — Rotina customizada",
            "Excluir — Rotina customizada"
        ];

        contextualNames.forEach((name) => expect(screen.getByRole("checkbox", { name })).toBeInTheDocument());
        expect(new Set(contextualNames).size).toBe(contextualNames.length);
    });

    it("marca todas as permissões básicas e dinâmicas de uma funcionalidade", async () => {
        const user = userEvent.setup();
        getSolucoes.mockResolvedValue([projectSolution]);
        render(<GroupManagement permissions={permissions} />);

        await waitFor(() => expect(screen.queryByText("Processando...")).not.toBeInTheDocument());
        await user.click(screen.getByRole("button", { name: "Incluir" }));
        await user.type(screen.getByRole("textbox", { name: /Nome/ }), "Gestores de projetos");
        await user.click(screen.getByRole("tab", { name: "Soluções" }));
        await user.click(screen.getByRole("checkbox", { name: "Gerenciador de Projetos" }));
        await user.click(screen.getByRole("tab", { name: "Permissões por rotina" }));

        const selectAllButton = screen.getByRole("button", {
            name: "Marcar todas as permissões — Cadastro de projetos"
        });
        expect(screen.getByRole("checkbox", { name: "Incluir — Cadastro de projetos" })).not.toBeChecked();
        await user.click(selectAllButton);

        projectSolution.funcionalidades[0].acoes.forEach((acao) => {
            expect(screen.getByRole("checkbox", { name: `${acao.nome} — Cadastro de projetos` })).toBeChecked();
        });
        expect(screen.getByRole("checkbox", { name: /Cadastro de projetos\s*Gerenciador de Projetos/ })).toBeChecked();
        expect(selectAllButton).toBeDisabled();

        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(createGrupoUsuario).toHaveBeenCalledWith(expect.objectContaining({
            nome: "Gestores de projetos",
            solucaoIds: [projectSolution.id],
            funcionalidadeIds: [projectSolution.funcionalidades[0].id],
            funcionalidadePermissoes: [expect.objectContaining({
                podeVisualizar: true,
                podeIncluir: true,
                podeAlterar: true,
                podeExcluir: true,
                acoes: projectSolution.funcionalidades[0].acoes.map((acao) => expect.objectContaining({
                    acaoId: acao.id,
                    permitido: true
                }))
            })]
        })));
    });

    it("executa inclusão e alteração de empresa e preserva a mensagem de dependência", async () => {
        const user = userEvent.setup();
        render(<CompanyManagement permissions={permissions} />);
        await screen.findByRole("cell", { name: "Empresa teste" });

        await user.click(screen.getByRole("button", { name: "Incluir" }));
        await user.type(screen.getByRole("textbox", { name: /Nome/ }), "Nova empresa");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(createEmpresa).toHaveBeenCalledWith(expect.objectContaining({ nome: "Nova empresa" })));

        await user.click(screen.getByRole("cell", { name: "Empresa teste" }));
        await user.click(screen.getByRole("button", { name: "Alterar" }));
        const name = screen.getByRole("textbox", { name: /Nome/ });
        await user.clear(name);
        await user.type(name, "Empresa atualizada");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(updateEmpresa).toHaveBeenCalledWith(expect.objectContaining({ id: 1, nome: "Empresa atualizada" })));

        deleteEmpresa.mockRejectedValueOnce(new Error("Empresa possui usuários vinculados."));
        await user.click(screen.getByRole("checkbox", { name: "Selecionar Empresa teste" }));
        await user.click(screen.getByRole("button", { name: "Excluir selecionados" }));
        await user.click(screen.getByRole("button", { name: "OK" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Empresa possui usuários vinculados.");
    }, 15000);

    it("executa inclusão, alteração e exclusão de funcionalidade customizada", async () => {
        const user = userEvent.setup();
        render(<FeatureManagement permissions={permissions} />);
        await screen.findByRole("cell", { name: "Rotina customizada" });
        const initialLoadCount = getSolucoes.mock.calls.length;

        await user.click(screen.getByRole("button", { name: "Incluir" }));
        await user.click(screen.getByRole("button", { name: /Selecionar solu/ }));
        await user.click(screen.getByRole("option", { name: "Configurador" }));
        await user.type(screen.getByRole("textbox", { name: /T.tulo/ }), "Nova rotina");
        await user.type(screen.getByRole("textbox", { name: "Identificador" }), "nova-rotina");
        await user.click(screen.getByRole("button", { name: "Selecionar implementação da funcionalidade" }));
        await user.click(screen.getByRole("option", { name: "configurador.cadastro-de-usuarios" }));
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(createFuncionalidade).toHaveBeenCalledWith(expect.objectContaining({
            titulo: "Nova rotina",
            slug: "nova-rotina",
            providerKey: "configurador.cadastro-de-usuarios",
            providerVersion: 1
        })));
        await waitFor(() => expect(getSolucoes).toHaveBeenCalledTimes(initialLoadCount + 1));

        await user.click(screen.getByRole("cell", { name: "Rotina customizada" }));
        await user.click(screen.getByRole("button", { name: "Alterar" }));
        const title = screen.getByRole("textbox", { name: /T.tulo/ });
        await user.clear(title);
        await user.type(title, "Rotina atualizada");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(updateFuncionalidade).toHaveBeenCalledWith(expect.objectContaining({ id: 12, titulo: "Rotina atualizada" })));
        await waitFor(() => expect(getSolucoes).toHaveBeenCalledTimes(initialLoadCount + 2));

        await user.click(screen.getByRole("checkbox", { name: "Selecionar Rotina customizada" }));
        await user.click(screen.getByRole("button", { name: "Excluir selecionados" }));
        await user.click(screen.getByRole("button", { name: "OK" }));
        await waitFor(() => expect(deleteFuncionalidade).toHaveBeenCalledWith(12));
        await waitFor(() => expect(getSolucoes).toHaveBeenCalledTimes(initialLoadCount + 3));
    }, 15000);

    it("publica ações validadas antes da funcionalidade e reaproveita rascunhos existentes", async () => {
        const user = userEvent.setup();
        const featureWithAction = {
            ...solution,
            funcionalidades: solution.funcionalidades.map((feature) => feature.id !== 12 ? feature : {
                ...feature,
                acoes: [{ id: 21, chave: "visualizar", nome: "Visualizar", ativo: true, statusPublicacao: "RASCUNHO" }]
            })
        };
        getSolucoes.mockResolvedValue([featureWithAction, standardSolution]);
        getFeatureDraft.mockResolvedValue({ id: "feature-existing-draft", revisao: 3 });
        getActionDraft.mockResolvedValue({ id: "action-existing-draft", revisao: 2 });

        render(<FeatureManagement permissions={permissions} />);
        await user.click(await screen.findByRole("cell", { name: "Rotina customizada" }));
        await user.click(screen.getByRole("button", { name: "Publicar" }));
        await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Publicar" }));

        await waitFor(() => expect(publishFeatureDraft).toHaveBeenCalledWith(expect.objectContaining({
            versionId: "feature-existing-draft",
            expectedRevision: 3
        })));
        expect(createFeatureDraft).not.toHaveBeenCalled();
        expect(createActionDraft).not.toHaveBeenCalled();
        expect(publishActionDraft).toHaveBeenCalledWith(expect.objectContaining({
            versionId: "action-existing-draft",
            expectedRevision: 2
        }));
        expect(publishActionDraft.mock.invocationCallOrder[0]).toBeLessThan(publishFeatureDraft.mock.invocationCallOrder[0]);
    });

    it("mantém erro de campo no modal e explica todas as proteções padrão", async () => {
        const user = userEvent.setup();
        createUser.mockRejectedValueOnce(Object.assign(new Error("Revise os campos."), { fieldErrors: { email: "E-mail já cadastrado." } }));
        const userView = render(<UserManagement permissions={permissions} />);
        expect(await screen.findByRole("checkbox", { name: /Selecionar Administrador.*Indispon/ })).toBeDisabled();
        await user.click(screen.getByRole("button", { name: "Incluir" }));
        await user.type(screen.getByRole("textbox", { name: "Login" }), "duplicado");
        await user.type(screen.getByRole("textbox", { name: "E-mail" }), "duplicado@teste.local");
        await user.type(screen.getByLabelText("Senha"), "Senha@123");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("E-mail já cadastrado.");
        expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveAttribute("aria-invalid", "true");
        userView.unmount();

        const companyView = render(<CompanyManagement permissions={permissions} />);
        expect(await screen.findByRole("checkbox", { name: /Selecionar Empresa padrão.*Indispon/ })).toBeDisabled();
        companyView.unmount();

        render(<FeatureManagement permissions={permissions} />);
        await user.click(await screen.findByRole("button", { name: /Mostrar funcionalidades padrão/ }));
        expect(await screen.findByRole("checkbox", { name: /Selecionar Usu.*Indispon/ })).toBeDisabled();
    });
});
