import { createDemoDataset } from "../data/demoDataset";
import type { DatasetV1 } from "../domain/schema";
import {
  DatasetStorageError,
  getStorageErrorMessage,
  type DatasetRepository,
} from "../storage/datasetRepository";

export type BootstrapResult =
  | { status: "ready"; dataset: DatasetV1 }
  | { status: "recovery"; message: string };

export function bootstrapDataset(
  repository: DatasetRepository,
  now = new Date().toISOString(),
): BootstrapResult {
  try {
    const existing = repository.load();
    if (existing) return { status: "ready", dataset: existing };

    const demo = createDemoDataset(now);
    repository.save(demo);
    return { status: "ready", dataset: demo };
  } catch (error) {
    const message =
      error instanceof DatasetStorageError ? error.message : getStorageErrorMessage(error);
    return { status: "recovery", message };
  }
}
