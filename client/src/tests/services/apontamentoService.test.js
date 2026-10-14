// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apolloClient } from "../../lib/apolloClient";
import {
    aprovarApontamentos,
    descartarApontamento,
    enviarApontamentos,
    excluirApontamento,
    fecharCompetencia,
    getApontamentoItens,
    getApontamentoProjetos,
    getHorasDoProjeto,
    getHorasProjetos,
    getMeusApontamentos,
    reabrirApontamento,
    reabrirCompetencia,
    recalcularCustosPendentes,
    recolherApontamento,
    rejeitarApontamentos,
    salvarApontamento
} from "../../../services/Projetos/ApontamentoService";
import { ServiceError } from "../../../services/graphql/serviceError";

vi.mock("../../lib/apolloClient", () => ({
    apolloClient: { query: vi.fn(), mutate: vi.fn() }
}));

const versao = { id: "a1", versao: 2 };

describe("ApontamentoService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("consulta projetos, itens e páginas sem cache local e completa as listas ausentes", async () => {
        apolloClient.query
            .mockResolvedValueOnce({ data: { projetoApontamentoProjetos: null } })
            .mockResolvedValueOnce({ data: { projetoApontamentoItens: [{ id: "i1", chave: "ORF-1", titulo: "Login" }] } })
            .mockResolvedValueOnce({ data: { meusProjetoApontamentos: { total: 0, pagina: 1 } } })
            .mockResolvedValueOnce({ data: { projetoHorasProjetos: [] } })
            .mockResolvedValueOnce({ data: { projetoHoras: { total: 0, financeiro: { totalCusto: "0.00" } } } })
            .mockResolvedValueOnce({ data: { projetoHoras: { total: 0, financeiro: null } } });

        await expect(getApontamentoProjetos()).resolves.toEqual([]);
        await expect(getApontamentoItens("p1")).resolves.toEqual([{ id: "i1", chave: "ORF-1", titulo: "Login" }]);
        await expect(getMeusApontamentos({ inicio: "2026-10-12", fim: "2026-10-18", pagina: 1, limite: 5 })).resolves.toEqual({
            total: 0, pagina: 1, items: [], totaisPorDia: [], totaisPorProjeto: [], permissoes: { podeIncluir: false }
        });
        await expect(getHorasProjetos()).resolves.toEqual([]);
        await expect(getHorasDoProjeto({ projetoId: "p1" })).resolves.toMatchObject({
            items: [], totaisPorUsuario: [], totaisPorItem: [], competencias: [],
            financeiro: { totalCusto: "0.00", custosPorUsuario: [], custosPorItem: [], linhas: [] }
        });
        await expect(getHorasDoProjeto({ projetoId: "p1" })).resolves.toMatchObject({ financeiro: null });

        const variables = apolloClient.query.mock.calls.map(([options]) => options.variables);
        expect(variables).toEqual([
            {},
            { projetoId: "p1" },
            { filtro: { inicio: "2026-10-12", fim: "2026-10-18", pagina: 1, limite: 5 } },
            { incluirArquivados: false },
            { filtro: { projetoId: "p1" } },
            { filtro: { projetoId: "p1" } }
        ]);
        expect(apolloClient.query.mock.calls.every(([options]) => options.fetchPolicy === "network-only")).toBe(true);
    });

    it.each([
        ["salvar", salvarApontamento, "salvarProjetoApontamento", { projetoId: "p1", data: "2026-10-13", minutos: 90, descricao: "Revisão", faturavel: true }],
        ["excluir", excluirApontamento, "excluirProjetoApontamento", versao],
        ["descartar", descartarApontamento, "descartarProjetoApontamento", versao],
        ["recolher", recolherApontamento, "recolherProjetoApontamento", versao],
        ["aprovar", aprovarApontamentos, "aprovarProjetoApontamentos", { projetoId: "p1", apontamentos: [versao], chaveIdempotencia: "k1" }],
        ["rejeitar", rejeitarApontamentos, "rejeitarProjetoApontamentos", { projetoId: "p1", apontamentos: [versao], motivo: "Horas duplicadas.", chaveIdempotencia: "k2" }],
        ["reabrir", reabrirApontamento, "reabrirProjetoApontamento", { projetoId: "p1", ...versao, motivo: "Data errada." }],
        ["fechar a competência", fecharCompetencia, "fecharProjetoApontamentoPeriodo", { projetoId: "p1", competencia: "2026-09" }],
        ["reabrir a competência", reabrirCompetencia, "reabrirProjetoApontamentoPeriodo", { projetoId: "p1", competencia: "2026-09", versao: 1, motivo: "Ajuste da equipe." }]
    ])("%s envia exatamente a variável input", async (_label, operation, responseKey, input) => {
        const response = Array.isArray(input.apontamentos) ? [{ id: "a1", status: "APROVADO", versao: 3 }] : { id: "a1" };
        apolloClient.mutate.mockResolvedValue({ data: { [responseKey]: response } });

        await expect(operation(input)).resolves.toEqual(response);
        expect(apolloClient.mutate).toHaveBeenCalledWith(expect.objectContaining({ variables: { input } }));
    });

    it("monta o input do envio em lote e do recálculo", async () => {
        apolloClient.mutate
            .mockResolvedValueOnce({ data: { enviarProjetoApontamentos: null } })
            .mockResolvedValueOnce({ data: { recalcularCustoProjetoApontamentos: { calculados: 2, pendentes: 1 } } });

        await expect(enviarApontamentos([versao])).resolves.toEqual([]);
        await expect(recalcularCustosPendentes("p1")).resolves.toEqual({ calculados: 2, pendentes: 1 });
        expect(apolloClient.mutate.mock.calls.map(([options]) => options.variables)).toEqual([
            { input: { apontamentos: [versao] } },
            { input: { projetoId: "p1" } }
        ]);
    });

    it("preserva a orientação de negócio do backend e normaliza a falha técnica", async () => {
        const limite = "O dia já tem 23:00 lançadas e só cabem mais 01:00.";
        apolloClient.mutate.mockRejectedValueOnce({ graphQLErrors: [{ message: limite, extensions: { code: "BAD_REQUEST", originalError: { statusCode: 400, message: limite } } }] });
        apolloClient.query.mockRejectedValueOnce(new Error("Network error: failed to fetch"));

        await expect(salvarApontamento({ projetoId: "p1" })).rejects.toMatchObject({ type: "validation", message: limite });
        await expect(getMeusApontamentos({})).rejects.toBeInstanceOf(ServiceError);
    });
});
