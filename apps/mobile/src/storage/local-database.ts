import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import { runSqliteMigrations } from "./sqlite-migrations";

export const localDatabaseName = "nidoru.db";

const migratedDatabasePromises = new Map<string, Promise<SQLiteDatabase>>();

export async function openMigratedLocalDatabase(
  databaseName = localDatabaseName,
): Promise<SQLiteDatabase> {
  const existingDatabasePromise = migratedDatabasePromises.get(databaseName);

  if (existingDatabasePromise) {
    return existingDatabasePromise;
  }

  const databasePromise = openAndMigrateLocalDatabase(databaseName).catch((error: unknown) => {
    migratedDatabasePromises.delete(databaseName);
    throw error;
  });
  migratedDatabasePromises.set(databaseName, databasePromise);

  return databasePromise;
}

async function openAndMigrateLocalDatabase(databaseName: string): Promise<SQLiteDatabase> {
  const database = await openDatabaseAsync(databaseName);

  await runSqliteMigrations(database);

  return database;
}
