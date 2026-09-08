import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractRegistryKeys, validateCatalog } from "./documentation-contract.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(docsRoot, "..");
const catalogPath = path.join(docsRoot, "catalogo.json");
const registryPath = path.join(repositoryRoot, "client", "src", "auth", "featureProviders.jsx");
const outputPath = path.join(docsRoot, "generated", "documentacao-manifest.json");

try {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const registryKeys = extractRegistryKeys(fs.readFileSync(registryPath, "utf8"));
  const result = validateCatalog({ catalog, docsRoot, registryKeys });
  if (result.errors.length) {
    console.error(`Documentação inválida (${result.errors.length} erro(s)):`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(result.manifest, null, 2)}\n`, "utf8");
    console.log(`Documentação válida: ${catalog.artigos.length} artigo(s) catalogado(s), ${result.manifest.artigos.length} publicado(s).`);
    console.log(`Manifesto: ${path.relative(repositoryRoot, outputPath)}`);
  }
} catch (error) {
  console.error(`Não foi possível validar a documentação: ${error.message}`);
  process.exitCode = 1;
}
