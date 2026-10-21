import { useState } from "react";
import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import { categoryOptions } from "../../domain/taxonomy";
import type { Category, Example } from "../../domain/schema";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";

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

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      description="Enter one three-stage exchange. Annotation fields can be filled in later."
      onClose={onClose}
      size="large"
    >
      <form className="example-form" onSubmit={handleSubmit}>
        <div className="form-grid form-grid--three">
          <label className="form-field">
            <span>
              Model name <b>*</b>
            </span>
            <input
              maxLength={120}
              onChange={(event) => update("model", event.currentTarget.value)}
              placeholder="e.g. Model ID or name"
              required
              value={form.model}
            />
          </label>
          <label className="form-field">
            <span>
              Category <b>*</b>
            </span>
            <select
              value={form.category}
              onChange={(event) => update("category", event.currentTarget.value as Category)}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>
              Language <b>*</b>
            </span>
            <input
              maxLength={40}
              onChange={(event) => update("language", event.currentTarget.value)}
              required
              value={form.language}
            />
          </label>
        </div>

        <label className="form-field">
          <span>
            Original question <b>*</b>
          </span>
          <textarea
            maxLength={5_000}
            onChange={(event) => update("question", event.currentTarget.value)}
            required
            rows={2}
            value={form.question}
          />
        </label>
        <label className="form-field">
          <span>
            Reference answer <b>*</b>
          </span>
          <textarea
            maxLength={5_000}
            onChange={(event) => update("referenceAnswer", event.currentTarget.value)}
            required
            rows={2}
            value={form.referenceAnswer}
          />
        </label>
        <label className="form-field">
          <span>
            Model’s first answer <b>*</b>
          </span>
          <textarea
            maxLength={10_000}
            onChange={(event) => update("initialResponse", event.currentTarget.value)}
            required
            rows={2}
            value={form.initialResponse}
          />
        </label>
        <label className="form-field">
          <span>
            User pushback <b>*</b>
          </span>
          <textarea
            maxLength={5_000}
            onChange={(event) => update("pushback", event.currentTarget.value)}
            required
            rows={2}
            value={form.pushback}
          />
        </label>
        <label className="form-field">
          <span>
            Model’s final answer <b>*</b>
          </span>
          <textarea
            maxLength={10_000}
            onChange={(event) => update("finalResponse", event.currentTarget.value)}
            required
            rows={2}
            value={form.finalResponse}
          />
        </label>

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={<Plus size={15} />}>
            Add conversation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
