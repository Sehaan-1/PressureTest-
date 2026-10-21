import { describe, expect, it } from "vitest";
import { createDemoDataset } from "../data/demoDataset";
import {
  DATASET_STORAGE_KEY,
  DatasetStorageError,
  LocalStorageDatasetRepository,
  type StorageLike,
} from "./datasetRepository";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("LocalStorageDatasetRepository", () => {
  it("returns null when the workspace is genuinely absent", () => {
    const repository = new LocalStorageDatasetRepository(new MemoryStorage());
    expect(repository.load()).toBeNull();
  });

  it("saves and validates one complete versioned snapshot", () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageDatasetRepository(storage);
    const dataset = createDemoDataset("2026-10-18T12:00:00.000Z");

    repository.save(dataset);

    expect(storage.values.has(DATASET_STORAGE_KEY)).toBe(true);
    expect(repository.load()).toEqual(dataset);
  });

  it("preserves unreadable stored values and returns a typed recovery error", () => {
    const storage = new MemoryStorage();
    storage.values.set(DATASET_STORAGE_KEY, "{not-json");
    const repository = new LocalStorageDatasetRepository(storage);

    expect(() => repository.load()).toThrowError(DatasetStorageError);
    expect(storage.values.get(DATASET_STORAGE_KEY)).toBe("{not-json");
    try {
      repository.load();
    } catch (error) {
      expect(error).toMatchObject({ code: "invalid_data" });
    }
  });

  it("does not overwrite data saved with an unsupported schema version", () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({
      schemaVersion: 7,
      updatedAt: "2026-10-18T12:00:00.000Z",
      examples: [],
    });
    storage.values.set(DATASET_STORAGE_KEY, raw);
    const repository = new LocalStorageDatasetRepository(storage);

    expect(() => repository.load()).toThrow(/unsupported version/i);
    expect(storage.values.get(DATASET_STORAGE_KEY)).toBe(raw);
  });

  it("leaves the previous snapshot intact when a write fails", () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageDatasetRepository(storage);
    const original = createDemoDataset("2026-10-18T12:00:00.000Z");
    repository.save(original);
    const previous = storage.values.get(DATASET_STORAGE_KEY);
    storage.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };

    expect(() => repository.save(createDemoDataset("2026-10-19T12:00:00.000Z"))).toThrow(
      /change was not saved/i,
    );
    expect(storage.values.get(DATASET_STORAGE_KEY)).toBe(previous);
    expect(repository.load()).toEqual(original);
  });

  it("wraps storage access failures without exposing browser internals", () => {
    const brokenStorage: StorageLike = {
      getItem: () => {
        throw new DOMException("Blocked by policy", "SecurityError");
      },
      setItem: () => {
        throw new DOMException("Blocked by policy", "SecurityError");
      },
    };
    const repository = new LocalStorageDatasetRepository(brokenStorage);

    expect(() => repository.load()).toThrow(/could not access browser storage/i);
    expect(() => repository.save(createDemoDataset())).toThrow(/change was not saved/i);
  });
});
