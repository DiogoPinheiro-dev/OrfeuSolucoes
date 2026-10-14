import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDirectory = fileURLToPath(new URL("../../", import.meta.url));
const componentsDirectory = fileURLToPath(new URL("../../components/", import.meta.url));
const sharedCrudClass = /\bcrud-(?:grid|shell|header|kicker|search|filters|toolbar|table(?:-wrap)?|pagination)\b/;
const crudGridCssImport = /import\s+["']\.\.\/styles\/crudGrid\.css["'];/;
const defaultModalFormClass = readFileSync(path.join(componentsDirectory, "CrudModal.jsx"), "utf8").match(/formClassName\s*=\s*"([\w-]+)"/)?.[1];

// Só as importações estáticas: o que chega por import() vai para outro pedaço do bundle e pode não estar carregado.
const staticImports = (file) => [...readFileSync(file, "utf8").matchAll(/^\s*import\s+(?:[^"';]+?\s+from\s+)?["'](\.[^"']+)["']/gm)]
  .map(([, specifier]) => specifier);
const resolveImport = (from, specifier) => {
  const base = path.resolve(path.dirname(from), specifier);
  return [base, `${base}.jsx`, `${base}.js`].find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
};
const reachableCss = (file, visited = new Set()) => {
  if (visited.has(file)) return [];
  visited.add(file);
  return staticImports(file).flatMap((specifier) => {
    const target = resolveImport(file, specifier);
    if (!target) return [];
    return target.endsWith(".css") ? [target] : reachableCss(target, visited);
  });
};
const definedClasses = (files) => new Set(files.flatMap((file) => [
  ...readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/\.(-?[_a-zA-Z][\w-]*)(?=[^{}]*\{)/g)
].map(([, name]) => name)));
const usedClasses = (file) => {
  const source = readFileSync(file, "utf8");
  const classes = [...source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)]
    .flatMap(([, plain, template]) => (plain ?? template).replace(/\$\{[^}]*\}/g, " ").split(/\s+/))
    .filter((name) => /^[a-zA-Z][\w-]*[a-zA-Z0-9]$/.test(name));
  const usesDefaultModalForm = /<CrudModal\b/.test(source) && !/formClassName=/.test(source);
  return usesDefaultModalForm ? [...classes, defaultModalFormClass] : classes;
};
// Toda tela do Hub abre dentro da página da funcionalidade, então conta com o CSS da inicialização e dessa página.
const hubPageCss = [
  ...reachableCss(path.join(sourceDirectory, "main.jsx")),
  ...reachableCss(path.join(sourceDirectory, "pages", "SolutionFeaturePage.jsx"))
];

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

  it("estiliza o formulário padrão do CrudModal no próprio CSS do modal", () => {
    const modalCss = readFileSync(path.join(sourceDirectory, "styles", "crudModal.css"), "utf8");
    const missingRules = ["", " label", " input", " select", " textarea"]
      .map((descendant) => `.${defaultModalFormClass}${descendant}`)
      .filter((selector) => !new RegExp(`(^|[},])\\s*${selector.replace(/[.]/g, "\\.")}\\s*[,{]`, "m").test(modalCss));

    expect(defaultModalFormClass).toBeTruthy();
    expect(missingRules).toEqual([]);
  });

  it.each([
    "CategoriaChamadoManagement",
    "ChamadoConfiguracaoManagement",
    "SlaChamadoManagement",
    "ResponsavelChamadoManagement",
    "GoogleEmailManagement"
  ])("carrega o CSS de todas as classes usadas por %s nas configurações do atendimento", (component) => {
    const file = path.join(componentsDirectory, `${component}.jsx`);
    const available = definedClasses([...hubPageCss, ...reachableCss(file)]);

    expect(usedClasses(file).filter((name) => !available.has(name))).toEqual([]);
  });
});
