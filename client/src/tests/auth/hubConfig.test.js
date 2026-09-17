import { describe, expect, it } from "vitest";

import { getAreaGroup, getGroupTabs, getWorkspaceEntries, normalizeSolutions } from "../../auth/hubConfig";

const [solution] = normalizeSolutions([{
    id: 3,
    slug: "controle-de-chamados",
    nome: "Controle de Chamados",
    agrupamentos: [{ id: 7, slug: "configuracoes-do-atendimento", titulo: "Configurações do atendimento", label: "Configurações", descricao: null, ordem: 50 }],
    funcionalidades: [
        { id: 30, slug: "dashboard", titulo: "Dashboard de chamados", ordem: 45, agrupamentoId: null },
        { id: 31, slug: "tipos", titulo: "Tipos de chamados", label: "Tipos", ordem: 70, agrupamentoId: 7, ordemNoAgrupamento: 2 },
        { id: 32, slug: "prioridades", titulo: "Prioridades de chamados", label: "Prioridades", ordem: 80, agrupamentoId: 7, ordemNoAgrupamento: null },
        { id: 33, slug: "categorias", titulo: "Categorias de chamados", label: "Categorias", ordem: 50, agrupamentoId: 7, ordemNoAgrupamento: 1 },
        { id: 34, slug: "relatorios", titulo: "Relatórios de chamados", ordem: 110, agrupamentoId: null }
    ]
}]);

describe("agrupamentos no hubConfig", () => {
    it("normaliza agrupamentos e a associação das funcionalidades", () => {
        expect(solution.groups).toEqual([{ id: 7, slug: "configuracoes-do-atendimento", title: "Configurações do atendimento", label: "Configurações", description: null, order: 50 }]);
        expect(solution.areas.find((area) => area.slug === "tipos")).toMatchObject({ groupId: 7, groupOrder: 2, order: 70 });
    });

    it("ordena as abas pela ordem no agrupamento e deixa as sem ordem ao final", () => {
        expect(getGroupTabs(solution, 7).map((area) => area.slug)).toEqual(["categorias", "tipos", "prioridades"]);
    });

    it("apresenta um item por agrupamento no lugar das funcionalidades agrupadas", () => {
        const entries = getWorkspaceEntries(solution);

        expect(entries.map((entry) => entry.title)).toEqual(["Dashboard de chamados", "Configurações do atendimento", "Relatórios de chamados"]);
        expect(entries[1]).toMatchObject({ type: "group", path: "/hub/controle-de-chamados/categorias" });
    });

    it("trata agrupamento com uma única funcionalidade visível como funcionalidade isolada", () => {
        const [restrita] = normalizeSolutions([{
            id: 3,
            slug: "controle-de-chamados",
            nome: "Controle de Chamados",
            agrupamentos: [{ id: 7, slug: "configuracoes-do-atendimento", titulo: "Configurações do atendimento", ordem: 50 }],
            funcionalidades: [{ id: 31, slug: "tipos", titulo: "Tipos de chamados", ordem: 70, agrupamentoId: 7 }]
        }]);

        expect(getAreaGroup(restrita, restrita.areas[0])).toBeNull();
        expect(getWorkspaceEntries(restrita)).toEqual([expect.objectContaining({ type: "area", path: "/hub/controle-de-chamados/tipos" })]);
    });
});
