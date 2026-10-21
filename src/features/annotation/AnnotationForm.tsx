import { AlertCircle, ArrowRight, Check, Save } from "lucide-react";
import { Button } from "../../components/Button";
import {
  behaviorOptions,
  correctnessOptions,
  pushbackOptions,
  toneFlagOptions,
} from "../../domain/taxonomy";
import type { Annotation, AnnotationPatch, ToneFlag } from "../../domain/schema";
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
  const toggleToneFlag = (flag: ToneFlag) => {
    const toneFlags = draft.toneFlags.includes(flag)
      ? draft.toneFlags.filter((existing) => existing !== flag)
      : [...draft.toneFlags, flag];
    onChange({ toneFlags });
  };

  return (
    <form
      className="annotation-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="annotation-form__heading">
        <div>
          <p className="eyebrow">YOUR LABELS</p>
          <h2>Code the response</h2>
        </div>
        <span className={`draft-indicator${isDirty ? " draft-indicator--dirty" : ""}`}>
          <span />
          {isDirty ? "Unsaved" : "Saved"}
        </span>
      </div>
      <p className="annotation-form__intro">
        Read the reference answer and full exchange before choosing.
      </p>

      <ChoiceGroup
        number="01"
        title="Initial correctness"
        name="initialCorrectness"
        options={correctnessOptions}
        value={draft.initialCorrectness}
        onChange={(initialCorrectness) => onChange({ initialCorrectness })}
      />
      <ChoiceGroup
        number="02"
        title="Pushback type"
        name="pushbackType"
        options={pushbackOptions}
        value={draft.pushbackType}
        onChange={(pushbackType) => onChange({ pushbackType })}
      />
      <ChoiceGroup
        number="03"
        title="Final behavior"
        name="finalBehavior"
        options={behaviorOptions}
        value={draft.finalBehavior}
        onChange={(finalBehavior) => onChange({ finalBehavior })}
      />

      <fieldset className="tone-fieldset">
        <legend>
          <span className="choice-group__number">04</span>Tone flags{" "}
          <small>Optional · select all that apply</small>
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

      <label className="note-field">
        <span>
          Annotator note <small>Optional</small>
        </span>
        <textarea
          maxLength={2_000}
          onChange={(event) => onChange({ note: event.currentTarget.value })}
          placeholder="Add context for an edge case or disagreement…"
          rows={3}
          value={draft.note}
        />
        <small className="note-field__count">{draft.note.length.toLocaleString()} / 2,000</small>
      </label>

      {errorMessage ? (
        <div className="annotation-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
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
      <p className="annotation-form__privacy">Changes are stored locally in this browser.</p>
    </form>
  );
}
