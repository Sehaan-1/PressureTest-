import { describe, expect, it } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  LocalStorageConsentRepository,
  measureStorageBytes,
  type StorageLike,
} from "./consentRepository";

class MemoryStorage implements StorageLike {
  private readonly items = new Map<string, string>();

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }
}

describe("LocalStorageConsentRepository", () => {
  it("returns null when no storage preference has been saved", () => {
    const repo = new LocalStorageConsentRepository(new MemoryStorage());
    expect(repo.load()).toBeNull();
  });

  it("saves, loads, and clears explicit consent choices", () => {
    const storage = new MemoryStorage();
    const repo = new LocalStorageConsentRepository(storage);

    const saved = repo.save("essential_only", "2026-10-21T08:00:00.000Z");
    expect(saved).toEqual({
      schemaVersion: 1,
      level: "essential_only",
      decidedAt: "2026-10-21T08:00:00.000Z",
    });
    expect(repo.load()).toEqual(saved);
    expect(measureStorageBytes(storage, [CONSENT_STORAGE_KEY])).toBeGreaterThan(0);

    repo.clear();
    expect(repo.load()).toBeNull();
  });

  it("treats corrupted storage payloads safely as unset", () => {
    const storage = new MemoryStorage();
    storage.setItem(CONSENT_STORAGE_KEY, "{not-valid-json");
    const repo = new LocalStorageConsentRepository(storage);
    expect(repo.load()).toBeNull();
  });
});
