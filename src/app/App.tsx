import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Download, RotateCcw, ShieldAlert } from "lucide-react";
import { AnalysisPage } from "../features/analysis/AnalysisPage";
import { AnnotationPage } from "../features/annotation/AnnotationPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { DatasetPage } from "../features/dataset/DatasetPage";
import { GuidelinesPage } from "../features/guidelines/GuidelinesPage";
import { LegalPage } from "../features/legal/LegalPage";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { StorageConsentBanner } from "../components/StorageConsentBanner";
import { DatasetProvider, useDataset } from "./DatasetContext";
import { bootstrapDataset, type BootstrapResult } from "./bootstrap";
import { formatRouteHash, parseRouteHash, type LegalTabId, type PageId } from "./pageTypes";
import { createDemoDataset } from "../data/demoDataset";
import { downloadText } from "../utils/download";
import {
  DATASET_STORAGE_KEY,
  LocalStorageDatasetRepository,
  type DatasetRepository,
} from "../storage/datasetRepository";
import {
  CONSENT_STORAGE_KEY,
  LocalStorageConsentRepository,
  measureStorageBytes,
  type ConsentLevel,
  type ConsentRecord,
} from "../storage/consentRepository";
import { deriveAnnotationStatus, replaceExamples } from "../domain/dataset";
import { serializeDatasetJson } from "../domain/exchange";

interface RuntimeState {
  repository: DatasetRepository | null;
  consentRepository: LocalStorageConsentRepository | null;
  bootstrap: BootstrapResult;
}

export interface ToastMessage {
  message: string;
  kind: "success" | "info" | "error";
}

