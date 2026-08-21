// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    abrirChamadoAnexo,
    chamadoAnexoDownloadUrl,
    downloadChamadoRelatorio,
    uploadChamadoAnexos
} from "../../../services/Chamados/ChamadoService";
import {
    abrirProjetoAnexo,
    excluirProjetoAnexo,
    uploadProjetoAnexos
} from "../../../services/Projetos/ComunicacaoService";

const response = ({ ok = true, json = {}, blob = new Blob(["arquivo"], { type: "text/plain" }), headers = {} } = {}) => ({
    ok,
    statusText: ok ? "OK" : "Erro",
    json: vi.fn().mockResolvedValue(json),
    blob: vi.fn().mockResolvedValue(blob),
    headers: { get: (name) => headers[name.toLowerCase()] || null }
});

describe("serviços de arquivos", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
        URL.createObjectURL = vi.fn(() => "blob:arquivo");
        URL.revokeObjectURL = vi.fn();
        HTMLAnchorElement.prototype.click = vi.fn();
    });
    afterEach(() => vi.unstubAllGlobals());

    it("não envia requisição de anexo de chamado sem arquivos", async () => {
        await expect(uploadChamadoAnexos("chamado-1", [])).resolves.toEqual([]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("envia e abre anexos de chamado com cookie e nome do servidor", async () => {
        fetch
            .mockResolvedValueOnce(response({ json: [{ id: 1 }] }))
            .mockResolvedValueOnce(response({ headers: { "content-disposition": "attachment; filename*=UTF-8''relat%C3%B3rio.txt" } }));
        const file = new File(["conteúdo"], "arquivo.txt", { type: "text/plain" });

        await expect(uploadChamadoAnexos("chamado-1", [file], "mensagem-1")).resolves.toEqual([{ id: 1 }]);
        expect(fetch).toHaveBeenNthCalledWith(1, expect.stringContaining("/chamados/chamado-1/anexos"), expect.objectContaining({
            method: "POST",
            credentials: "include",
            body: expect.any(FormData)
        }));
        expect(fetch.mock.calls[0][1].headers).toBeUndefined();
        await expect(abrirChamadoAnexo("/chamados/anexos/1")).resolves.toEqual({
            objectUrl: "blob:arquivo",
            nomeArquivo: "relatório.txt",
            mimeType: "text/plain"
        });
        expect(chamadoAnexoDownloadUrl("https://files.example/a.txt")).toBe("https://files.example/a.txt");
        expect(chamadoAnexoDownloadUrl("")).toBe("#");
    });

    it("propaga mensagens REST seguras em falhas de anexo", async () => {
        fetch.mockResolvedValue(response({ ok: false, json: { message: ["Arquivo inválido.", "Tente novamente."] } }));
        await expect(uploadChamadoAnexos("chamado-1", [new File(["x"], "x.txt")])).rejects.toThrow("Arquivo inválido. Tente novamente.");
        await expect(abrirChamadoAnexo("")).rejects.toThrow("Link do anexo indisponivel.");
    });

    it("exporta relatório removendo paginação dos parâmetros", async () => {
        fetch.mockResolvedValue(response({ headers: { "content-disposition": "attachment; filename=chamados.csv" } }));
        await downloadChamadoRelatorio({ status: "ABERTO", page: 2, pageSize: 20 }, "csv");
        expect(fetch.mock.calls[0][0]).toContain("status=ABERTO");
        expect(fetch.mock.calls[0][0]).not.toContain("page=");
        expect(fetch.mock.calls[0][1]).toEqual({ credentials: "include" });
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:arquivo");
    });

    it("envia, abre e exclui anexos de projeto", async () => {
        fetch
            .mockResolvedValueOnce(response({ json: [{ id: "a1" }] }))
            .mockResolvedValueOnce(response())
            .mockResolvedValueOnce(response({ json: { removido: true } }));
        const file = new File(["conteúdo"], "projeto.txt", { type: "text/plain" });

        await expect(uploadProjetoAnexos("p1", [file], { comentarioId: "c1" })).resolves.toEqual([{ id: "a1" }]);
        await expect(abrirProjetoAnexo("/projetos/anexos/a1", "projeto.txt")).resolves.toEqual({ objectUrl: "blob:arquivo", nomeArquivo: "projeto.txt" });
        await expect(excluirProjetoAnexo("p1", "a1")).resolves.toEqual({ removido: true });
        expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining("/projetos/p1/anexos/a1"), expect.objectContaining({ method: "DELETE" }));
        expect(fetch.mock.calls.every(([, options]) => options.credentials === "include" && options.headers === undefined)).toBe(true);
    });

    it("propaga falhas REST em todas as operações de arquivo restantes", async () => {
        fetch.mockResolvedValue(response({ ok: false, json: { message: "Operação de arquivo negada." } }));
        const file = new File(["x"], "x.txt");

        await expect(downloadChamadoRelatorio({}, "csv")).rejects.toThrow("Operação de arquivo negada.");
        await expect(uploadProjetoAnexos("p1", [file])).rejects.toThrow("Operação de arquivo negada.");
        await expect(abrirProjetoAnexo("/projetos/anexos/a1", "x.txt")).rejects.toThrow("Operação de arquivo negada.");
        await expect(excluirProjetoAnexo("p1", "a1")).rejects.toThrow("Operação de arquivo negada.");
    });
});
