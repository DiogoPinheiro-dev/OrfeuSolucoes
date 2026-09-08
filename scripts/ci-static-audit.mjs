import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const roots = ["client/src", "client/cypress", "server/src", "server/test"];
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const forbiddenPatterns = [
  { label: "teste exclusivo", expression: /\.(?:only)\s*\(/g },
  { label: "teste desativado", expression: /\.(?:skip|todo)\s*\(/g },
  { label: "suite desativada", expression: /\b(?:xit|xdescribe)\s*\(/g },
];

const listFiles = async (directory) => {
  const entries = await readdir(join(root, directory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (sourceExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
};

const findings = [];
for (const directory of roots) {
  for (const file of await listFiles(directory)) {
    const content = await readFile(join(root, file), "utf8");
    const lines = content.split(/\r?\n/);
    for (const { label, expression } of forbiddenPatterns) {
      lines.forEach((line, index) => {
        expression.lastIndex = 0;
        if (expression.test(line)) findings.push(`${relative(root, file)}:${index + 1}: ${label}`);
      });
    }
  }
}

if (findings.length) {
  console.error("Auditoria estática encontrou testes focados ou desativados:\n" + findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Auditoria estática aprovada: nenhum teste focado ou desativado.");
}
