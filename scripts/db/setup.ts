import { promises as fs } from "node:fs";
import path from "node:path";

import { Pool } from "pg";

const DEFAULT_EMBEDDING_DIM = 1536;

function normalizeEmbeddingDimension(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_EMBEDDING_DIM;
  }
  return Math.floor(parsed);
}

function withEmbeddingDimension(sql: string): string {
  const embeddingDimension = normalizeEmbeddingDimension(process.env.PGVECTOR_EMBEDDING_DIM);
  return sql.replaceAll("__EMBEDDING_DIM__", String(embeddingDimension));
}

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(/;\s*\n/g)
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => (statement.endsWith(";") ? statement : `${statement};`));
}

async function readMigrations(migrationsDir: string): Promise<Array<{ fileName: string; sql: string }>> {
  const files = (await fs.readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith(".sql"))
    .filter((fileName) => !fileName.startsWith("._"))
    .filter((fileName) => !fileName.startsWith("."))
    .sort((left, right) => left.localeCompare(right));

  const migrations: Array<{ fileName: string; sql: string }> = [];

  for (const fileName of files) {
    const migrationPath = path.join(migrationsDir, fileName);
    const sql = await fs.readFile(migrationPath, "utf8");
    migrations.push({ fileName, sql: withEmbeddingDimension(sql) });
  }

  return migrations;
}

async function setupDatabase(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for npm run db:setup");
  }

  const requireSsl =
    process.env.POSTGRES_SSL === "true" ||
    process.env.PGSSL === "true" ||
    (process.env.NODE_ENV === "production" && !connectionString.includes("localhost"));

  const pool = new Pool({
    connectionString,
    ssl: requireSsl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const migrationsDir = path.join(process.cwd(), "db", "migrations");
    const migrations = await readMigrations(migrationsDir);

    if (migrations.length === 0) {
      console.log("No SQL migrations found in db/migrations.");
      return;
    }

    for (const migration of migrations) {
      const statements = splitSqlStatements(migration.sql);
      for (const statement of statements) {
        await pool.query(statement);
      }
      console.log(`Applied migration: ${migration.fileName}`);
    }
  } finally {
    await pool.end();
  }
}

setupDatabase().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
