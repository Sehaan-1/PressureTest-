import type { KeyboardEvent } from "react";
import { AlertCircle, ArrowRight, Check, Save } from "lucide-react";
import { Button } from "../../components/Button";
import {
  behaviorOptions,
  correctnessOptions,
  pushbackOptions,
  toneFlagOptions,
} from "../../domain/taxonomy";
import type { Annotation, AnnotationPatch, ToneFlag } from "../../domain/schema";
import { detectSensitiveInput } from "../../utils/sensitiveDataCheck";
import { ChoiceGroup } from "./ChoiceGroup";

interface AnnotationFormProps {
  draft: Annotation;
  isDirty: boolean;
  errorMessage: string | null;
  onChange: (patch: AnnotationPatch) => void;
  onSave: () => void;
  onSaveAndNext: () => void;
}

export function AnnotationForm({
  draft,
  isDirty,
  errorMessage,
  onChange,
  onSave,
  onSaveAndNext,
}: AnnotationFormProps) {
  const sensitiveWarnings = detectSensitiveInput({ "Annotator note": draft.note });

  const toggleToneFlag = (flag: ToneFlag) => {
    const toneFlags = draft.toneFlags.includes(flag)
      ? draft.toneFlags.filter((existing) => existing !== flag)
      : [...draft.toneFlags, flag];
    onChange({ toneFlags });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && isDirty) {
      event.preventDefault();
      onSave();
    }
  };

  return (
    <form
      className="annotation-form"
      onKeyDown={handleKeyDown}
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="annotation-form__heading">
        <h2>Code the response</h2>
        <span className={`draft-indicator${isDirty ? " draft-indicator--dirty" : ""}`}>
          {isDirty ? "Unsaved changes" : "Saved"}
        </span>
      </div>
      <p className="annotation-form__intro">
        Read the reference answer and all four turns before coding. Press{" "}
        <kbd className="kbd-hint">Ctrl+Enter</kbd> to save.
      </p>

      <ChoiceGroup
        title="Initial correctness"
        name="initialCorrectness"
        options={correctnessOptions}
        value={draft.initialCorrectness}
        onChange={(initialCorrectness) => onChange({ initialCorrectness })}
      />
      <ChoiceGroup
        title="Pushback type"
        name="pushbackType"
        options={pushbackOptions}
        value={draft.pushbackType}
        onChange={(pushbackType) => onChange({ pushbackType })}
      />
      <ChoiceGroup
        title="Final behavior"
        name="finalBehavior"
        options={behaviorOptions}
        value={draft.finalBehavior}
        onChange={(finalBehavior) => onChange({ finalBehavior })}
      />

      <fieldset className="tone-fieldset">
        <legend>
          Tone flags <small>(Optional)</small>
        </legend>
        <div className="tone-options">
          {toneFlagOptions.map((option) => (
            <label className="tone-option" key={option.value}>
              <input
                checked={draft.toneFlags.includes(option.value)}
                onChange={() => toggleToneFlag(option.value)}
                type="checkbox"
              />
              <span className="tone-option__check" aria-hidden="true">
                <Check size={12} />
              </span>
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="note-field">
        <label htmlFor="annotator-note-input">
          Annotator note <small>(Optional · avoid personal data)</small>
        </label>
        <textarea
          id="annotator-note-input"
          maxLength={2_000}
          onChange={(event) => onChange({ note: event.currentTarget.value })}
          placeholder="Document edge-case reasoning without personal identifiers"
          rows={3}
          value={draft.note}
        />
        <span className="note-field__count">{draft.note.length.toLocaleString()} / 2,000</span>
      </div>

      {sensitiveWarnings.length > 0 ? (
        <div className="annotation-warning" role="status">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{sensitiveWarnings[0]?.reason}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="annotation-error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="annotation-form__actions">
        <Button type="submit" icon={<Save size={15} />} disabled={!isDirty}>
          Save annotation
        </Button>
        <Button
          variant="secondary"
          icon={<ArrowRight size={15} />}
          onClick={onSaveAndNext}
          disabled={
            !isDirty &&
            draft.initialCorrectness === null &&
            draft.pushbackType === null &&
            draft.finalBehavior === null
          }
        >
          Save & next
        </Button>
      </div>
      <p className="annotation-form__privacy">
        Stored locally in this browser profile only. No network upload occurs.
      </p>
    </form>
  );
}
