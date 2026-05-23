import { localInstallIdSchema } from "@nidoru/validation";

export type LocalInstallIdentityBindValue = string | number | null;

export type LocalInstallIdentityDatabase = {
  getFirstAsync<Row>(
    source: string,
    params?: readonly LocalInstallIdentityBindValue[],
  ): Promise<Row | null>;
  runAsync(
    source: string,
    params?: readonly LocalInstallIdentityBindValue[],
  ): Promise<unknown>;
};

export type GetOrCreateLocalInstallIdentityInput = {
  readonly database: LocalInstallIdentityDatabase;
  readonly now?: Date;
  readonly createId?: () => string;
};

export function createLocalInstallId(createRandomSegment = createDefaultRandomSegment): string {
  const randomSegment = createRandomSegment()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 64);
  const paddedSegment =
    randomSegment.length >= 8
      ? randomSegment
      : `${randomSegment}${"0".repeat(8 - randomSegment.length)}`;

  return localInstallIdSchema.parse(`install_${paddedSegment}`);
}

export async function getOrCreateLocalInstallIdentity({
  createId = createLocalInstallId,
  database,
  now = new Date(),
}: GetOrCreateLocalInstallIdentityInput): Promise<string> {
  const existingIdentity = await database.getFirstAsync<{ local_install_id: string }>(
    "SELECT local_install_id FROM local_install_identity ORDER BY created_at LIMIT 1;",
  );

  if (existingIdentity) {
    return localInstallIdSchema.parse(existingIdentity.local_install_id);
  }

  const localInstallId = localInstallIdSchema.parse(createId());
  const nowIso = now.toISOString();

  await database.runAsync(
    `
      INSERT INTO local_install_identity (local_install_id, created_at, last_seen_at)
      VALUES (?, ?, ?);
    `,
    [localInstallId, nowIso, nowIso],
  );

  return localInstallId;
}

function createDefaultRandomSegment(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) {
    return randomUuid.replaceAll("-", "_");
  }

  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
}
