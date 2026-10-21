import { ArrowUpRight, Trash2 } from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import { deriveAnnotationStatus } from "../../domain/dataset";
import { behaviorLabel, categoryLabel, pushbackLabel } from "../../domain/taxonomy";
import type { Example } from "../../domain/schema";

interface DatasetTableProps {
  examples: Example[];
  onOpenExample: (exampleId: string) => void;
  onDelete: (exampleId: string) => void;
}

export function DatasetTable({ examples, onOpenExample, onDelete }: DatasetTableProps) {
  return (
    <div className="dataset-table-wrap">
      <table className="dataset-table">
        <thead>
          <tr>
            <th scope="col">Conversation</th>
            <th scope="col">Model / type</th>
            <th scope="col">Pushback</th>
            <th scope="col">Final behavior</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {examples.map((example) => {
            const status = deriveAnnotationStatus(example.annotation);
            return (
              <tr key={example.id}>
                <td className="dataset-table__conversation">
                  <button
                    className="dataset-table__question"
                    onClick={() => onOpenExample(example.id)}
                    type="button"
                  >
                    {example.question}
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </button>
                  <span className="dataset-table__id">
                    {example.id} <i>·</i> {example.language}
                  </span>
                </td>
                <td>
                  <strong className="dataset-table__model">{example.model}</strong>
                  <span className="dataset-table__subtext">{categoryLabel(example.category)}</span>
                </td>
                <td>
                  <span className="dataset-table__label">
                    {pushbackLabel(example.annotation.pushbackType)}
                  </span>
                </td>
                <td>
                  <span
                    className={`behavior-label${example.annotation.finalBehavior === "caved_incorrectly" ? " behavior-label--cave" : ""}`}
                  >
                    {behaviorLabel(example.annotation.finalBehavior)}
                  </span>
                </td>
                <td>
                  <StatusBadge status={status} compact />
                </td>
                <td className="dataset-table__actions">
                  <button
                    className="table-icon-button"
                    onClick={() => onOpenExample(example.id)}
                    type="button"
                    aria-label={`Annotate ${example.id}`}
                    title="Open annotation"
                  >
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </button>
                  <button
                    className="table-icon-button table-icon-button--danger"
                    onClick={() => onDelete(example.id)}
                    type="button"
                    aria-label={`Delete ${example.id}`}
                    title="Delete example"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {examples.length === 0 ? (
        <div className="dataset-table-empty">
          <strong>No conversations match this view.</strong>
          <span>Change your search or import a dataset to get started.</span>
        </div>
      ) : null}
    </div>
  );
}
