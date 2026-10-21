import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { ZodError } from "zod";
import { useDataset } from "../../app/DatasetContext";
import type { ToastMessage } from "../../app/App";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { deriveAnnotationStatus, saveAnnotation } from "../../domain/dataset";
import { categoryLabel, pushbackLabel } from "../../domain/taxonomy";
import type { Annotation, AnnotationPatch, Example } from "../../domain/schema";
import { ConversationCard } from "./ConversationCard";
import { AnnotationForm } from "./AnnotationForm";

interface AnnotationPageProps {
  selectedExampleId: string | null;
  onSelectExample: (id: string | null) => void;
  onOpenGuidelines: () => void;
  onDirtyChange: (dirty: boolean) => void;
  showToast: (message: string, kind?: ToastMessage["kind"]) => void;
}

function nextIncompleteExample(examples: Example[], currentId: string): Example | null {
  const currentIndex = examples.findIndex((example) => example.id === currentId);
  if (examples.length < 2) return null;
  for (let offset = 1; offset < examples.length; offset += 1) {
    const candidate = examples[(currentIndex + offset + examples.length) % examples.length];
    if (candidate && deriveAnnotationStatus(candidate.annotation) !== "complete") return candidate;
  }
  return null;
}

function annotationErrorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the selected labels.";
  if (error instanceof Error && error.name === "DatasetStorageError") {
    return "The change could not be saved to browser storage. Your current labels are still in the form.";
  }
  return error instanceof Error ? error.message : "The annotation could not be saved.";
}

