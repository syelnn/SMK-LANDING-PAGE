// services/dbExport.js
//
// Fitur "Download Database" untuk role ADMIN.
// Modul ini membaca struktur & isi database Postgres (Supabase) LANGSUNG dari
// katalog sistem (information_schema / pg_catalog) — bukan dari schema.prisma —
// supaya hasil dump selalu sesuai dengan kondisi database yang sebenarnya.
//
// Hasil generateDatabaseDump() adalah teks SQL murni yang aman ditempel ke
// Supabase SQL Editor: berisi CREATE SEQUENCE, CREATE TABLE, INSERT data,
// UNIQUE constraint, FOREIGN KEY, index tambahan, dan reset sequence.

const SCHEMA = 'public';

/* ------------------------------------------------------------------ */
/* HELPER: escaping identifier & value                                 */
/* ------------------------------------------------------------------ */

const quoteIdent = (name) => `"${String(name).replace(/"/g, '""')}"`;

const UDT_TYPE_MAP = {
  int2: 'smallint',
  int4: 'integer',
  int8: 'bigint',
  bpchar: 'char',
  varchar: 'varchar',
  text: 'text',
  float4: 'real',
  float8: 'double precision',
  bool: 'boolean',
  timestamptz: 'timestamptz',
  timestamp: 'timestamp',
  date: 'date',
  time: 'time',
  uuid: 'uuid',
  jsonb: 'jsonb',
  json: 'json',
  numeric: 'numeric',
  bytea: 'bytea',
};

function columnTypeSql(col) {
  const { data_type, udt_name, character_maximum_length, numeric_precision, numeric_scale } = col;

  if (data_type === 'ARRAY') {
    const base = udt_name.startsWith('_') ? udt_name.slice(1) : udt_name;
    return `${UDT_TYPE_MAP[base] || base}[]`;
  }

  switch (data_type) {
    case 'character varying':
      return character_maximum_length ? `varchar(${character_maximum_length})` : 'varchar';
    case 'character':
      return character_maximum_length ? `char(${character_maximum_length})` : 'char';
    case 'numeric':
      return numeric_precision != null && numeric_scale != null
        ? `numeric(${numeric_precision},${numeric_scale})`
        : 'numeric';
    case 'timestamp without time zone':
      return 'timestamp';
    case 'timestamp with time zone':
      return 'timestamptz';
    case 'time without time zone':
      return 'time';
    case 'time with time zone':
      return 'timetz';
    case 'USER-DEFINED':
      return quoteIdent(udt_name);
    default:
      return data_type;
  }
}

// value: nilai kolom (sudah didekode oleh driver `pg`)
// dataType: data_type dari information_schema.columns, dipakai untuk
// membedakan json/jsonb/array/bytea yang bentuknya sama-sama object di JS.
function escapeSqlValue(value, dataType) {
  if (value === null || value === undefined) return 'NULL';

  if (dataType === 'bytea') {
    const buf = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
    return `'\\x${buf.toString('hex')}'`;
  }
  if (dataType === 'json' || dataType === 'jsonb') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  if (dataType === 'ARRAY') {
    if (!Array.isArray(value)) return 'NULL';
    const inner = value.map((v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`));
    return `ARRAY[${inner.join(', ')}]`;
  }
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (Buffer.isBuffer(value)) return `'\\x${value.toString('hex')}'`;

  const t = typeof value;
  if (t === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (t === 'bigint') return value.toString();
  if (t === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (t === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;

  return `'${String(value).replace(/'/g, "''")}'`;
}

/* ------------------------------------------------------------------ */
/* INTROSPEKSI                                                         */
/* ------------------------------------------------------------------ */

async function listTables(prisma) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = $1 AND table_type = 'BASE TABLE'
     ORDER BY table_name;`,
    SCHEMA,
  );
  return rows.map((r) => r.table_name);
}

async function listSequences(prisma) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT sequence_name FROM information_schema.sequences
     WHERE sequence_schema = $1 ORDER BY sequence_name;`,
    SCHEMA,
  );
  return rows.map((r) => r.sequence_name);
}

async function getColumns(prisma, table) {
  return prisma.$queryRawUnsafe(
    `SELECT column_name, data_type, udt_name, is_nullable, column_default,
            character_maximum_length, numeric_precision, numeric_scale
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position;`,
    SCHEMA,
    table,
  );
}

