const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { PrismaClient } = require('@prisma/client');

const loadDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = readFileSync('.env', 'utf8');
  const line = env.split(/\r?\n/).find((item) => item.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL não encontrada.');
  return line.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
};

const baseUrl = loadDatabaseUrl();
const databaseName = `OrfeuMigrationValidation_${Date.now()}`;
const databasePattern = /([;?]database=)[^;]+/i;

if (!databasePattern.test(baseUrl)) {
  throw new Error('A URL SQL Server não possui o parâmetro database.');
}

const validationUrl = baseUrl.replace(databasePattern, `$1${databaseName}`);
const admin = new PrismaClient({ datasources: { db: { url: baseUrl } } });

const quoteIdentifier = (value) => `[${value.replace(/]/g, ']]')}]`;

const run = async () => {
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    const result = spawnSync('cmd.exe', ['/d', '/s', '/c', 'npx.cmd prisma migrate deploy'], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: validationUrl },
      encoding: 'utf8'
    });
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || 'Falha ao aplicar migrations.');
    }
    process.stdout.write(`Migrations aplicadas com sucesso no banco temporário ${databaseName}.\n`);
  } finally {
    await admin.$executeRawUnsafe(
      `IF DB_ID(N'${databaseName}') IS NOT NULL BEGIN ALTER DATABASE ${quoteIdentifier(databaseName)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ${quoteIdentifier(databaseName)}; END`
    );
    await admin.$disconnect();
  }
};

run().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
