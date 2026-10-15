const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const METADATA_QUERIES = {
  columns: `
    SELECT
      schema_name(t.schema_id) AS schemaName,
      t.name AS tableName,
      c.name AS columnName,
      ty.name AS dataType,
      c.max_length AS maxLength,
      c.precision AS precisionValue,
      c.scale AS scaleValue,
      c.is_nullable AS isNullable,
      c.is_identity AS isIdentity,
      c.is_computed AS isComputed,
      c.collation_name AS collationName,
      cc.definition AS computedDefinition,
      cc.is_persisted AS computedPersisted
    FROM sys.tables t
    INNER JOIN sys.columns c ON c.object_id = t.object_id
    INNER JOIN sys.types ty ON ty.user_type_id = c.user_type_id
    LEFT JOIN sys.computed_columns cc ON cc.object_id = t.object_id AND cc.column_id = c.column_id
    WHERE t.is_ms_shipped = 0 AND t.name <> N'_prisma_migrations'
    ORDER BY schema_name(t.schema_id), t.name, c.name
  `,
  defaults: `
    SELECT
      schema_name(t.schema_id) AS schemaName,
      t.name AS tableName,
      c.name AS columnName,
      dc.name AS constraintName,
      dc.definition AS definition
    FROM sys.default_constraints dc
    INNER JOIN sys.tables t ON t.object_id = dc.parent_object_id
    INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE t.is_ms_shipped = 0 AND t.name <> N'_prisma_migrations'
    ORDER BY schema_name(t.schema_id), t.name, c.name
  `,
  checks: `
    SELECT
      schema_name(t.schema_id) AS schemaName,
      t.name AS tableName,
      ch.name AS constraintName,
      ch.definition AS definition,
      ch.is_disabled AS isDisabled,
      ch.is_not_trusted AS isNotTrusted
    FROM sys.check_constraints ch
    INNER JOIN sys.tables t ON t.object_id = ch.parent_object_id
    WHERE t.is_ms_shipped = 0 AND t.name <> N'_prisma_migrations'
    ORDER BY schema_name(t.schema_id), t.name, ch.name
  `,
  indexes: `
    SELECT
      schema_name(t.schema_id) AS schemaName,
      t.name AS tableName,
      i.name AS indexName,
      i.type_desc AS indexType,
      i.is_unique AS isUnique,
      i.is_primary_key AS isPrimaryKey,
      i.is_unique_constraint AS isUniqueConstraint,
      i.has_filter AS hasFilter,
      i.filter_definition AS filterDefinition,
      ic.key_ordinal AS keyOrdinal,
      ic.index_column_id AS indexColumnPosition,
      ic.is_descending_key AS isDescending,
      ic.is_included_column AS isIncluded,
      c.name AS columnName
    FROM sys.tables t
    INNER JOIN sys.indexes i ON i.object_id = t.object_id
    INNER JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE t.is_ms_shipped = 0
      AND t.name <> N'_prisma_migrations'
      AND i.name IS NOT NULL
      AND i.is_hypothetical = 0
    ORDER BY schema_name(t.schema_id), t.name, i.name, ic.index_column_id
  `,
  foreignKeys: `
    SELECT
      schema_name(parentTable.schema_id) AS schemaName,
      parentTable.name AS tableName,
      fk.name AS foreignKeyName,
      schema_name(referencedTable.schema_id) AS referencedSchemaName,
      referencedTable.name AS referencedTableName,
      fk.delete_referential_action_desc AS deleteAction,
      fk.update_referential_action_desc AS updateAction,
      fk.is_disabled AS isDisabled,
      fk.is_not_trusted AS isNotTrusted,
      fkc.constraint_column_id AS columnPosition,
      parentColumn.name AS columnName,
      referencedColumn.name AS referencedColumnName
    FROM sys.foreign_keys fk
    INNER JOIN sys.tables parentTable ON parentTable.object_id = fk.parent_object_id
    INNER JOIN sys.tables referencedTable ON referencedTable.object_id = fk.referenced_object_id
    INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
    INNER JOIN sys.columns parentColumn ON parentColumn.object_id = fkc.parent_object_id AND parentColumn.column_id = fkc.parent_column_id
    INNER JOIN sys.columns referencedColumn ON referencedColumn.object_id = fkc.referenced_object_id AND referencedColumn.column_id = fkc.referenced_column_id
    WHERE parentTable.is_ms_shipped = 0 AND parentTable.name <> N'_prisma_migrations'
    ORDER BY schema_name(parentTable.schema_id), parentTable.name, fk.name, fkc.constraint_column_id
  `
};

