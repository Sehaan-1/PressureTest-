import type { AnnotationStatus } from "../domain/dataset";

const statusLabels: Record<AnnotationStatus, string> = {
  pending: "Needs review",
  in_progress: "In progress",
  complete: "Complete",
};

interface StatusBadgeProps {
  status: AnnotationStatus;
  compact?: boolean;
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  return (
    <span
      className={`status-badge status-badge--${status}${compact ? " status-badge--compact" : ""}`}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}
