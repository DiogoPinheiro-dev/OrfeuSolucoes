import { describe, expect, it } from "vitest";

import viteConfig from "../../../vite.config.js";

describe("configuração local de conexão", () => {
    it("mantém GraphQL e endpoints REST no mesmo host do frontend", () => {
        expect(viteConfig.server?.proxy).toEqual({
            "/graphql": "http://localhost:3001",
            "/chamados": "http://localhost:3001",
            "/projetos": "http://localhost:3001"
        });
    });

    it("não configura proxy genérico que possa capturar rotas da aplicação", () => {
        expect(viteConfig.server?.proxy?.["/"]).toBeUndefined();
    });
});
