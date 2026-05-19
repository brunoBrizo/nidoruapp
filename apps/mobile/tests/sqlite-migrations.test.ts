import {
  runSqliteMigrations,
  sqliteMigrations,
  type SQLiteMigrationDatabase,
} from "../src/storage/sqlite-migrations.ts";

function assertEquals<T>(actual: T, expected: T): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertRejects(action: () => Promise<unknown>, pattern: RegExp): Promise<void> {
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    assertCondition(
      pattern.test(message),
      `Expected rejection matching ${pattern}, received ${message}`,
    );
    return;
  }

  throw new Error(`Expected rejection matching ${pattern}`);
}

class SqliteCliDatabase implements SQLiteMigrationDatabase {
  constructor(private readonly databasePath: string) {}

  async execAsync(source: string): Promise<void> {
    await runSqlite(this.databasePath, source);
  }

  async getAllAsync<Row>(source: string): Promise<Row[]> {
    const output = await runSqlite(this.databasePath, `.mode json\n${source}`);

    if (output.trim().length === 0) {
      return [];
    }

    return JSON.parse(output) as Row[];
  }
}

async function createDatabase(): Promise<{
  database: SqliteCliDatabase;
  cleanup: () => Promise<void>;
}> {
  const tempDirectory = await Deno.makeTempDir({ prefix: "nidoru-sqlite-migrations-" });
  const databasePath = `${tempDirectory}/test.db`;

  return {
    database: new SqliteCliDatabase(databasePath),
    cleanup: () => Deno.remove(tempDirectory, { recursive: true }),
  };
}

async function runSqlite(databasePath: string, source: string): Promise<string> {
  const command = new Deno.Command("sqlite3", {
    args: [databasePath],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });
  const child = command.spawn();
  const writer = child.stdin.getWriter();

  await writer.write(new TextEncoder().encode(source));
  await writer.close();

  const output = await child.output();
  const stderr = new TextDecoder().decode(output.stderr);

  if (!output.success) {
    throw new Error(stderr.trim());
  }

  return new TextDecoder().decode(output.stdout);
}

Deno.test("applies local SQLite migrations from an empty database", async () => {
  const { database, cleanup } = await createDatabase();

  try {
    const result = await runSqliteMigrations(database);
    const appliedRows = await database.getAllAsync<{ id: string }>(
      "SELECT id FROM local_schema_migrations ORDER BY id;",
    );
    const foundationTables = await database.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'local_%' ORDER BY name;",
    );

    assertEquals(
      result.appliedMigrationIds,
      sqliteMigrations.map((migration) => migration.id),
    );
    assertEquals(
      appliedRows.map((row) => row.id),
      sqliteMigrations.map((migration) => migration.id),
    );
    assertEquals(
      foundationTables.map((row) => row.name),
      ["local_database_metadata", "local_schema_migrations"],
    );
  } finally {
    await cleanup();
  }
});

Deno.test("does not reapply migrations that already ran", async () => {
  const { database, cleanup } = await createDatabase();

  try {
    await runSqliteMigrations(database);
    const result = await runSqliteMigrations(database);
    const appliedRows = await database.getAllAsync<{ id: string }>(
      "SELECT id FROM local_schema_migrations ORDER BY id;",
    );

    assertEquals(result.appliedMigrationIds, []);
    assertEquals(appliedRows.length, sqliteMigrations.length);
  } finally {
    await cleanup();
  }
});

Deno.test("rejects malformed migration definitions before applying them", async () => {
  const { database, cleanup } = await createDatabase();

  try {
    await assertRejects(
      () =>
        runSqliteMigrations(database, [
          { id: "0001_foundation", sql: "CREATE TABLE first_table (id TEXT PRIMARY KEY);" },
          { id: "0001_foundation", sql: "CREATE TABLE second_table (id TEXT PRIMARY KEY);" },
        ]),
      /Duplicate SQLite migration id: 0001_foundation/,
    );
  } finally {
    await cleanup();
  }
});

Deno.test("fails when SQLite cannot apply a migration from a clean database", async () => {
  const { database, cleanup } = await createDatabase();

  try {
    await assertRejects(
      () => runSqliteMigrations(database, [{ id: "0001_broken", sql: "CREATE TABLE broken (" }]),
      /Failed to apply SQLite migration 0001_broken/,
    );

    const appliedRows = await database.getAllAsync<{ id: string }>(
      "SELECT id FROM local_schema_migrations ORDER BY id;",
    );

    assertEquals(appliedRows, []);
  } finally {
    await cleanup();
  }
});
