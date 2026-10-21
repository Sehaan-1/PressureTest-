import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="page-heading">
      <div className="page-heading__copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <p className="page-heading__description">{description}</p> : null}
      </div>
      {actions ? <div className="page-heading__actions">{actions}</div> : null}
    </div>
  );
}
