import { AlertCircle, CheckCircle2, FileUp } from "lucide-react";
import type { ImportResult } from "../../domain/exchange";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";

interface ImportReviewDialogProps {
  filename: string;
  result: ImportResult;
  onClose: () => void;
  onImport: (mode: "append" | "replace") => void;
}

export function ImportReviewDialog({
  filename,
  result,
  onClose,
  onImport,
}: ImportReviewDialogProps) {
  return (
    <Modal
      title={result.success ? "Review import" : "Import needs attention"}
      description={filename}
      onClose={onClose}
      size="medium"
    >
      <div className="import-review">
        {result.success ? (
          <>
            <div className="import-success-summary">
              <CheckCircle2 size={18} aria-hidden="true" />
              <div>
                <strong>{result.examples.length.toLocaleString()} conversations validated</strong>
                <small>{result.format.toUpperCase()} file checked locally before saving</small>
              </div>
            </div>
            <p className="import-info-note">
              Append skips duplicate IDs already in this workspace. Replace overwrites the current
              dataset after confirmation. Ensure imported transcripts exclude personal identifiers
              and provider keys; saving stores them only in this browser.
            </p>
            {result.examples[0] ? (
              <div className="import-preview-row">
                <span>First row preview</span>
                <strong>{result.examples[0].question}</strong>
                <small>
                  {result.examples[0].model} · {result.examples[0].category}
                </small>
              </div>
            ) : null}
            <div className="modal-actions modal-actions--spread">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <div>
                <Button
                  variant="secondary"
                  icon={<FileUp size={15} />}
                  onClick={() => onImport("replace")}
                >
                  Replace dataset
                </Button>
                <Button icon={<FileUp size={15} />} onClick={() => onImport("append")}>
                  Append rows
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="import-error-summary" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <div>
                <strong>No changes were made.</strong>
                <small>Fix the validation issues below and try importing again.</small>
              </div>
            </div>
            <ul className="import-problem-list">
              {result.problems.slice(0, 12).map((problem) => (
                <li key={`${problem.location}-${problem.message}`}>
                  <strong>{problem.location}</strong>
                  <span>{problem.message}</span>
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <Button variant="secondary" onClick={onClose}>
                Close dialog
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
