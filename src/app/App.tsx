import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Download, RotateCcw, ShieldAlert } from "lucide-react";
import { AnalysisPage } from "../features/analysis/AnalysisPage";
import { AnnotationPage } from "../features/annotation/AnnotationPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { DatasetPage } from "../features/dataset/DatasetPage";
import { GuidelinesPage } from "../features/guidelines/GuidelinesPage";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { DatasetProvider, useDataset } from "./DatasetContext";
import { bootstrapDataset, type BootstrapResult } from "./bootstrap";
import type { PageId } from "./pageTypes";
import { createDemoDataset } from "../data/demoDataset";
import { downloadText } from "../utils/download";
import {
  LocalStorageDatasetRepository,
  type DatasetRepository,
} from "../storage/datasetRepository";
import { serializeDatasetJson } from "../domain/exchange";

interface RuntimeState {
  repository: DatasetRepository | null;
  bootstrap: BootstrapResult;
}

export interface ToastMessage {
  message: string;
  kind: "success" | "info" | "error";
}

function createRuntime(): RuntimeState {
  try {
    const repository = new LocalStorageDatasetRepository(window.localStorage);
    return { repository, bootstrap: bootstrapDataset(repository) };
  } catch {
    return {
      repository: null,
      bootstrap: {
        status: "recovery",
        message:
          "PressureTest could not access browser storage. Check browser privacy settings and retry.",
      },
    };
  }
}

export function App() {
  const [runtime, setRuntime] = useState(createRuntime);
  const [page, setPage] = useState<PageId>("overview");
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);
  const [annotationDirty, setAnnotationDirty] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = (message: string, kind: ToastMessage["kind"] = "success") => {
    setToast({ message, kind });
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3_800);
  };

  useEffect(
    () => () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  if (runtime.bootstrap.status !== "ready" || !runtime.repository) {
    const repository = runtime.repository;
    const retry = () => setRuntime(createRuntime());
    const downloadRaw = () => {
      try {
        const raw = repository?.readRaw();
        if (!raw) {
          showToast("No saved workspace file was found to download.", "info");
          return;
        }
        downloadText("pressuretest-storage-recovery.json", raw, "application/json;charset=utf-8");
        showToast("Raw workspace backup downloaded.");
      } catch {
        showToast("Browser storage is unavailable, so a raw backup could not be read.", "error");
      }
    };
    const resetToDemo = () => {
      if (!repository) return;
      const confirmed = window.confirm(
        "Replace the unreadable local workspace with a synthetic demo? Download a raw backup first if you may need the existing data.",
      );
      if (!confirmed) return;
      try {
        const demo = createDemoDataset();
        repository.save(demo);
        setRuntime({ repository, bootstrap: { status: "ready", dataset: demo } });
        showToast("A fresh synthetic workspace is ready.", "info");
      } catch {
        showToast(
          "The workspace could not be reset. Browser storage is still unavailable.",
          "error",
        );
      }
    };

    return (
      <div className="recovery-screen">
        <section className="recovery-card">
          <span className="recovery-card__icon">
            <ShieldAlert size={25} aria-hidden="true" />
          </span>
          <p className="eyebrow">LOCAL WORKSPACE RECOVERY</p>
          <h1>We couldn’t open your dataset.</h1>
          <p className="recovery-card__description">
            {runtime.bootstrap.status === "recovery"
              ? runtime.bootstrap.message
              : "PressureTest could not access browser storage. Retry or check browser privacy settings."}
          </p>
          <p className="recovery-card__note">
            The existing stored value has not been replaced. If this is a saved dataset, download a
            raw backup before resetting.
          </p>
          <div className="recovery-card__actions">
            <Button icon={<RotateCcw size={16} />} onClick={retry}>
              Try again
            </Button>
            <Button variant="secondary" icon={<Download size={16} />} onClick={downloadRaw}>
              Download raw backup
            </Button>
          </div>
          {repository ? (
            <button className="recovery-reset" onClick={resetToDemo} type="button">
              Replace workspace with a fresh synthetic sample
            </button>
          ) : null}
        </section>
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  return (
    <DatasetProvider initialDataset={runtime.bootstrap.dataset} repository={runtime.repository}>
      <Workspace
        page={page}
        setPage={setPage}
        selectedExampleId={selectedExampleId}
        setSelectedExampleId={setSelectedExampleId}
        annotationDirty={annotationDirty}
        setAnnotationDirty={setAnnotationDirty}
        showToast={showToast}
        toast={toast}
        dismissToast={() => setToast(null)}
      />
    </DatasetProvider>
  );
}

interface WorkspaceProps {
  page: PageId;
  setPage: (page: PageId) => void;
  selectedExampleId: string | null;
  setSelectedExampleId: (id: string | null) => void;
  annotationDirty: boolean;
  setAnnotationDirty: (dirty: boolean) => void;
  showToast: (message: string, kind?: ToastMessage["kind"]) => void;
  toast: ToastMessage | null;
  dismissToast: () => void;
}

function Workspace({
  page,
  setPage,
  selectedExampleId,
  setSelectedExampleId,
  annotationDirty,
  setAnnotationDirty,
  showToast,
  toast,
  dismissToast,
}: WorkspaceProps) {
  const { dataset } = useDataset();
  const isDemo = dataset.examples.some((example) => example.origin === "demo");

  const navigate = (nextPage: PageId) => {
    if (
      page === "annotate" &&
      nextPage !== page &&
      annotationDirty &&
      !window.confirm("You have unsaved annotation labels. Leave this page and discard them?")
    ) {
      return;
    }
    setPage(nextPage);
  };

  const openAnnotation = (exampleId?: string) => {
    if (exampleId) setSelectedExampleId(exampleId);
    navigate("annotate");
  };

  const exportBackup = () => {
    try {
      downloadText(
        "pressuretest-backup.json",
        serializeDatasetJson(dataset),
        "application/json;charset=utf-8",
      );
      showToast("Versioned JSON backup downloaded.");
    } catch {
      showToast("The workspace could not be exported. Please try again.", "error");
    }
  };

  let content: ReactNode;
  switch (page) {
    case "overview":
      content = (
        <DashboardPage onAnnotate={() => openAnnotation()} onOpenExample={openAnnotation} />
      );
      break;
    case "annotate":
      content = (
        <AnnotationPage
          selectedExampleId={selectedExampleId}
          onSelectExample={setSelectedExampleId}
          onDirtyChange={setAnnotationDirty}
          showToast={showToast}
        />
      );
      break;
    case "dataset":
      content = <DatasetPage onOpenExample={openAnnotation} showToast={showToast} />;
      break;
    case "analysis":
      content = <AnalysisPage />;
      break;
    case "guidelines":
      content = <GuidelinesPage />;
      break;
  }

  return (
    <>
      <AppShell page={page} onNavigate={navigate} isDemo={isDemo} onExport={exportBackup}>
        {content}
      </AppShell>
      <Toast message={toast} onClose={dismissToast} />
    </>
  );
}

function Toast({ message, onClose }: { message: ToastMessage | null; onClose: () => void }) {
  if (!message) return null;
  const Icon = message.kind === "error" ? ShieldAlert : CheckCircle2;
  return (
    <div className={`toast toast--${message.kind}`} role="status" aria-live="polite">
      <Icon size={17} aria-hidden="true" />
      <span>{message.message}</span>
      <button
        aria-label="Dismiss notification"
        className="toast__close"
        onClick={onClose}
        type="button"
      >
        ×
      </button>
    </div>
  );
}
