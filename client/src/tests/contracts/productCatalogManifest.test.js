import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { FEATURE_PROVIDER_KEYS, resolveFeatureProvider } from "../../auth/featureProviders";

const manifestPath = fileURLToPath(
  new URL("../../../../docs/generated/catalogo-produto.json", import.meta.url)
);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

describe("contrato do manifesto de produto", () => {
  it("mantém todas as telas do produto cobertas pelos providers do frontend", () => {
    const manifestProviders = manifest.solucoes.flatMap((solucao) =>
      solucao.funcionalidades.map((funcionalidade) => ({
        key: funcionalidade.providerKey,
        version: funcionalidade.providerVersion
      }))
    );

    expect(FEATURE_PROVIDER_KEYS).toEqual(expect.arrayContaining(
      manifestProviders.map((provider) => provider.key)
    ));

    for (const provider of manifestProviders) {
      expect(resolveFeatureProvider(provider.key, provider.version)).not.toBeNull();
    }
  });
});
