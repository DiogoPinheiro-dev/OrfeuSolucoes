// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apolloClient } from "../../lib/apolloClient";
import { HUB_NAVIGATION_CHANGED_EVENT } from "../../auth/hubNavigationEvents";
import { ServiceError } from "../../../services/graphql/serviceError";
import * as BacklogService from "../../../services/Projetos/BacklogService";
import * as ChamadoService from "../../../services/Chamados/ChamadoService";
import * as ComunicacaoService from "../../../services/Projetos/ComunicacaoService";
import * as CronogramaService from "../../../services/Projetos/CronogramaService";
import * as DocumentacaoService from "../../../services/Documentacao/DocumentacaoService";
import * as EmpresaService from "../../../services/Empresas/EmpresaService";
import * as GrupoUsuarioService from "../../../services/GruposUsuarios/GrupoUsuarioService";
import * as MarcoEntregaService from "../../../services/Projetos/MarcoEntregaService";
import * as OrcamentoService from "../../../services/Projetos/OrcamentoService";
import * as ProjetoService from "../../../services/Projetos/ProjetoService";
import * as RecursoService from "../../../services/Projetos/RecursoService";
import * as ServicoCreateService from "../../../services/Servicos/CreateServices";
import * as ServicoGetService from "../../../services/Servicos/GetServices";
import * as SolucaoService from "../../../services/Solucoes/SolucaoService";
import * as SprintService from "../../../services/Projetos/SprintService";
import * as UserService from "../../../services/Users/UserService";

vi.mock("../../lib/apolloClient", () => ({
    apolloClient: {
        query: vi.fn(),
        mutate: vi.fn(),
        clearStore: vi.fn()
    }
}));

const data = new Proxy({}, {
    get: (_, property) => {
        if (property === "then") return undefined;
        if (property === Symbol.toPrimitive) return () => "value";
        return data;
    }
});

const input = {
    id: "1",
    chamadoId: "1",
    projetoId: "projeto-1",
    nome: "Registro",
    login: "usuario",
    email: "usuario@example.com",
    senha: "segredo",
    empresaIds: [1],
    grupoId: 1,
    solucaoId: 1,
    funcionalidadeId: 2,
    usuarioIds: [1]
};

const modules = {
    BacklogService,
    ChamadoService,
    ComunicacaoService,
    CronogramaService,
    DocumentacaoService,
    EmpresaService,
    GrupoUsuarioService,
    MarcoEntregaService,
    OrcamentoService,
    ProjetoService,
    RecursoService,
    ServicoCreateService,
    ServicoGetService,
    SolucaoService,
    SprintService,
    UserService
};

const specializedMethods = new Set([
    "abrirChamadoAnexo",
    "abrirProjetoAnexo",
    "chamadoAnexoDownloadUrl",
    "downloadChamadoRelatorio",
    "excluirProjetoAnexo",
    "uploadChamadoAnexos",
    "uploadProjetoAnexos"
]);

const cases = Object.entries(modules).flatMap(([moduleName, service]) =>
    Object.entries(service)
        .filter(([methodName, value]) => typeof value === "function" && !specializedMethods.has(methodName))
        .map(([methodName, method]) => ({ moduleName, methodName, method }))
);

const argsFor = (methodName) => {
    if (methodName === "getProjetoComunicacao") return ["projeto-1", {}];
    if (methodName.includes("Painel")) return ["projeto-1", false];
    if (methodName.startsWith("archive")) return [input, false];
    if (/^(get|delete|arquivar|reativar)/.test(methodName)) return ["1"];
    return [input];
};

describe("serviços Apollo", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apolloClient.query.mockResolvedValue({ data });
        apolloClient.mutate.mockResolvedValue({ data });
    });

    it.each(cases)("$moduleName.$methodName executa o contrato positivo", async ({ methodName, method }) => {
        await expect(method(...argsFor(methodName))).resolves.toBeDefined();
        expect(apolloClient.query.mock.calls.length + apolloClient.mutate.mock.calls.length).toBeGreaterThan(0);
    });

    it.each(cases)("$moduleName.$methodName normaliza falhas técnicas", async ({ moduleName, methodName, method }) => {
        const failure = new Error("Network error: failed to fetch");
        apolloClient.query.mockRejectedValue(failure);
        apolloClient.mutate.mockRejectedValue(failure);
        vi.spyOn(console, "error").mockImplementation(() => {});

        const rejection = await method(...argsFor(methodName)).then(() => null, (error) => error);
        expect(rejection, `${moduleName}.${methodName}`).toBeInstanceOf(ServiceError);
    });

    it("notifica o Hub ao incluir, alterar e excluir funcionalidade", async () => {
        const listener = vi.fn();
        window.addEventListener(HUB_NAVIGATION_CHANGED_EVENT, listener);

        await SolucaoService.createFuncionalidade(input);
        await SolucaoService.updateFuncionalidade(input);
        await SolucaoService.deleteFuncionalidade(input.id);

        expect(listener).toHaveBeenCalledTimes(3);
        window.removeEventListener(HUB_NAVIGATION_CHANGED_EVENT, listener);
    });
});
