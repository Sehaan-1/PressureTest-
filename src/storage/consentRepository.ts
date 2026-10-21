import { z } from "zod";

export const CONSENT_STORAGE_KEY = "pressuretest.consent.v1";

export const consentLevelSchema = z.enum(["essential_only", "preferences_allowed"]);
export type ConsentLevel = z.infer<typeof consentLevelSchema>;

export const consentRecordSchema = z.object({
  schemaVersion: z.literal(1),
  level: consentLevelSchema,
  decidedAt: z.string().min(1),
});

export type ConsentRecord = z.infer<typeof consentRecordSchema>;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LocalStorageConsentRepository {
  private readonly storage: StorageLike;
  private readonly key: string;

  constructor(storage: StorageLike, key = CONSENT_STORAGE_KEY) {
    this.storage = storage;
    this.key = key;
  }

  load(): ConsentRecord | null {
    try {
      const raw = this.storage.getItem(this.key);
      if (raw === null) return null;
      const parsed = consentRecordSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  save(level: ConsentLevel, now = new Date().toISOString()): ConsentRecord {
    const record: ConsentRecord = {
      schemaVersion: 1,
      level,
      decidedAt: now,
    };
    this.storage.setItem(this.key, JSON.stringify(record));
    return record;
  }

  clear(): void {
    this.storage.removeItem(this.key);
  }
}

export function measureStorageBytes(storage: StorageLike, keys: string[]): number {
  let bytes = 0;
  for (const key of keys) {
    try {
      const value = storage.getItem(key);
      if (value !== null) {
        bytes += new TextEncoder().encode(key + value).byteLength;
      }
    } catch {
      // Ignore inaccessible keys when browser storage is restricted.
    }
  }
  return bytes;
}
