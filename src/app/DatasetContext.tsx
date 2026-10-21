import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { DatasetV1 } from "../domain/schema";
import {
  DatasetStorageError,
  getStorageErrorMessage,
  type DatasetRepository,
} from "../storage/datasetRepository";

export type DatasetOperation = (current: DatasetV1) => DatasetV1;

interface DatasetContextValue {
  dataset: DatasetV1;
  commit: (operation: DatasetOperation) => boolean;
  saveError: string | null;
  clearSaveError: () => void;
}

const DatasetContext = createContext<DatasetContextValue | null>(null);

interface DatasetProviderProps {
  initialDataset: DatasetV1;
  repository: DatasetRepository;
  children: ReactNode;
}

export function DatasetProvider({ initialDataset, repository, children }: DatasetProviderProps) {
  const [dataset, setDataset] = useState(initialDataset);
  const datasetRef = useRef(initialDataset);
  const [saveError, setSaveError] = useState<string | null>(null);

  const commit = useCallback(
    (operation: DatasetOperation) => {
      const current = datasetRef.current;
      const next = operation(current);
      if (next === current) return false;

      try {
        repository.save(next);
      } catch (error) {
        if (error instanceof DatasetStorageError) {
          setSaveError(getStorageErrorMessage(error));
        }
        throw error;
      }

      datasetRef.current = next;
      setDataset(next);
      setSaveError(null);
      return true;
    },
    [repository],
  );

  const clearSaveError = useCallback(() => setSaveError(null), []);
  const value = useMemo(
    () => ({ dataset, commit, saveError, clearSaveError }),
    [dataset, commit, saveError, clearSaveError],
  );

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

export function useDataset(): DatasetContextValue {
  const value = useContext(DatasetContext);
  if (!value) throw new Error("useDataset must be used within DatasetProvider.");
  return value;
}
