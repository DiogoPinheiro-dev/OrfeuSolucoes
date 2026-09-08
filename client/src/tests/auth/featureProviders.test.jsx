import { describe, expect, it } from "vitest";

import { FEATURE_PROVIDER_KEYS, resolveFeatureProvider } from "../../auth/featureProviders";
import { normalizeSolutions } from "../../auth/hubConfig";

describe("manifesto de providers do Hub", () => {
    it("resolve diretamente um provider compatível pelo contrato publicado", () => {
        const provider = resolveFeatureProvider("configurador.cadastro-de-usuarios", 1);

        expect(provider).toMatchObject({
            key: "configurador.cadastro-de-usuarios",
            version: 1
        });
        expect(provider.loader).toBeDefined();
    });

    it("recusa provider inexistente ou versão incompatível", () => {
        expect(resolveFeatureProvider("configurador.inexistente", 1)).toBeNull();
        expect(resolveFeatureProvider("configurador.cadastro-de-usuarios", 2)).toBeNull();
    });

    it("resolve aliases de links antigos para o provider canônico", () => {
        expect(resolveFeatureProvider("projetos.recursos-do-projeto", 1)?.key)
            .toBe("projetos.planejamento-de-recursos");
        expect(resolveFeatureProvider("projetos.grade-de-capacitacao", 1)?.key)
            .toBe("projetos.planejamento-de-recursos");
    });

    it("mantém chaves únicas no manifesto", () => {
        expect(new Set(FEATURE_PROVIDER_KEYS).size).toBe(FEATURE_PROVIDER_KEYS.length);
    });

    it("preserva provider e identidade técnica ao normalizar a navegação", () => {
        const [solution] = normalizeSolutions([{
            id: 1,
            slug: "configurador",
            nome: "Configurador",
            funcionalidades: [{
                id: 2,
                slug: "usuarios",
                titulo: "Usuários",
                registryKey: "configurador.rota-legada",
                providerKey: "configurador.cadastro-de-usuarios",
                providerVersion: 1
            }]
        }]);

        expect(solution.areas[0]).toMatchObject({
            registryKey: "configurador.rota-legada",
            providerKey: "configurador.cadastro-de-usuarios",
            providerVersion: 1
        });
    });
});
