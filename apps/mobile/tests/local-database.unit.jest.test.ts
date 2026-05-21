import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { openDatabaseAsync } from "expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock("../src/storage/sqlite-migrations", () => ({
  runSqliteMigrations: jest.fn(),
}));

import { runSqliteMigrations } from "../src/storage/sqlite-migrations";
import { openMigratedLocalDatabase } from "../src/storage/local-database";

const mockOpenDatabaseAsync = openDatabaseAsync as jest.MockedFunction<typeof openDatabaseAsync>;
const mockRunSqliteMigrations = runSqliteMigrations as jest.MockedFunction<
  typeof runSqliteMigrations
>;

describe("openMigratedLocalDatabase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunSqliteMigrations.mockResolvedValue(undefined);
  });

  it("shares one migrated database connection across concurrent callers", async () => {
    const database = {} as SQLiteDatabase;
    mockOpenDatabaseAsync.mockResolvedValue(database);

    const [firstDatabase, secondDatabase] = await Promise.all([
      openMigratedLocalDatabase("unit-concurrent.db"),
      openMigratedLocalDatabase("unit-concurrent.db"),
    ]);
    const thirdDatabase = await openMigratedLocalDatabase("unit-concurrent.db");

    expect(firstDatabase).toBe(database);
    expect(secondDatabase).toBe(database);
    expect(thirdDatabase).toBe(database);
    expect(mockOpenDatabaseAsync).toHaveBeenCalledTimes(1);
    expect(mockOpenDatabaseAsync).toHaveBeenCalledWith("unit-concurrent.db");
    expect(mockRunSqliteMigrations).toHaveBeenCalledTimes(1);
    expect(mockRunSqliteMigrations).toHaveBeenCalledWith(database);
  });

  it("retries opening and migrating after a failed migration", async () => {
    const failedDatabase = {} as SQLiteDatabase;
    const retriedDatabase = {} as SQLiteDatabase;
    mockOpenDatabaseAsync
      .mockResolvedValueOnce(failedDatabase)
      .mockResolvedValueOnce(retriedDatabase);
    mockRunSqliteMigrations
      .mockRejectedValueOnce(new Error("migration failed"))
      .mockResolvedValueOnce(undefined);

    await expect(openMigratedLocalDatabase("unit-retry.db")).rejects.toThrow("migration failed");
    await expect(openMigratedLocalDatabase("unit-retry.db")).resolves.toBe(retriedDatabase);

    expect(mockOpenDatabaseAsync).toHaveBeenCalledTimes(2);
    expect(mockRunSqliteMigrations).toHaveBeenCalledTimes(2);
    expect(mockRunSqliteMigrations).toHaveBeenNthCalledWith(1, failedDatabase);
    expect(mockRunSqliteMigrations).toHaveBeenNthCalledWith(2, retriedDatabase);
  });
});
