import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateCatalog } from "./documentation-contract.mjs";

function fixture(overrides = {}) {
  return {
    id: "projetos.backlog.visao-geral",
    slug: "backlog-visao-geral",
    titulo: "Backlog de demandas",
    resumo: "Como trabalhar com demandas.",
    arquivo: "artigo.md",
    categoria: "solucao",
    audiencia: "usuario",
    status: "publicado",
    ordem: 10,
    validadoEm: "2026-08-10",
    solucao: "projetos",
    funcionalidade: "backlog-de-demandas",
    registryKey: "projetos.backlog-de-demandas",
    palavrasChave: ["demanda", "backlog"],
    ...overrides
  };
}

function run(articles, content = "# Artigo\n") {
  const docsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "orfeu-docs-"));
  fs.writeFileSync(path.join(docsRoot, "artigo.md"), content, "utf8");
  fs.writeFileSync(path.join(docsRoot, "destino.md"), "# Destino\n", "utf8");
  fs.writeFileSync(path.join(docsRoot, "terceiro.md"), "# Terceiro\n", "utf8");
  const result = validateCatalog({
    catalog: { versaoContrato: 1, artigos: articles },
    docsRoot,
    registryKeys: new Set(["projetos.backlog-de-demandas"]),
    today: new Date("2026-08-12T00:00:00Z")
  });
  fs.rmSync(docsRoot, { recursive: true, force: true });
  return result;
}

test("gera manifesto determinístico apenas com artigos publicados e não internos", () => {
  const result = run([
    fixture({ id: "projetos.backlog.rascunho", slug: "rascunho", arquivo: "destino.md", status: "rascunho", ordem: 1 }),
    fixture({ id: "projetos.backlog.interno", slug: "interno", arquivo: "terceiro.md", audiencia: "interno", ordem: 2 }),
    fixture()
  ]);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.manifest.artigos.map(({ id }) => id), ["projetos.backlog.visao-geral"]);
  assert.deepEqual(result.manifest.artigos[0].palavrasChave, ["backlog", "demanda"]);
});

test("rejeita identificadores duplicados e registry key desconhecida", () => {
  const result = run([fixture(), fixture({ slug: "outra-pagina", registryKey: "projetos.inexistente", funcionalidade: "inexistente" })]);
  assert.ok(result.errors.some((error) => error.includes("id duplicado")));
  assert.ok(result.errors.some((error) => error.includes("registryKey desconhecida")));
});

test("rejeita artigo publicado validado no futuro", () => {
  const result = run([fixture({ validadoEm: "2026-08-13" })]);
  assert.ok(result.errors.some((error) => error.includes("no futuro")));
});

test("rejeita arquivo inexistente e link local quebrado", () => {
  const missingFile = run([fixture({ arquivo: "ausente.md" })]);
  assert.ok(missingFile.errors.some((error) => error.includes("arquivo inexistente")));
  const brokenLink = run([fixture()], "# Artigo\n\n[Destino](nao-existe.md)\n");
  assert.ok(brokenLink.errors.some((error) => error.includes("link local inexistente")));
});

test("aceita link local existente, âncora e endereço web", () => {
  const result = run([fixture()], "# Artigo\n\n[Destino](destino.md) [Seção](#secao) [Web](https://example.com)\n");
  assert.deepEqual(result.errors, []);
});
