// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyHubNavigation } from "../../../services/Solucoes/SolucaoService";
import { HUB_NAVIGATION_CHANGED_EVENT } from "../../auth/hubNavigationEvents";
import { useAuth } from "../../hooks/useAuth";
import { useHubNavigation } from "../../hooks/useHubNavigation";

vi.mock("../../../services/Solucoes/SolucaoService", () => ({
    getMyHubNavigation: vi.fn()
}));

vi.mock("../../hooks/useAuth", () => ({
    useAuth: vi.fn()
}));

const strictOptions = { reactStrictMode: true };
const navigation = (id, nome) => [{
    id,
    slug: `solucao-${id}`,
    nome,
    descricao: `${nome} descrição`,
    funcionalidades: []
}];

const deferred = () => {
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    return { promise, resolve };
};

describe("useHubNavigation", () => {
    let auth;

    beforeEach(() => {
        auth = { isAuthenticated: true, user: { empresa: { id: 1 } } };
        useAuth.mockImplementation(() => auth);
        getMyHubNavigation.mockReset();
    });

    it("carrega e normaliza as soluções sob StrictMode", async () => {
        getMyHubNavigation.mockResolvedValue(navigation(10, "Configurador"));

        const { result } = renderHook(() => useHubNavigation(), strictOptions);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe("");
        expect(result.current.solutions).toEqual([expect.objectContaining({
            id: 10,
            slug: "solucao-10",
            title: "Configurador"
        }), expect.objectContaining({
            id: "system-documentation",
            slug: "documentacao",
            title: "Documentação"
        })]);
        expect(getMyHubNavigation).toHaveBeenCalledTimes(2);
    });

    it("encerra o carregamento e apresenta falha do serviço", async () => {
        getMyHubNavigation.mockRejectedValue(new Error("Não foi possível carregar as soluções."));

        const { result } = renderHook(() => useHubNavigation(), strictOptions);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.solutions).toEqual([
            expect.objectContaining({ slug: "documentacao", title: "Documentação" })
        ]);
        expect(result.current.error).toBe("Não foi possível carregar as soluções.");
    });

    it("se recupera quando o serviço volta após a falha inicial", async () => {
        getMyHubNavigation.mockRejectedValue(new Error("Serviço indisponível."));
        const { result } = renderHook(() => useHubNavigation(), strictOptions);
        await waitFor(() => expect(result.current.error).toBe("Serviço indisponível."));
        expect(result.current.loading).toBe(false);
        expect(result.current.solutions).toEqual([
            expect.objectContaining({ slug: "documentacao", title: "Documentação" })
        ]);

        getMyHubNavigation.mockResolvedValue(navigation(20, "Projetos"));
        act(() => window.dispatchEvent(new CustomEvent(HUB_NAVIGATION_CHANGED_EVENT)));

        await waitFor(() => expect(result.current.solutions[0]?.id).toBe(20));
        expect(result.current.error).toBe("");
        expect(result.current.loading).toBe(false);
    });

    it("recarrega ao trocar a empresa ativa", async () => {
        getMyHubNavigation.mockResolvedValue(navigation(10, "Configurador"));
        const { result, rerender } = renderHook(() => useHubNavigation(), strictOptions);
        await waitFor(() => expect(result.current.solutions[0]?.id).toBe(10));

        getMyHubNavigation.mockResolvedValue(navigation(30, "Chamados"));
        auth = { ...auth, user: { empresa: { id: 2 } } };
        rerender();

        await waitFor(() => expect(result.current.solutions[0]?.id).toBe(30));
        expect(result.current.loading).toBe(false);
    });

    it("ignora a resposta atrasada da empresa anterior", async () => {
        const previousCompany = deferred();
        const currentCompany = deferred();
        getMyHubNavigation
            .mockReturnValueOnce(previousCompany.promise)
            .mockReturnValueOnce(previousCompany.promise)
            .mockReturnValueOnce(currentCompany.promise);

        const { result, rerender } = renderHook(() => useHubNavigation(), strictOptions);
        auth = { ...auth, user: { empresa: { id: 2 } } };
        rerender();

        await act(async () => currentCompany.resolve(navigation(30, "Chamados")));
        await waitFor(() => expect(result.current.solutions[0]?.id).toBe(30));
        await act(async () => previousCompany.resolve(navigation(10, "Configurador")));

        expect(result.current.solutions[0]?.id).toBe(30);
        expect(result.current.loading).toBe(false);
    });

    it("limpa imediatamente a navegação ao encerrar a sessão", async () => {
        getMyHubNavigation.mockResolvedValue(navigation(10, "Configurador"));
        const { result, rerender } = renderHook(() => useHubNavigation(), strictOptions);
        await waitFor(() => expect(result.current.solutions).toHaveLength(2));

        auth = { isAuthenticated: false, user: null };
        rerender();

        expect(result.current.solutions).toEqual([]);
        expect(result.current.error).toBe("");
        expect(result.current.loading).toBe(false);
    });
});
