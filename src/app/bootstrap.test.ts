import { describe, expect, it } from "vitest";
import {
  DATASET_STORAGE_KEY,
  LocalStorageDatasetRepository,
  type StorageLike,
} from "../storage/datasetRepository";
import { bootstrapDataset } from "./bootstrap";

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("workspace bootstrap", () => {
  it("seeds synthetic data only when storage is genuinely absent", () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageDatasetRepository(storage);
    const first = bootstrapDataset(repository, "2026-10-18T12:00:00.000Z");
    expect(first.status).toBe("ready");
    if (first.status !== "ready") throw new Error("Expected a ready workspace");
    expect(first.dataset.examples.every((example) => example.origin === "demo")).toBe(true);

    const savedBeforeSecondBoot = storage.values.get(DATASET_STORAGE_KEY);
    const second = bootstrapDataset(repository, "2026-10-19T12:00:00.000Z");
    expect(second.status).toBe("ready");
    expect(storage.values.get(DATASET_STORAGE_KEY)).toBe(savedBeforeSecondBoot);
  });

  it("does not overwrite a malformed saved workspace with demo data", () => {
    const storage = new MemoryStorage();
    storage.values.set(DATASET_STORAGE_KEY, "not valid JSON");
    const repository = new LocalStorageDatasetRepository(storage);
    const result = bootstrapDataset(repository);

    expect(result.status).toBe("recovery");
    expect(storage.values.get(DATASET_STORAGE_KEY)).toBe("not valid JSON");
  });

  it("returns a recovery state if the initial seed cannot be persisted", () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    const repository = new LocalStorageDatasetRepository(storage);
    const result = bootstrapDataset(repository);

    expect(result.status).toBe("recovery");
    if (result.status === "recovery") expect(result.message).toMatch(/change was not saved/i);
  });
});
