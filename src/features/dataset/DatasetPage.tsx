import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Check, Download, FileDown, FileText, FileUp, Plus, Search, Table2 } from "lucide-react";
import { useDataset } from "../../app/DatasetContext";
import type { ToastMessage } from "../../app/App";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { deriveAnnotationStatus } from "../../domain/dataset";
import { addExample, appendExamples, removeExample, replaceExamples } from "../../domain/dataset";
import {
  parseImportText,
  serializeDatasetJson,
  serializeExamplesCsv,
  type ImportResult,
} from "../../domain/exchange";
import { MAX_IMPORT_BYTES } from "../../domain/schema";
import type { Example } from "../../domain/schema";
import { downloadText } from "../../utils/download";
import { DatasetTable } from "./DatasetTable";
import { ExampleFormDialog } from "./ExampleFormDialog";
import { ImportReviewDialog } from "./ImportReviewDialog";

interface DatasetPageProps {
  onOpenExample: (exampleId: string) => void;
  showToast: (message: string, kind?: ToastMessage["kind"]) => void;
}

interface ImportDialogState {
  filename: string;
  result: ImportResult;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "This change could not be completed.";
}

export function DatasetPage({ onOpenExample, showToast }: DatasetPageProps) {
  const { dataset, commit } = useDataset();
  const fileInput = useRef<HTMLInputElement>(null);
  const [showExampleForm, setShowExampleForm] = useState(false);
  const [importDialog, setImportDialog] = useState<ImportDialogState | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "needs_review" | "complete">("all");

  const counts = useMemo(() => {
    const complete = dataset.examples.filter(
      (example) => deriveAnnotationStatus(example.annotation) === "complete",
    ).length;
    return {
      total: dataset.examples.length,
      complete,
      needsReview: dataset.examples.length - complete,
    };
  }, [dataset.examples]);

  const visibleExamples = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return dataset.examples.filter((example) => {
      const status = deriveAnnotationStatus(example.annotation);
      if (filter === "needs_review" && status === "complete") return false;
      if (filter === "complete" && status !== "complete") return false;
      if (!normalizedQuery) return true;
      return [example.id, example.question, example.model, example.category, example.language].some(
        (value) => value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [dataset.examples, filter, query]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    if (file.size > MAX_IMPORT_BYTES) {
      setImportDialog({
        filename: file.name,
        result: {
          success: false,
          problems: [
            {
              location: "File",
              message: `The file is larger than the ${MAX_IMPORT_BYTES / (1024 * 1024)} MB import limit.`,
            },
          ],
        },
      });
      return;
    }

    try {
      const text = await file.text();
      setImportDialog({ filename: file.name, result: parseImportText(text, file.name) });
    } catch {
      setImportDialog({
        filename: file.name,
        result: {
          success: false,
          problems: [
            { location: "File", message: "The file could not be read. Try exporting it again." },
          ],
        },
      });
    }
  }

  function createExample(example: Example): boolean {
    try {
      commit((current) => addExample(current, example));
      showToast("Conversation added to the annotation queue.");
      return true;
    } catch (error) {
      showToast(errorMessage(error), "error");
      return false;
    }
  }

  function importExamples(mode: "append" | "replace") {
    if (!importDialog?.result.success) return;
    const incoming = importDialog.result.examples;
    if (mode === "replace" && dataset.examples.length > 0) {
      const confirmed = window.confirm(
        `Replace all ${dataset.examples.length} current examples with ${incoming.length} imported examples? Export a backup first if you need the current workspace.`,
      );
      if (!confirmed) return;
    }

    try {
      if (mode === "replace") {
        commit(() => replaceExamples(incoming));
        showToast(
          `${incoming.length.toLocaleString()} examples replaced the current dataset.`,
          "info",
        );
      } else {
        let added = 0;
        let skipped = 0;
        commit((current) => {
          const result = appendExamples(current, incoming);
          added = result.added;
          skipped = result.skipped;
          return result.dataset;
        });
        showToast(
          incoming.length === 0
            ? "No rows to import; the workspace was unchanged."
            : added === 0
              ? `No new IDs to add · ${skipped} duplicates skipped.`
              : `${added.toLocaleString()} added · ${skipped} duplicate IDs skipped.`,
          incoming.length === 0 ? "info" : "success",
        );
      }
      setImportDialog(null);
    } catch (error) {
      showToast(errorMessage(error), "error");
    }
  }

  function deleteExample(example: Example) {
    const confirmed = window.confirm(`Delete “${example.question}”? This cannot be undone.`);
    if (!confirmed) return;
    try {
      const changed = commit((current) => removeExample(current, example.id));
      if (changed) showToast("Conversation removed from the workspace.", "info");
    } catch (error) {
      showToast(errorMessage(error), "error");
    }
  }

  function exportCsv() {
    try {
      downloadText(
        "pressuretest-data.csv",
        serializeExamplesCsv(dataset.examples),
        "text/csv;charset=utf-8",
      );
      showToast("Spreadsheet-safe CSV downloaded.");
    } catch {
      showToast("CSV export failed. Try exporting the JSON backup instead.", "error");
    }
  }

  function exportTemplate() {
    try {
      downloadText("pressuretest-template.csv", serializeExamplesCsv([]), "text/csv;charset=utf-8");
      showToast("Blank CSV template downloaded.", "info");
    } catch {
      showToast("The blank template could not be downloaded. Please try again.", "error");
    }
  }

  function exportJson() {
    try {
      downloadText(
        "pressuretest-data.json",
        serializeDatasetJson(dataset),
        "application/json;charset=utf-8",
      );
      showToast("Versioned JSON dataset downloaded.");
    } catch {
      showToast("JSON export failed. Please try again.", "error");
    }
  }

  return (
    <div className="dataset-page">
      <PageHeader
        eyebrow="DATASET MANAGEMENT"
        title="Every response, in one place."
        description="Keep source conversations and annotation labels together. Import or export without uploading your data."
        actions={
          <>
            <input
              accept=".csv,.json,text/csv,application/json"
              aria-label="Import CSV or JSON file"
              className="visually-hidden"
              tabIndex={-1}
              onChange={handleFileChange}
              ref={fileInput}
              type="file"
            />
            <Button
              variant="secondary"
              icon={<FileUp size={15} />}
              onClick={() => fileInput.current?.click()}
            >
              Import file
            </Button>
            <Button icon={<Plus size={15} />} onClick={() => setShowExampleForm(true)}>
              Add conversation
            </Button>
          </>
        }
      />

      <div className="dataset-summary-row">
        <div className="dataset-summary-card">
          <span className="dataset-summary-card__icon">
            <Table2 size={17} aria-hidden="true" />
          </span>
          <div>
            <strong>{counts.total.toLocaleString()}</strong>
            <span>Total examples</span>
          </div>
        </div>
        <div className="dataset-summary-card">
          <span className="dataset-summary-card__icon dataset-summary-card__icon--green">
            <Check size={17} aria-hidden="true" />
          </span>
          <div>
            <strong>{counts.complete.toLocaleString()}</strong>
            <span>Fully annotated</span>
          </div>
        </div>
        <div className="dataset-summary-card">
          <span className="dataset-summary-card__icon dataset-summary-card__icon--amber">
            <Search size={17} aria-hidden="true" />
          </span>
          <div>
            <strong>{counts.needsReview.toLocaleString()}</strong>
            <span>Still in queue</span>
          </div>
        </div>
        <div className="dataset-export-actions">
          <span>DOWNLOAD</span>
          <Button variant="ghost" size="small" icon={<FileDown size={15} />} onClick={exportCsv}>
            CSV
          </Button>
          <Button
            variant="ghost"
            size="small"
            icon={<FileText size={15} />}
            onClick={exportTemplate}
          >
            Blank template
          </Button>
          <Button variant="ghost" size="small" icon={<Download size={15} />} onClick={exportJson}>
            JSON
          </Button>
        </div>
      </div>

      <section className="dataset-browser panel">
        <div className="dataset-browser__toolbar">
          <fieldset className="dataset-browser__filters">
            <legend className="visually-hidden">Filter dataset</legend>
            <button
              aria-pressed={filter === "all"}
              className={filter === "all" ? "filter-tab--active" : ""}
              onClick={() => setFilter("all")}
              type="button"
            >
              All <span>{counts.total}</span>
            </button>
            <button
              aria-pressed={filter === "needs_review"}
              className={filter === "needs_review" ? "filter-tab--active" : ""}
              onClick={() => setFilter("needs_review")}
              type="button"
            >
              Needs review <span>{counts.needsReview}</span>
            </button>
            <button
              aria-pressed={filter === "complete"}
              className={filter === "complete" ? "filter-tab--active" : ""}
              onClick={() => setFilter("complete")}
              type="button"
            >
              Annotated <span>{counts.complete}</span>
            </button>
          </fieldset>
          <label className="dataset-browser__search">
            <Search size={15} aria-hidden="true" />
            <input
              aria-label="Search dataset"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search by question or model"
              type="search"
              value={query}
            />
          </label>
        </div>

        <div className="dataset-browser__caption">
          <span>
            Showing <strong>{visibleExamples.length}</strong> of {counts.total} conversations
          </span>
          <span>Local workspace · {dataset.schemaVersion}.0 schema</span>
        </div>
        <DatasetTable
          examples={visibleExamples}
          onDelete={(id) => {
            const example = dataset.examples.find((candidate) => candidate.id === id);
            if (example) deleteExample(example);
          }}
          onOpenExample={onOpenExample}
        />
      </section>

      <div className="dataset-privacy-note">
        <span className="dataset-privacy-note__icon">
          <Check size={14} aria-hidden="true" />
        </span>
        <p>
          <strong>Your dataset stays here.</strong> PressureTest stores this workspace in browser
          storage. Export JSON backups regularly; this app does not sync or encrypt local data.
        </p>
      </div>

      {showExampleForm ? (
        <ExampleFormDialog onClose={() => setShowExampleForm(false)} onCreate={createExample} />
      ) : null}
      {importDialog ? (
        <ImportReviewDialog
          filename={importDialog.filename}
          result={importDialog.result}
          onClose={() => setImportDialog(null)}
          onImport={importExamples}
        />
      ) : null}
    </div>
  );
}