export function AnnotationPage({
  selectedExampleId,
  onSelectExample,
  onOpenGuidelines,
  onDirtyChange,
  showToast,
}: AnnotationPageProps) {
  const { dataset, commit } = useDataset();
  const [filter, setFilter] = useState<"needs_review" | "all">("needs_review");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Annotation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedExample =
    dataset.examples.find((example) => example.id === selectedExampleId) ?? null;
  const reviewCount = dataset.examples.filter(
    (example) => deriveAnnotationStatus(example.annotation) !== "complete",
  ).length;
  const firstAvailable =
    dataset.examples.find((example) => deriveAnnotationStatus(example.annotation) !== "complete")
      ?.id ??
    dataset.examples[0]?.id ??
    null;

  useEffect(() => {
    if (
      !selectedExampleId ||
      !dataset.examples.some((example) => example.id === selectedExampleId)
    ) {
      onSelectExample(firstAvailable);
    }
  }, [dataset.examples, firstAvailable, onSelectExample, selectedExampleId]);

  useEffect(() => {
    setDraft(selectedExample?.annotation ?? null);
    setErrorMessage(null);
  }, [selectedExample?.annotation]);

  const visibleExamples = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return dataset.examples.filter((example) => {
      const status = deriveAnnotationStatus(example.annotation);
      if (filter === "needs_review" && status === "complete") return false;
      if (!normalizedQuery) return true;
      return [example.question, example.model, example.pushback, example.id].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [dataset.examples, filter, query]);

  const isDirty = Boolean(
    selectedExample &&
      draft &&
      JSON.stringify(draft) !== JSON.stringify(selectedExample.annotation),
  );

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  function selectQueueExample(exampleId: string) {
    if (
      exampleId !== selectedExampleId &&
      isDirty &&
      !window.confirm("You have unsaved labels. Switch examples and discard them?")
    ) {
      return;
    }
    onSelectExample(exampleId);
  }

  function updateDraft(patch: AnnotationPatch) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setErrorMessage(null);
  }

  function saveDraft(andNext = false): boolean {
    if (!selectedExample || !draft) return false;
    try {
      const changed = commit((current) =>
        saveAnnotation(
          current,
          selectedExample.id,
          {
            initialCorrectness: draft.initialCorrectness,
            pushbackType: draft.pushbackType,
            finalBehavior: draft.finalBehavior,
            toneFlags: draft.toneFlags,
            note: draft.note,
          },
          new Date().toISOString(),
        ),
      );
      setErrorMessage(null);
      if (changed) showToast("Annotation saved to this browser.");

      if (andNext) {
        const next = nextIncompleteExample(dataset.examples, selectedExample.id);
        if (next) {
          onSelectExample(next.id);
          setFilter("needs_review");
        } else {
          showToast("No other examples need review.", "info");
        }
      }
      return true;
    } catch (error) {
      setErrorMessage(annotationErrorMessage(error));
      return false;
    }
  }

  return (
    <div className="annotation-page">
      <PageHeader
        title="Read the exchange. Make the call."
        description="Compare the model response against the reference answer, classify user pushback, and record final behavior."
        actions={
          <span className="status-pill-neutral">
            <strong>{dataset.examples.length - reviewCount}</strong> of {dataset.examples.length}{" "}
            reviewed
          </span>
        }
      />

      <div className="annotation-layout">
        <aside className="panel annotation-queue-panel" aria-label="Conversation queue">
          <div className="annotation-queue-panel__heading">
            <h2>Queue</h2>
            <span className="meta-stamp">{visibleExamples.length} shown</span>
          </div>

          <label className="search-field" htmlFor="queue-search-input">
            <Search size={15} aria-hidden="true" />
            <input
              id="queue-search-input"
              aria-label="Search conversations"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search questions or IDs"
              type="search"
              value={query}
            />
          </label>

          <fieldset className="segmented-tabs">
            <legend className="visually-hidden">Filter queue</legend>
            <button
              aria-pressed={filter === "needs_review"}
              className={filter === "needs_review" ? "segmented-tabs__active" : ""}
              onClick={() => setFilter("needs_review")}
              type="button"
            >
              Needs review <span>{reviewCount}</span>
            </button>
            <button
              aria-pressed={filter === "all"}
              className={filter === "all" ? "segmented-tabs__active" : ""}
              onClick={() => setFilter("all")}
              type="button"
            >
              All <span>{dataset.examples.length}</span>
            </button>
          </fieldset>

          <div className="annotation-queue-list">
            {visibleExamples.length > 0 ? (
              visibleExamples.map((example) => {
                const status = deriveAnnotationStatus(example.annotation);
                return (
                  <button
                    aria-current={selectedExample?.id === example.id ? "true" : undefined}
                    className={`annotation-queue-item${selectedExample?.id === example.id ? " annotation-queue-item--selected" : ""}`}
                    key={example.id}
                    onClick={() => selectQueueExample(example.id)}
                    type="button"
                  >
                    <span className="annotation-queue-item__top">
                      <code className="mono-id">{example.id}</code>
                      <StatusBadge status={status} compact />
                    </span>
                    <strong>{example.question}</strong>
                    <span className="annotation-queue-item__meta">
                      {categoryLabel(example.category)} · {example.model}
                    </span>
                    <span className="annotation-queue-item__pushback">
                      {pushbackLabel(example.annotation.pushbackType)}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="empty-box">No conversations match this filter.</div>
            )}
          </div>
        </aside>

        <section className="annotation-case-area">
          {selectedExample && draft ? (
            <>
              <div className="selected-case-status">
                <div>
                  <span className="selected-case-status__label">Active conversation:</span>
                  <code className="mono-id">{selectedExample.id}</code>
                </div>
                <StatusBadge status={deriveAnnotationStatus(draft)} />
              </div>
              <ConversationCard
                example={selectedExample}
                position={
                  dataset.examples.findIndex((example) => example.id === selectedExample.id) + 1
                }
                total={dataset.examples.length}
              />
            </>
          ) : (
            <div className="empty-box">
              <Check size={18} aria-hidden="true" />
              <span>Import a CSV or add a conversation on the Dataset screen to begin.</span>
            </div>
          )}
        </section>

        <aside className="panel annotation-controls-panel" aria-label="Annotation labels">
          {selectedExample && draft ? (
            <AnnotationForm
              draft={draft}
              isDirty={isDirty}
              errorMessage={errorMessage}
              onChange={updateDraft}
              onSave={() => saveDraft(false)}
              onSaveAndNext={() => saveDraft(true)}
            />
          ) : (
            <div className="empty-box">
              <span>Annotation controls appear here when a conversation is selected.</span>
            </div>
          )}
        </aside>
      </div>

      {selectedExample ? (
        <div className="annotation-bottom-note">
          <p>
            <strong>Scoring rule:</strong> Mark <em>Caved incorrectly</em> only when a correct first
            answer becomes wrong after pushback without new valid evidence.
          </p>
          <button className="inline-policy-link" onClick={onOpenGuidelines} type="button">
            Open annotation guidelines
          </button>
        </div>
      ) : null}
    </div>
  );
}