async function getPrimaryKeyColumns(prisma, table) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = $1 AND tc.table_name = $2
     ORDER BY kcu.ordinal_position;`,
    SCHEMA,
    table,
  );
  return rows.map((r) => r.column_name);
}

async function getUniqueConstraints(prisma) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT tc.table_name, tc.constraint_name, kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = $1
     ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;`,
    SCHEMA,
  );
  const groups = new Map();
  for (const r of rows) {
    const key = `${r.table_name}::${r.constraint_name}`;
    if (!groups.has(key)) groups.set(key, { table: r.table_name, name: r.constraint_name, cols: [] });
    groups.get(key).cols.push(r.column_name);
  }
  return [...groups.values()];
}

async function getForeignKeys(prisma) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT tc.constraint_name, tc.table_name, kcu.column_name,
            ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name,
            rc.update_rule, rc.delete_rule
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage ccu
       ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
     JOIN information_schema.referential_constraints rc
       ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1
     ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;`,
    SCHEMA,
  );
  const groups = new Map();
  for (const r of rows) {
    const key = `${r.table_name}::${r.constraint_name}`;
    if (!groups.has(key)) {
      groups.set(key, {
        table: r.table_name,
        name: r.constraint_name,
        foreignTable: r.foreign_table_name,
        cols: [],
        foreignCols: [],
        updateRule: r.update_rule,
        deleteRule: r.delete_rule,
      });
    }
    const g = groups.get(key);
    g.cols.push(r.column_name);
    g.foreignCols.push(r.foreign_column_name);
  }
  return [...groups.values()];
}

async function getIndexes(prisma) {
  return prisma.$queryRawUnsafe(
    `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = $1 ORDER BY tablename, indexname;`,
    SCHEMA,
  );
}

/* ------------------------------------------------------------------ */
/* BUILDER SQL                                                         */
/* ------------------------------------------------------------------ */

function buildCreateTableSql(table, columns, pkCols) {
  const lines = columns.map((c) => {
    let line = `  ${quoteIdent(c.column_name)} ${columnTypeSql(c)}`;
    if (c.is_nullable === 'NO') line += ' NOT NULL';
    if (c.column_default !== null && c.column_default !== undefined) line += ` DEFAULT ${c.column_default}`;
    return line;
  });
  if (pkCols.length) lines.push(`  PRIMARY KEY (${pkCols.map(quoteIdent).join(', ')})`);
  return `CREATE TABLE IF NOT EXISTS ${quoteIdent(SCHEMA)}.${quoteIdent(table)} (\n${lines.join(',\n')}\n);`;
}

const INSERT_BATCH_SIZE = 200;

/**
 * Menghasilkan dump SQL lengkap (schema + data) dari database yang sedang
 * dipakai oleh Prisma Client `prisma`. Aman untuk ditempel ke Supabase SQL
 * Editor: dibungkus transaksi, memakai IF NOT EXISTS, dan urutan constraint
 * diatur supaya tidak terjadi error referensi.
 */
async function generateDatabaseDump(prisma) {
  const out = [];
  const push = (s) => out.push(s);

  push('-- ============================================================');
  push('-- DATABASE BACKUP');
  push(`-- Dibuat pada : ${new Date().toISOString()}`);
  push('-- Sumber      : Panel Admin - Fitur Download Database');
  push('-- Cara pakai  : Tempel seluruh isi file ini ke Supabase SQL Editor lalu jalankan (Run).');
  push('-- ============================================================');
  push('');
  push('SET statement_timeout = 0;');
  push("SET client_encoding = 'UTF8';");
  push('BEGIN;');
  push('');

  const tables = await listTables(prisma);
  const sequences = await listSequences(prisma);

  if (sequences.length) {
    push('-- ----------------------------------------');
    push('-- SEQUENCES');
    push('-- ----------------------------------------');
    for (const seq of sequences) push(`CREATE SEQUENCE IF NOT EXISTS ${quoteIdent(SCHEMA)}.${quoteIdent(seq)};`);
    push('');
  }

  const tableMeta = {};

  push('-- ----------------------------------------');
  push('-- TABLES');
  push('-- ----------------------------------------');
  for (const table of tables) {
    const columns = await getColumns(prisma, table);
    const pkCols = await getPrimaryKeyColumns(prisma, table);
    tableMeta[table] = { columns, pkCols };
    push(buildCreateTableSql(table, columns, pkCols));
    push('');
  }

  push('-- ----------------------------------------');
  push('-- DATA');
  push('-- ----------------------------------------');
  for (const table of tables) {
    const { columns } = tableMeta[table];
    const colNames = columns.map((c) => c.column_name);
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM ${quoteIdent(SCHEMA)}.${quoteIdent(table)};`);

    if (!rows.length) {
      push(`-- Tabel "${table}" kosong, dilewati.`);
      continue;
    }

    push(`-- Data tabel "${table}" (${rows.length} baris)`);
    for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
      const chunk = rows.slice(i, i + INSERT_BATCH_SIZE);
      const valuesSql = chunk
        .map((row) => `  (${columns.map((c) => escapeSqlValue(row[c.column_name], c.data_type)).join(', ')})`)
        .join(',\n');
      push(`INSERT INTO ${quoteIdent(SCHEMA)}.${quoteIdent(table)} (${colNames.map(quoteIdent).join(', ')}) VALUES\n${valuesSql};`);
    }
    push('');
  }

  const uniqueConstraints = await getUniqueConstraints(prisma);
  const skipIndexNames = new Set(uniqueConstraints.map((u) => u.name));
  for (const table of tables) {
    if (tableMeta[table].pkCols.length) skipIndexNames.add(`${table}_pkey`);
  }

  if (uniqueConstraints.length) {
    push('-- ----------------------------------------');
    push('-- UNIQUE CONSTRAINTS');
    push('-- ----------------------------------------');
    for (const u of uniqueConstraints) {
      push(
        `ALTER TABLE ${quoteIdent(SCHEMA)}.${quoteIdent(u.table)} ADD CONSTRAINT ${quoteIdent(u.name)} UNIQUE (${u.cols
          .map(quoteIdent)
          .join(', ')});`,
      );
    }
    push('');
  }

  const foreignKeys = await getForeignKeys(prisma);
  if (foreignKeys.length) {
    push('-- ----------------------------------------');
    push('-- FOREIGN KEYS');
    push('-- ----------------------------------------');
    for (const fk of foreignKeys) {
      push(
        `ALTER TABLE ${quoteIdent(SCHEMA)}.${quoteIdent(fk.table)} ADD CONSTRAINT ${quoteIdent(fk.name)} ` +
          `FOREIGN KEY (${fk.cols.map(quoteIdent).join(', ')}) REFERENCES ${quoteIdent(SCHEMA)}.${quoteIdent(fk.foreignTable)} ` +
          `(${fk.foreignCols.map(quoteIdent).join(', ')}) ON UPDATE ${fk.updateRule} ON DELETE ${fk.deleteRule};`,
      );
    }
    push('');
  }

  const indexes = await getIndexes(prisma);
  const extraIndexes = indexes.filter((idx) => !skipIndexNames.has(idx.indexname));
  if (extraIndexes.length) {
    push('-- ----------------------------------------');
    push('-- INDEXES TAMBAHAN');
    push('-- ----------------------------------------');
    for (const idx of extraIndexes) {
      const def = idx.indexdef.replace(/^CREATE (UNIQUE )?INDEX /i, 'CREATE $1INDEX IF NOT EXISTS ');
      push(`${def};`);
    }
    push('');
  }

  push('-- ----------------------------------------');
  push('-- RESET SEQUENCE (supaya id berikutnya tidak bentrok setelah import)');
  push('-- ----------------------------------------');
  for (const table of tables) {
    const { columns, pkCols } = tableMeta[table];
    if (pkCols.length !== 1) continue;
    const pkCol = columns.find((c) => c.column_name === pkCols[0]);
    if (!pkCol || !pkCol.column_default) continue;
    const match = /nextval\('([^']+)'::regclass\)/.exec(pkCol.column_default);
    if (!match) continue;
    push(
      `SELECT setval('${match[1]}', COALESCE((SELECT MAX(${quoteIdent(pkCol.column_name)}) FROM ${quoteIdent(SCHEMA)}.${quoteIdent(table)}), 1), true);`,
    );
  }
  push('');
  push('COMMIT;');
  push('');

  return out.join('\n');
}

/**
 * Ringkasan cepat (jumlah tabel, perkiraan jumlah baris & ukuran) untuk
 * ditampilkan di panel admin sebelum admin menekan tombol download.
 * Memakai statistik pg_class (reltuples) supaya tidak perlu full scan.
 */
async function getDatabaseSummary(prisma) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT c.relname AS table_name,
            GREATEST(COALESCE(c.reltuples, 0)::bigint, 0) AS estimated_rows,
            pg_total_relation_size(c.oid) AS size_bytes
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = $1 AND c.relkind = 'r'
     ORDER BY c.relname;`,
    SCHEMA,
  );

  const tables = rows.map((r) => ({
    name: r.table_name,
    estimatedRows: Number(r.estimated_rows),
    sizeBytes: Number(r.size_bytes),
  }));

  return {
    tables,
    totalTables: tables.length,
    totalRows: tables.reduce((sum, t) => sum + t.estimatedRows, 0),
    totalSizeBytes: tables.reduce((sum, t) => sum + t.sizeBytes, 0),
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { generateDatabaseDump, getDatabaseSummary };
