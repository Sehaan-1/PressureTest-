interface BrandMarkProps {
  size?: number;
  title?: string;
}

export function BrandMark({ size = 22, title }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className="brand-emblem"
    >
      {title ? <title>{title}</title> : null}
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="21"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="square"
      />
      <path
        d="M4 9.5H8.5M8.5 9.5L6.5 7.5M8.5 9.5L6.5 11.5"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 14.5H15.5M15.5 14.5L17.5 12.5M15.5 14.5L17.5 16.5"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
