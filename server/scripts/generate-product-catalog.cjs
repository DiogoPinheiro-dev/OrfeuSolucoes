const fs = require('node:fs');
const path = require('node:path');

require('ts-node/register/transpile-only');

const { CATALOGO_PRODUTO } = require('../src/modules/instalacao/manifesto/catalogo-produto');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const outputPath = path.join(repositoryRoot, 'docs', 'generated', 'catalogo-produto.json');
const generated = `${JSON.stringify(CATALOGO_PRODUTO, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : null;

  if (current !== generated) {
    console.error('docs/generated/catalogo-produto.json está desatualizado. Execute npm run catalogo:generate no backend.');
    process.exitCode = 1;
  } else {
    console.log('Manifesto de produto gerado está atualizado.');
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, generated, 'utf8');
  console.log(`Manifesto de produto gerado em ${path.relative(repositoryRoot, outputPath)}.`);
}
