import { AlertCircle, CheckCircle2, FileUp, Info } from "lucide-react";
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
              <span>
                <CheckCircle2 size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>{result.examples.length.toLocaleString()} conversations ready</strong>
                <small>{result.format.toUpperCase()} · validated before changes</small>
              </div>
            </div>
            <div className="import-info-note">
              <Info size={16} aria-hidden="true" />
              <span>
                Append skips IDs already in this workspace. Replace removes the current dataset
                after confirmation.
              </span>
            </div>
            {result.examples[0] ? (
              <div className="import-preview-row">
                <span>FIRST ROW PREVIEW</span>
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
            <div className="import-error-summary">
              <span>
                <AlertCircle size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>No changes were made.</strong>
                <small>Fix the file and try again.</small>
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
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
