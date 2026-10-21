import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Download, FileDown, FileText, FileUp, Plus, Search } from "lucide-react";
import { useDataset } from "../../app/DatasetContext";
import type { ToastMessage } from "../../app/App";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import {
  addExample,
  appendExamples,
  deriveAnnotationStatus,
  removeExample,
  replaceExamples,
} from "../../domain/dataset";
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
    const confirmed = window.confirm(`Delete "${example.question}"? This cannot be undone.`);
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
        title="Every response, in one place."
        description="Inspect source conversations and human labels locally. Import CSV or JSON files without uploading research data."
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

      <section className="kpi-band dataset-kpi-band" aria-label="Dataset summary counts">
        <div className="kpi-cell">
          <span className="kpi-cell__label">Total conversations</span>
          <strong className="kpi-cell__value">{counts.total.toLocaleString()}</strong>
          <span className="kpi-cell__detail">schema version {dataset.schemaVersion}.0</span>
        </div>
        <div className="kpi-cell">
          <span className="kpi-cell__label">Annotated</span>
          <strong className="kpi-cell__value">{counts.complete.toLocaleString()}</strong>
          <span className="kpi-cell__detail">all three required labels saved</span>
        </div>
        <div className="kpi-cell">
          <span className="kpi-cell__label">Needs review</span>
          <strong className="kpi-cell__value">{counts.needsReview.toLocaleString()}</strong>
          <span className="kpi-cell__detail">remaining in annotation queue</span>
        </div>
      </section>

      <div className="legal-tabs dataset-tabs" role="tablist" aria-label="Filter dataset by status">
        <button
          role="tab"
          aria-selected={filter === "all"}
          className={`legal-tab${filter === "all" ? " legal-tab--active" : ""}`}
          onClick={() => setFilter("all")}
          type="button"
        >
          All ({counts.total})
        </button>
        <button
          role="tab"
          aria-selected={filter === "needs_review"}
          className={`legal-tab${filter === "needs_review" ? " legal-tab--active" : ""}`}
          onClick={() => setFilter("needs_review")}
          type="button"
        >
          Needs review ({counts.needsReview})
        </button>
        <button
          role="tab"
          aria-selected={filter === "complete"}
          className={`legal-tab${filter === "complete" ? " legal-tab--active" : ""}`}
          onClick={() => setFilter("complete")}
          type="button"
        >
          Annotated ({counts.complete})
        </button>
      </div>

      <div className="dataset-toolbar">
        <label className="search-field dataset-search-field" htmlFor="dataset-search-input">
          <Search size={15} aria-hidden="true" />
          <input
            id="dataset-search-input"
            aria-label="Search dataset"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Filter by question, model, category, or ID"
            type="search"
            value={query}
          />
        </label>

        <div className="dataset-export-actions">
          <span className="meta-stamp">
            Showing <strong>{visibleExamples.length}</strong> of {counts.total}
          </span>
          <Button
            variant="secondary"
            size="small"
            icon={<FileDown size={14} />}
            onClick={exportCsv}
          >
            Download CSV
          </Button>
          <Button
            variant="secondary"
            size="small"
            icon={<FileText size={14} />}
            onClick={exportTemplate}
          >
            Download blank template
          </Button>
          <Button
            variant="secondary"
            size="small"
            icon={<Download size={14} />}
            onClick={exportJson}
          >
            Download JSON
          </Button>
        </div>
      </div>

      <DatasetTable
        examples={visibleExamples}
        onDelete={(id) => {
          const example = dataset.examples.find((candidate) => candidate.id === id);
          if (example) deleteExample(example);
        }}
        onOpenExample={onOpenExample}
      />

      <p className="dataset-privacy-note">
        <strong>Local storage notice:</strong> Datasets remain in your browser profile only and are
        not encrypted or synced online. Export JSON backups regularly and omit personal identifiers
        when importing transcripts.
      </p>

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
