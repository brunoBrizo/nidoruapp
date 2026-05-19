export type SQLiteMigration = {
  readonly id: string;
  readonly sql: string;
};

export type SQLiteMigrationDatabase = {
  execAsync(source: string): Promise<void>;
  getAllAsync<Row>(source: string): Promise<Row[]>;
};

export type SQLiteMigrationResult = {
  readonly appliedMigrationIds: string[];
};

const migrationIdPattern = /^\d{4}_[a-z0-9_]+$/;

export const sqliteMigrations = [
  {
    id: "0001_local_foundation",
    sql: `
      CREATE TABLE local_database_metadata (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
] as const satisfies readonly SQLiteMigration[];

export async function runSqliteMigrations(
  database: SQLiteMigrationDatabase,
  migrations: readonly SQLiteMigration[] = sqliteMigrations,
): Promise<SQLiteMigrationResult> {
  validateMigrations(migrations);

  await database.execAsync("PRAGMA foreign_keys = ON;");
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS local_schema_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRows = await database.getAllAsync<{ id: string }>(
    "SELECT id FROM local_schema_migrations ORDER BY id;",
  );
  const appliedMigrationIds = new Set(appliedRows.map((row) => row.id));
  const nextAppliedMigrationIds: string[] = [];

  for (const migration of migrations) {
    if (appliedMigrationIds.has(migration.id)) {
      continue;
    }

    await applyMigration(database, migration);
    nextAppliedMigrationIds.push(migration.id);
  }

  return { appliedMigrationIds: nextAppliedMigrationIds };
}

function validateMigrations(migrations: readonly SQLiteMigration[]): void {
  const seenMigrationIds = new Set<string>();
  let previousMigrationId = "";

  for (const migration of migrations) {
    if (!migrationIdPattern.test(migration.id)) {
      throw new Error(`Invalid SQLite migration id: ${migration.id}`);
    }

    if (seenMigrationIds.has(migration.id)) {
      throw new Error(`Duplicate SQLite migration id: ${migration.id}`);
    }

    if (migration.id <= previousMigrationId) {
      throw new Error(`SQLite migrations must be sorted by id: ${migration.id}`);
    }

    if (migration.sql.trim().length === 0) {
      throw new Error(`SQLite migration ${migration.id} has empty SQL`);
    }

    seenMigrationIds.add(migration.id);
    previousMigrationId = migration.id;
  }
}

async function applyMigration(
  database: SQLiteMigrationDatabase,
  migration: SQLiteMigration,
): Promise<void> {
  try {
    await database.execAsync(`
      BEGIN IMMEDIATE;
      ${migration.sql}
      INSERT INTO local_schema_migrations (id)
      VALUES ('${migration.id}');
      COMMIT;
    `);
  } catch (error) {
    await database.execAsync("ROLLBACK;").catch(() => undefined);

    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to apply SQLite migration ${migration.id}: ${message}`);
  }
}