function parseArguments(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--database' || argument === '--compare' || argument === '--output') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Informe um valor para ${argument}.`);
      }
      options[argument.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`Argumento desconhecido: ${argument}`);
    }
  }

  return options;
}

function connectionForDatabase(databaseName) {
  const source = process.env.DATABASE_URL;
  if (!source) {
    throw new Error('DATABASE_URL nao foi fornecida.');
  }

  if (!databaseName) {
    return source;
  }

  const segments = source.split(';');
  const index = segments.findIndex((segment) => /^database=/i.test(segment));
  if (index < 0) {
    throw new Error('DATABASE_URL nao possui o parametro database.');
  }
  segments[index] = `database=${databaseName}`;
  return segments.join(';');
}

function normalizeValue(value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('hex');
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeValue(item)]));
  }
  return value;
}

async function createFingerprint(databaseName) {
  const prisma = new PrismaClient({
    datasources: { db: { url: connectionForDatabase(databaseName) } }
  });

  try {
    const entries = await Promise.all(Object.entries(METADATA_QUERIES).map(async ([name, query]) => {
      const rows = normalizeValue(await prisma.$queryRawUnsafe(query));
      return [name, name === 'indexes' || name === 'foreignKeys' ? groupConstraintRows(name, rows) : rows];
    }));
    const objects = Object.fromEntries(entries);
    const canonical = JSON.stringify(objects);
    return {
      version: 1,
      counts: Object.fromEntries(Object.entries(objects).map(([name, rows]) => [name, rows.length])),
      totalObjects: Object.values(objects).reduce((total, rows) => total + rows.length, 0),
      sha256: createHash('sha256').update(canonical).digest('hex'),
      objects
    };
  } finally {
    await prisma.$disconnect();
  }
}

function groupConstraintRows(section, rows) {
  const columnFields = section === 'indexes'
    ? ['keyOrdinal', 'indexColumnPosition', 'isDescending', 'isIncluded', 'columnName']
    : ['columnPosition', 'columnName', 'referencedColumnName'];
  const groups = new Map();

  for (const row of rows) {
    const metadata = Object.fromEntries(Object.entries(row).filter(([key]) => !columnFields.includes(key)));
    const key = JSON.stringify(metadata);
    const existing = groups.get(key) ?? { ...metadata, columns: [] };
    existing.columns.push(Object.fromEntries(columnFields.map((field) => [field, row[field]])));
    groups.set(key, existing);
  }

  return [...groups.values()];
}

function summarize(fingerprint) {
  return {
    counts: fingerprint.counts,
    totalObjects: fingerprint.totalObjects,
    sha256: fingerprint.sha256
  };
}

function firstDifference(left, right) {
  for (const section of Object.keys(METADATA_QUERIES)) {
    const leftRows = left.objects[section];
    const rightRows = right.objects[section];
    const length = Math.max(leftRows.length, rightRows.length);
    for (let index = 0; index < length; index += 1) {
      if (JSON.stringify(leftRows[index]) !== JSON.stringify(rightRows[index])) {
        return { section, index, expected: leftRows[index] ?? null, actual: rightRows[index] ?? null };
      }
    }
  }
  return null;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const fingerprint = await createFingerprint(options.database);

  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  }

  if (options.compare) {
    const compared = await createFingerprint(options.compare);
    const equal = fingerprint.sha256 === compared.sha256;
    console.log(JSON.stringify({
      equal,
      reference: summarize(fingerprint),
      compared: summarize(compared),
      firstDifference: equal ? null : firstDifference(fingerprint, compared)
    }, null, 2));
    if (!equal) {
      process.exitCode = 1;
    }
    return;
  }

  console.log(JSON.stringify(summarize(fingerprint), null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = { createFingerprint, connectionForDatabase, firstDifference };
