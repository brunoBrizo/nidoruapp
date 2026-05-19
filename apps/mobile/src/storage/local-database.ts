import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import { runSqliteMigrations } from "./sqlite-migrations";

export const localDatabaseName = "nidoru.db";

export async function openMigratedLocalDatabase(
  databaseName = localDatabaseName,
): Promise<SQLiteDatabase> {
  const database = await openDatabaseAsync(databaseName);

  await runSqliteMigrations(database);

  return database;
}
