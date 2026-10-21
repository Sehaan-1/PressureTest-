import { useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, Check, Plus } from "lucide-react";
import { categoryOptions } from "../../domain/taxonomy";
import type { Category, Example } from "../../domain/schema";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { detectSensitiveInput } from "../../utils/sensitiveDataCheck";

interface ExampleFormDialogProps {
  onClose: () => void;
  onCreate: (example: Example) => boolean;
}

interface FormState {
  category: Category;
  language: string;
  model: string;
  question: string;
  referenceAnswer: string;
  initialResponse: string;
  pushback: string;
  finalResponse: string;
}

const initialForm: FormState = {
  category: "factual",
  language: "English",
  model: "",
  question: "",
  referenceAnswer: "",
  initialResponse: "",
  pushback: "",
  finalResponse: "",
};

function newExampleId(): string {
  const token =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `PT-${token}`;
}

export function ExampleFormDialog({ onClose, onCreate }: ExampleFormDialogProps) {
  const [form, setForm] = useState(initialForm);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sensitiveWarnings = detectSensitiveInput({
    "Model name": form.model,
    "Original question": form.question,
    "Reference answer": form.referenceAnswer,
    "First answer": form.initialResponse,
    "User pushback": form.pushback,
    "Final answer": form.finalResponse,
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSubmitError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consentConfirmed) {
      setSubmitError(
        "Please confirm data minimization and local browser storage consent before saving.",
      );
      return;
    }

    const example: Example = {
      id: newExampleId(),
      origin: "manual",
      ...form,
      annotation: {
        initialCorrectness: null,
        pushbackType: null,
        finalBehavior: null,
        toneFlags: [],
        note: "",
        updatedAt: null,
      },
    };
    if (onCreate(example)) onClose();
  }

  return (
    <Modal
      title="Add a conversation"
      description="Enter only the necessary prompt, responses, and reference answer. Never paste personal identifiers or API keys."
      onClose={onClose}
      size="large"
    >
      <form className="example-form" onSubmit={handleSubmit}>
        <div className="form-grid form-grid--three">
          <div className="form-field">
            <label htmlFor="field-model-name">
              Model name <b>*</b>
            </label>
            <input
              id="field-model-name"
              maxLength={120}
              onChange={(event) => update("model", event.currentTarget.value)}
              placeholder="Model identifier"
              required
              value={form.model}
            />
          </div>
          <div className="form-field">
            <label htmlFor="field-category">
              Category <b>*</b>
            </label>
            <select
              id="field-category"
              value={form.category}
              onChange={(event) => update("category", event.currentTarget.value as Category)}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="field-language">
              Language <b>*</b>
            </label>
            <input
              id="field-language"
              maxLength={40}
              onChange={(event) => update("language", event.currentTarget.value)}
              required
              value={form.language}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="field-question">
            Original question <b>*</b>
          </label>
          <textarea
            id="field-question"
            maxLength={5_000}
            onChange={(event) => update("question", event.currentTarget.value)}
            required
            rows={2}
            value={form.question}
          />
        </div>

        <div className="form-field">
          <label htmlFor="field-reference">
            Reference answer <b>*</b>
          </label>
          <textarea
            id="field-reference"
            maxLength={5_000}
            onChange={(event) => update("referenceAnswer", event.currentTarget.value)}
            required
            rows={2}
            value={form.referenceAnswer}
          />
        </div>

        <div className="form-field">
          <label htmlFor="field-initial">
            Model first answer <b>*</b>
          </label>
          <textarea
            id="field-initial"
            maxLength={10_000}
            onChange={(event) => update("initialResponse", event.currentTarget.value)}
            required
            rows={2}
            value={form.initialResponse}
          />
        </div>

        <div className="form-field">
          <label htmlFor="field-pushback">
            User pushback <b>*</b>
          </label>
          <textarea
            id="field-pushback"
            maxLength={5_000}
            onChange={(event) => update("pushback", event.currentTarget.value)}
            required
            rows={2}
            value={form.pushback}
          />
        </div>

        <div className="form-field">
          <label htmlFor="field-final">
            Model final answer <b>*</b>
          </label>
          <textarea
            id="field-final"
            maxLength={10_000}
            onChange={(event) => update("finalResponse", event.currentTarget.value)}
            required
            rows={2}
            value={form.finalResponse}
          />
        </div>

        <label className="consent-checkbox" htmlFor="field-form-consent">
          <input
            id="field-form-consent"
            checked={consentConfirmed}
            onChange={(event) => {
              setConsentConfirmed(event.currentTarget.checked);
              setSubmitError(null);
            }}
            type="checkbox"
          />
          <span className="tone-option__check" aria-hidden="true">
            <Check size={12} />
          </span>
          <span>
            I confirm this transcript excludes personal data and API keys, and I consent to storing
            it locally in this browser under the Privacy & Storage Policy.
          </span>
        </label>

        {sensitiveWarnings.length > 0 ? (
          <div className="annotation-warning" role="status">
            <AlertCircle size={15} aria-hidden="true" />
            <span>
              {sensitiveWarnings[0]?.field}: {sensitiveWarnings[0]?.reason}
            </span>
          </div>
        ) : null}

        {submitError ? (
          <div className="annotation-error" role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        ) : null}

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={<Plus size={15} />}>
            Save conversation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
