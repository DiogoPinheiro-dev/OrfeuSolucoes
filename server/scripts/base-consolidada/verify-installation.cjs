const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const { connectionForDatabase } = require('./schema-fingerprint.cjs');

const INSTALLATION_TABLES = [
  'SistemaInstalacoes',
  'ProdutoAtualizacoes',
  'Empresas',
  'Usuarios',
  'GruposUsuarios',
  'Solucoes',
  'FuncionalidadeAgrupamentos',
  'Funcionalidades',
  'FuncionalidadeAcoes',
  'CatalogoVersoes',
  'CatalogoAuditorias',
  'GrupoSolucoes',
  'EmpresaSolucoes',
  'EmpresaFuncionalidades',
  'EmpresaUsuarios',
  'GrupoFuncionalidades',
  'GrupoFuncionalidadeAcoes',
  'ChamadoTipos',
  'ChamadoPrioridades'
];

const EXPECTED_COUNTS = {
  SistemaInstalacoes: 1,
  ProdutoAtualizacoes: 0,
  Empresas: 1,
  Usuarios: 1,
  GruposUsuarios: 1,
  Solucoes: 4,
  FuncionalidadeAgrupamentos: 7,
  Funcionalidades: 28,
  FuncionalidadeAcoes: 146,
  CatalogoVersoes: 178,
  CatalogoAuditorias: 178,
  GrupoSolucoes: 4,
  EmpresaSolucoes: 4,
  EmpresaFuncionalidades: 28,
  EmpresaUsuarios: 1,
  GrupoFuncionalidades: 28,
  GrupoFuncionalidadeAcoes: 146,
  ChamadoTipos: 4,
  ChamadoPrioridades: 4
};

function parseArguments(argv) {
  const options = { expected: 'installed' };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--expect-empty') {
      options.expected = 'empty';
      continue;
    }
    if (argument === '--expect-installed') {
      options.expected = 'installed';
      continue;
    }
    if (argument === '--database' || argument === '--write-hash' || argument === '--compare-hash') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Informe um valor para ${argument}.`);
      }
      options[argument.slice(2).replace('-', '')] = value;
      index += 1;
      continue;
    }
    throw new Error(`Argumento desconhecido: ${argument}`);
  }
  return options;
}

function normalizeValue(value) {
  if (typeof value === 'bigint') return value.toString();
  if (Buffer.isBuffer(value)) return value.toString('hex');
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeValue(item)]));
  }
  return value;
}

async function readState(prisma) {
  const entries = [];
  for (const table of INSTALLATION_TABLES) {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM [dbo].[${table}] ORDER BY [Id]`);
    entries.push([table, normalizeValue(rows)]);
  }
  return Object.fromEntries(entries);
}

function assertCounts(state, expected) {
  const expectedCounts = expected === 'empty'
    ? Object.fromEntries(INSTALLATION_TABLES.map((table) => [table, 0]))
    : EXPECTED_COUNTS;
  const differences = INSTALLATION_TABLES
    .map((table) => ({ table, expected: expectedCounts[table], actual: state[table].length }))
    .filter((item) => item.expected !== item.actual);
  if (differences.length) {
    throw new Error(`Contagens de ${expected} divergentes: ${JSON.stringify(differences)}.`);
  }
}

function assertInstalledSemantics(state) {
  const marker = state.SistemaInstalacoes[0];
  if (marker.Origem !== 'INSTALACAO' || marker.VersaoManifesto !== 1 || marker.DuracaoMs === null) {
    throw new Error('A marca da instalacao inicial nao possui origem, versao e duracao esperadas.');
  }
  const unpublished = [
    ...state.Solucoes,
    ...state.Funcionalidades,
    ...state.FuncionalidadeAcoes
  ].filter((item) => item.StatusPublicacao !== 'PUBLICADA' || item.Ativo !== true);
  if (unpublished.length) {
    throw new Error(`O catalogo instalado possui ${unpublished.length} itens inativos ou nao publicados.`);
  }
  const invalidAudits = state.CatalogoAuditorias.filter((item) => item.Evento !== 'INSTALACAO_REGISTRADA');
  if (invalidAudits.length) {
    throw new Error(`Foram encontradas ${invalidAudits.length} auditorias fora do evento de instalacao.`);
  }
}

// Banco novo: depois das migrations, nenhuma tabela do sistema pode ter linhas, não só as da instalação.
async function assertAllTablesEmpty(prisma) {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT t.name AS tableName, SUM(p.rows) AS totalRows
    FROM sys.tables t
    INNER JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
    WHERE t.is_ms_shipped = 0 AND t.name <> N'_prisma_migrations'
    GROUP BY t.name
  `);
  const filled = tables.filter((table) => Number(table.totalRows) > 0);
  if (filled.length) {
    throw new Error(`O banco novo deveria estar vazio, mas possui linhas em: ${filled.map((table) => table.tableName).join(', ')}.`);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const prisma = new PrismaClient({ datasources: { db: { url: connectionForDatabase(options.database) } } });
  try {
    if (options.expected === 'empty') await assertAllTablesEmpty(prisma);
    const state = await readState(prisma);
    assertCounts(state, options.expected);
    if (options.expected === 'installed') assertInstalledSemantics(state);

    const sha256 = createHash('sha256').update(JSON.stringify(state)).digest('hex');
    if (options.writehash) {
      fs.writeFileSync(path.resolve(process.cwd(), options.writehash), `${sha256}\n`, 'utf8');
    }
    if (options.comparehash) {
      const expectedHash = fs.readFileSync(path.resolve(process.cwd(), options.comparehash), 'utf8').trim();
      if (sha256 !== expectedHash) {
        throw new Error(`Estado alterado: esperado ${expectedHash}; encontrado ${sha256}.`);
      }
    }
    console.log(JSON.stringify({ expected: options.expected, sha256, counts: Object.fromEntries(
      INSTALLATION_TABLES.map((table) => [table, state[table].length])
    ) }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