function createRuntime(): RuntimeState {
  try {
    const repository = new LocalStorageDatasetRepository(window.localStorage);
    const consentRepository = new LocalStorageConsentRepository(window.localStorage);
    return { repository, consentRepository, bootstrap: bootstrapDataset(repository) };
  } catch {
    return {
      repository: null,
      consentRepository: null,
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
  const [route, setRoute] = useState(() => parseRouteHash(window.location.hash));
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);
  const [annotationDirty, setAnnotationDirty] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [consent, setConsent] = useState<ConsentRecord | null>(() =>
    runtime.consentRepository ? runtime.consentRepository.load() : null,
  );
  const [consentOpen, setConsentOpen] = useState(() =>
    runtime.consentRepository ? runtime.consentRepository.load() === null : false,
  );
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

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRouteHash(window.location.hash));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const updateConsent = (level: ConsentLevel) => {
    if (!runtime.consentRepository) return;
    try {
      const saved = runtime.consentRepository.save(level);
      setConsent(saved);
      setConsentOpen(false);
      showToast(
        level === "preferences_allowed"
          ? "Storage preferences saved (UI preferences allowed)."
          : "Storage preferences saved (strictly necessary storage only).",
        "info",
      );
    } catch {
      showToast("Browser storage could not save your preference.", "error");
    }
  };

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
        setRuntime({
          repository,
          consentRepository: runtime.consentRepository,
          bootstrap: { status: "ready", dataset: demo },
        });
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
          <h1>We could not open your local dataset</h1>
          <p className="recovery-card__description">
            {runtime.bootstrap.status === "recovery"
              ? runtime.bootstrap.message
              : "PressureTest could not access browser storage. Retry or check browser privacy settings."}
          </p>
          <p className="recovery-card__note">
            The existing stored value has not been overwritten. Download a raw backup before
            resetting if you need to recover saved annotations.
          </p>
          <div className="recovery-card__actions">
            <Button icon={<RotateCcw size={15} />} onClick={retry}>
              Retry opening workspace
            </Button>
            <Button variant="secondary" icon={<Download size={15} />} onClick={downloadRaw}>
              Download raw backup
            </Button>
          </div>
          {repository ? (
            <button className="recovery-reset" onClick={resetToDemo} type="button">
              Reset workspace to synthetic sample
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
        page={route.page}
        legalTab={route.legalTab}
        setRoute={(nextPage, nextTab = route.legalTab) => {
          const nextHash = formatRouteHash(nextPage, nextTab);
          if (window.location.hash !== nextHash) {
            window.history.replaceState(null, "", nextHash);
          }
          setRoute({ page: nextPage, legalTab: nextTab });
        }}
        selectedExampleId={selectedExampleId}
        setSelectedExampleId={setSelectedExampleId}
        annotationDirty={annotationDirty}
        setAnnotationDirty={setAnnotationDirty}
        consent={consent}
        consentOpen={consentOpen}
        onOpenConsentBanner={() => setConsentOpen(true)}
        onUpdateConsent={updateConsent}
        consentRepository={runtime.consentRepository}
        onConsentReset={() => {
          setConsent(null);
          setConsentOpen(true);
        }}
        showToast={showToast}
        toast={toast}
        dismissToast={() => setToast(null)}
      />
    </DatasetProvider>
  );
}

interface WorkspaceProps {
  page: PageId;
  legalTab: LegalTabId;
  setRoute: (page: PageId, legalTab?: LegalTabId) => void;
  selectedExampleId: string | null;
  setSelectedExampleId: (id: string | null) => void;
  annotationDirty: boolean;
  setAnnotationDirty: (dirty: boolean) => void;
  consent: ConsentRecord | null;
  consentOpen: boolean;
  onOpenConsentBanner: () => void;
  onUpdateConsent: (level: ConsentLevel) => void;
  consentRepository: LocalStorageConsentRepository | null;
  onConsentReset: () => void;
  showToast: (message: string, kind?: ToastMessage["kind"]) => void;
  toast: ToastMessage | null;
  dismissToast: () => void;
}

function Workspace({
  page,
  legalTab,
  setRoute,
  selectedExampleId,
  setSelectedExampleId,
  annotationDirty,
  setAnnotationDirty,
  consent,
  consentOpen,
  onOpenConsentBanner,
  onUpdateConsent,
  consentRepository,
  onConsentReset,
  showToast,
  toast,
  dismissToast,
}: WorkspaceProps) {
  const { dataset, commit } = useDataset();
  const isDemo = dataset.examples.some((example) => example.origin === "demo");
  const pendingCount = dataset.examples.filter(
    (example) => deriveAnnotationStatus(example.annotation) !== "complete",
  ).length;

  const confirmLeaveDirty = (nextPage: PageId): boolean => {
    if (
      page === "annotate" &&
      nextPage !== page &&
      annotationDirty &&
      !window.confirm("You have unsaved annotation labels. Leave this page and discard them?")
    ) {
      return false;
    }
    return true;
  };

  const navigate = (nextPage: PageId) => {
    if (!confirmLeaveDirty(nextPage)) return;
    setRoute(nextPage);
  };

  const openLegal = (tab: LegalTabId) => {
    if (!confirmLeaveDirty("legal")) return;
    setRoute("legal", tab);
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

  const clearAllBrowserData = () => {
    const confirmed = window.confirm(
      "Erase all local conversations, annotations, and consent preferences from this browser? Export a JSON backup first if you need to keep your data.",
    );
    if (!confirmed) return;
    try {
      consentRepository?.clear();
      commit(() => replaceExamples([]));
      onConsentReset();
      showToast("All browser storage data has been erased from this workspace.", "info");
    } catch {
      showToast("Could not erase browser data. Check browser storage permissions.", "error");
    }
  };

  let storageBytes = 0;
  try {
    storageBytes = measureStorageBytes(window.localStorage, [
      DATASET_STORAGE_KEY,
      CONSENT_STORAGE_KEY,
    ]);
  } catch {
    storageBytes = 0;
  }

  let content: ReactNode;
  switch (page) {
    case "overview":
      content = (
        <DashboardPage
          onAnnotate={() => openAnnotation()}
          onOpenDataset={() => navigate("dataset")}
          onOpenExample={openAnnotation}
        />
      );
      break;
    case "annotate":
      content = (
        <AnnotationPage
          selectedExampleId={selectedExampleId}
          onSelectExample={setSelectedExampleId}
          onOpenGuidelines={() => navigate("guidelines")}
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
    case "legal":
      content = (
        <LegalPage
          activeTab={legalTab}
          onChangeTab={(tab) => setRoute("legal", tab)}
          consent={consent}
          onUpdateConsent={onUpdateConsent}
          storageBytes={storageBytes}
          exampleCount={dataset.examples.length}
          onExportJson={exportBackup}
          onClearBrowserData={clearAllBrowserData}
        />
      );
      break;
  }

  return (
    <>
      <AppShell
        page={page}
        legalTab={legalTab}
        onNavigate={navigate}
        onOpenLegal={openLegal}
        onOpenConsentBanner={onOpenConsentBanner}
        isDemo={isDemo}
        pendingCount={pendingCount}
        onExport={exportBackup}
        banner={
          consentOpen && page !== "legal" ? (
            <StorageConsentBanner
              onSelect={onUpdateConsent}
              onOpenPolicy={() => openLegal("cookies")}
            />
          ) : null
        }
      >
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
      <Icon size={16} aria-hidden="true" />
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
