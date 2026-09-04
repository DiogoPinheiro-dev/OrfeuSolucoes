// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { HUB_NAVIGATION_CHANGED_EVENT } from "../../auth/hubNavigationEvents";
import { apolloClient } from "../../lib/apolloClient";
import {
    createFeatureDraft,
    getActionDraft,
    getCatalogProviders,
    getFeatureDraft,
    publishFeatureDraft,
    saveFeatureDraft,
    validateFeatureDraft
} from "../../../services/Solucoes/CatalogoService";

vi.mock("../../lib/apolloClient", () => ({
    apolloClient: { query: vi.fn(), mutate: vi.fn() }
}));

describe("CatalogoService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("normaliza identificadores e mantém o Hub intacto enquanto o rascunho não foi publicado", async () => {
        const listener = vi.fn();
        window.addEventListener(HUB_NAVIGATION_CHANGED_EVENT, listener);
        apolloClient.mutate
            .mockResolvedValueOnce({ data: { criarRascunhoFuncionalidade: { id: "draft-1", revisao: 1 } } })
            .mockResolvedValueOnce({ data: { salvarRascunhoFuncionalidade: { id: "draft-1", revisao: 2 } } });

        await expect(createFeatureDraft("12", " Ajuste ")).resolves.toMatchObject({ id: "draft-1" });
        await expect(saveFeatureDraft({ versaoId: "draft-1", revisaoEsperada: 1, titulo: "Ajustado" }))
            .resolves.toMatchObject({ revisao: 2 });

        expect(apolloClient.mutate.mock.calls[0][0].variables).toEqual({ funcionalidadeId: 12, motivo: "Ajuste" });
        expect(listener).not.toHaveBeenCalled();
        window.removeEventListener(HUB_NAVIGATION_CHANGED_EVENT, listener);
    });

    it("consulta a lista centralizada de providers sem usar cache local", async () => {
        apolloClient.query.mockResolvedValue({
            data: { catalogoProviders: [{ key: "projetos.backlog-de-demandas", version: 1 }] }
        });

        await expect(getCatalogProviders()).resolves.toEqual([
            { key: "projetos.backlog-de-demandas", version: 1 }
        ]);
        expect(apolloClient.query).toHaveBeenCalledWith(expect.objectContaining({
            fetchPolicy: "network-only"
        }));
    });

    it("consulta rascunhos atuais para permitir retomada da publicação", async () => {
        apolloClient.query
            .mockResolvedValueOnce({ data: { catalogoRascunhoFuncionalidade: { id: "feature-draft", revisao: 2 } } })
            .mockResolvedValueOnce({ data: { catalogoRascunhoAcao: null } });

        await expect(getFeatureDraft("12")).resolves.toMatchObject({ id: "feature-draft", revisao: 2 });
        await expect(getActionDraft("21")).resolves.toBeNull();
        expect(apolloClient.query.mock.calls[0][0]).toEqual(expect.objectContaining({ variables: { funcionalidadeId: 12 }, fetchPolicy: "network-only" }));
        expect(apolloClient.query.mock.calls[1][0]).toEqual(expect.objectContaining({ variables: { acaoId: 21 }, fetchPolicy: "network-only" }));
    });

    it("valida pela rede e notifica o Hub somente depois da publicação", async () => {
        const listener = vi.fn();
        window.addEventListener(HUB_NAVIGATION_CHANGED_EVENT, listener);
        apolloClient.query.mockResolvedValue({ data: { validarRascunhoFuncionalidade: [] } });
        apolloClient.mutate.mockResolvedValue({ data: { publicarRascunhoFuncionalidade: { id: "draft-1", estado: "PUBLICADA" } } });

        await expect(validateFeatureDraft("draft-1")).resolves.toEqual([]);
        await expect(publishFeatureDraft({ versionId: "draft-1", expectedRevision: "2", reason: " Publicação " }))
            .resolves.toMatchObject({ estado: "PUBLICADA" });

        expect(apolloClient.query).toHaveBeenCalledWith(expect.objectContaining({
            variables: { versaoId: "draft-1" },
            fetchPolicy: "network-only"
        }));
        expect(apolloClient.mutate).toHaveBeenCalledWith(expect.objectContaining({
            variables: { versaoId: "draft-1", revisaoEsperada: 2, motivo: "Publicação" }
        }));
        expect(listener).toHaveBeenCalledTimes(1);
        window.removeEventListener(HUB_NAVIGATION_CHANGED_EVENT, listener);
    });
});
