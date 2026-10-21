interface RateBarProps {
  label: string;
  numerator: number;
  denominator: number;
  rate: number | null;
  className?: string;
}

export function RateBar({ label, numerator, denominator, rate, className = "" }: RateBarProps) {
  const percent = rate === null ? 0 : Math.round(rate * 100);
  return (
    <div className={`rate-row ${className}`.trim()}>
      <div className="rate-row__top">
        <span className="rate-row__label">{label}</span>
        <span className="rate-row__value">
          <span className="rate-row__percent">{rate === null ? "—" : `${percent}%`}</span>
          <span className="rate-row__fraction">
            {denominator === 0 ? "No eligible cases" : `${numerator} / ${denominator}`}
          </span>
        </span>
      </div>
      <div
        className="rate-row__track"
        role="progressbar"
        aria-label={`${label} cave rate`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rate === null ? undefined : percent}
        aria-valuetext={
          rate === null
            ? `${label}: no eligible cases`
            : `${label}: ${percent}% (${numerator} of ${denominator} eligible cases)`
        }
      >
        <span className="rate-row__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
