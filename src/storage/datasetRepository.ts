import { datasetSchema, MAX_STORAGE_BYTES, type DatasetV1 } from "../domain/schema";

export const DATASET_STORAGE_KEY = "pressuretest.dataset.v1";

export type DatasetStorageErrorCode = "read_failed" | "invalid_data" | "write_failed" | "too_large";

export class DatasetStorageError extends Error {
  constructor(
    readonly code: DatasetStorageErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "DatasetStorageError";
  }
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface DatasetRepository {
  load(): DatasetV1 | null;
  save(dataset: DatasetV1): void;
  readRaw(): string | null;
}

export class LocalStorageDatasetRepository implements DatasetRepository {
  constructor(private readonly storage: StorageLike) {}

  readRaw(): string | null {
    try {
      return this.storage.getItem(DATASET_STORAGE_KEY);
    } catch (error) {
      throw new DatasetStorageError(
        "read_failed",
        "PressureTest could not access browser storage. Check browser privacy settings and try again.",
        { cause: error },
      );
    }
  }

  load(): DatasetV1 | null {
    const raw = this.readRaw();
    if (raw === null) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new DatasetStorageError(
        "invalid_data",
        "The saved workspace is unreadable. Its stored value has been left untouched.",
        { cause: error },
      );
    }

    const validation = datasetSchema.safeParse(parsed);
    if (!validation.success) {
      const unsupportedVersion =
        typeof parsed === "object" &&
        parsed !== null &&
        "schemaVersion" in parsed &&
        (parsed as { schemaVersion?: unknown }).schemaVersion !== 1;
      const message = unsupportedVersion
        ? "This workspace was saved with an unsupported version. Its stored value has been left untouched."
        : "The saved workspace does not match the current data schema. Its stored value has been left untouched.";
      throw new DatasetStorageError("invalid_data", message, { cause: validation.error });
    }

    return validation.data;
  }

  save(dataset: DatasetV1): void {
    const validation = datasetSchema.safeParse(dataset);
    if (!validation.success) {
      throw new DatasetStorageError(
        "invalid_data",
        "The workspace did not pass validation and was not saved.",
        { cause: validation.error },
      );
    }

    const serialized = JSON.stringify(validation.data);
    const byteLength = new TextEncoder().encode(serialized).byteLength;
    if (byteLength > MAX_STORAGE_BYTES) {
      throw new DatasetStorageError(
        "too_large",
        "This workspace is too large for reliable browser storage. Export a backup and reduce the dataset size.",
      );
    }

    try {
      this.storage.setItem(DATASET_STORAGE_KEY, serialized);
    } catch (error) {
      throw new DatasetStorageError(
        "write_failed",
        "The change was not saved. Browser storage may be full or unavailable; export a backup before continuing.",
        { cause: error },
      );
    }
  }
}

export function getStorageErrorMessage(error: unknown): string {
  if (error instanceof DatasetStorageError) return error.message;
  return "The workspace could not be saved. Please export a backup and try again.";
}
