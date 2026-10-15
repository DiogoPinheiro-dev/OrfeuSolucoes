const { createHash, randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { Prisma, PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const { createFingerprint, connectionForDatabase } = require('./schema-fingerprint.cjs');
const legacyManifest = require('./legacy-migrations.json');
const expectedFingerprint = require('../../prisma/base-schema-fingerprint.json');

const BASE_MIGRATION = '20261015160000_base_do_produto';
const BASE_FILE = path.resolve(__dirname, '..', '..', 'prisma', 'migrations', BASE_MIGRATION, 'migration.sql');

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== '--database') {
      throw new Error(`Argumento desconhecido: ${argv[index]}`);
    }
    const database = argv[index + 1];
    if (!database || database.startsWith('--')) {
      throw new Error('Informe um valor para --database.');
    }
    options.database = database;
    index += 1;
  }
  return options;
}

function databaseNameFromUrl(url) {
  const match = url.match(/(?:^|;)database=([^;]+)/i);
  if (!match) {
    throw new Error('DATABASE_URL nao possui o parametro database.');
  }
  return match[1];
}

function safeSqlIdentifier(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('O nome do banco possui caracteres nao suportados pelo comando de transicao.');
  }
  return `[${value.replaceAll(']', ']]')}]`;
}

function sqlString(value) {
  return `N'${value.replaceAll("'", "''")}'`;
}

// O CLI do Prisma roda pelo próprio Node: no Windows, o Node 24 não executa npx.cmd sem shell.
const PRISMA_CLI = require.resolve('prisma/build/index.js', { paths: [path.resolve(__dirname, '..', '..')] });

function runPrisma(command, databaseUrl) {
  const result = spawnSync(process.execPath, [PRISMA_CLI, 'migrate', command], {
    cwd: path.resolve(__dirname, '..', '..'),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) {
    throw new Error(`prisma migrate ${command} falhou: ${result.error?.message ?? `codigo ${result.status}`}.`);
  }
}

async function verifyLegacyHistory(prisma) {
  const migrations = await prisma.$queryRawUnsafe(`
    SELECT [migration_name] AS migrationName,
           [finished_at] AS finishedAt,
           [rolled_back_at] AS rolledBackAt,
           [applied_steps_count] AS appliedStepsCount
    FROM [dbo].[_prisma_migrations]
    ORDER BY [migration_name]
  `);
  const expected = [...legacyManifest.migrations].sort();
  const actual = migrations.map((migration) => migration.migrationName).sort();

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Historico inesperado: esperadas ${expected.length} migrations legadas concluidas e encontradas ${actual.length}.`
    );
  }
  const incomplete = migrations.filter((migration) =>
    !migration.finishedAt || migration.rolledBackAt || Number(migration.appliedStepsCount) !== 1
  );
  if (incomplete.length) {
    throw new Error(`Existem ${incomplete.length} migrations legadas incompletas ou revertidas.`);
  }
}

async function createVerifiedBackup(prisma, databaseName) {
  const [serverInfo] = await prisma.$queryRawUnsafe(`
    SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS NVARCHAR(4000)) AS backupPath
  `);
  if (!serverInfo?.backupPath) {
    throw new Error('O SQL Server nao informou o diretorio padrao de backup.');
  }

  const timestamp = new Date().toISOString().replaceAll(/[-:.TZ]/g, '').slice(0, 14);
  const separator = serverInfo.backupPath.endsWith('\\') || serverInfo.backupPath.endsWith('/') ? '' : '\\';
  const backupPath = `${serverInfo.backupPath}${separator}${databaseName}-pre-base-${timestamp}.bak`;
  const databaseIdentifier = safeSqlIdentifier(databaseName);

  await prisma.$executeRawUnsafe(
    `BACKUP DATABASE ${databaseIdentifier} TO DISK = ${sqlString(backupPath)} WITH INIT, CHECKSUM, COMPRESSION`
  );
  await prisma.$executeRawUnsafe(
    `RESTORE VERIFYONLY FROM DISK = ${sqlString(backupPath)} WITH CHECKSUM`
  );
  return backupPath;
}

async function replaceMigrationHistory(prisma) {
  const checksum = createHash('sha256').update(fs.readFileSync(BASE_FILE)).digest('hex');
  const now = new Date();

  await prisma.$transaction(async (database) => {
    const deleted = await database.$executeRaw`DELETE FROM [dbo].[_prisma_migrations]`;
    if (deleted !== legacyManifest.count) {
      throw new Error(
        `A troca do historico esperava remover ${legacyManifest.count} registros, mas removeu ${deleted}.`
      );
    }
    // NULL literal: como parâmetro, o Prisma envia null tipado como inteiro, e o SQL Server recusa a
    // conversão para a coluna datetimeoffset de rolled_back_at.
    await database.$executeRaw`
      INSERT INTO [dbo].[_prisma_migrations]
        ([id], [checksum], [finished_at], [migration_name], [logs], [rolled_back_at], [started_at], [applied_steps_count])
      VALUES
        (${randomUUID()}, ${checksum}, ${now}, ${BASE_MIGRATION}, NULL, NULL, ${now}, ${1})
    `;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const databaseUrl = connectionForDatabase(options.database);
  const databaseName = options.database ?? databaseNameFromUrl(databaseUrl);
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  let backupPath;

  try {
    await verifyLegacyHistory(prisma);
    const fingerprint = await createFingerprint(databaseName);
    if (fingerprint.sha256 !== expectedFingerprint.sha256) {
      throw new Error(
        `Impressao digital divergente. Esperado ${expectedFingerprint.sha256}; encontrado ${fingerprint.sha256}.`
      );
    }

    backupPath = await createVerifiedBackup(prisma, databaseName);
    await replaceMigrationHistory(prisma);
  } finally {
    await prisma.$disconnect();
  }

  try {
    runPrisma('deploy', databaseUrl);
    runPrisma('status', databaseUrl);
  } catch (error) {
    throw new Error(
      `${error instanceof Error ? error.message : error} Backup verificado disponivel em ${backupPath}.`
    );
  }

  const verification = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const marker = await verification.sistemaInstalacao.findUnique({ where: { id: 1 } });
    if (marker?.origem !== 'BANCO_EXISTENTE') {
      throw new Error('A migration instalacao_unica nao registrou a marca BANCO_EXISTENTE.');
    }
  } finally {
    await verification.$disconnect();
  }

  console.log(`Transicao concluida para ${databaseName}. Backup verificado: ${backupPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
