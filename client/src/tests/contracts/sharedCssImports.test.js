import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentsDirectory = fileURLToPath(new URL("../../components/", import.meta.url));
const sharedCrudClass = /\bcrud-(?:grid|shell|header|kicker|search|filters|toolbar|table(?:-wrap)?|pagination)\b/;
const crudGridCssImport = /import\s+["']\.\.\/styles\/crudGrid\.css["'];/;

describe("contrato de carregamento do CSS compartilhado", () => {
  it("exige importação explícita nos componentes que usam classes do CrudGrid diretamente", () => {
    const missingImports = readdirSync(componentsDirectory)
      .filter((fileName) => fileName.endsWith(".jsx") && fileName !== "CrudGrid.jsx")
      .filter((fileName) => {
        const source = readFileSync(`${componentsDirectory}/${fileName}`, "utf8");
        return sharedCrudClass.test(source) && !crudGridCssImport.test(source);
      });

    expect(missingImports).toEqual([]);
  });
});
