export interface SvgBarDatum {
  key: string;
  label: string;
  value: number | null;
  numerator: number;
  denominator: number;
  unit?: "percent" | "count";
}

interface SvgBarChartProps {
  ariaLabel: string;
  rows: SvgBarDatum[];
  mode?: "percent" | "count";
  maxCount?: number;
}

export function SvgBarChart({ ariaLabel, rows, mode = "percent", maxCount = 4 }: SvgBarChartProps) {
  const width = 560;
  const labelWidth = 156;
  const statsWidth = 114;
  const plotLeft = labelWidth;
  const plotRight = width - statsWidth;
  const plotWidth = plotRight - plotLeft;
  const rowPitch = 38;
  const topPad = 14;
  const bottomAxisHeight = 28;
  const plotBottom = topPad + rows.length * rowPitch;
  const height = plotBottom + bottomAxisHeight;

  const upperCount = Math.max(4, Math.ceil(maxCount / 2) * 2);
  const ticks =
    mode === "percent"
      ? [0, 0.25, 0.5, 0.75, 1]
      : [0, upperCount * 0.25, upperCount * 0.5, upperCount * 0.75, upperCount];

  const summary = rows
    .map((row) => {
      if (row.value === null) return `${row.label}: no eligible cases`;
      if (mode === "percent") {
        return `${row.label}: ${Math.round(row.value * 100)}% (${row.numerator} of ${row.denominator})`;
      }
      return `${row.label}: ${row.numerator}`;
    })
    .join("; ");

  return (
    <div className="svg-chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="svg-chart"
        role="img"
        aria-label={`${ariaLabel}. ${summary}`}
      >
        <title>{ariaLabel}</title>
        {ticks.map((tick) => {
          const ratio = mode === "percent" ? tick : tick / upperCount;
          const x = plotLeft + ratio * plotWidth;
          const tickText =
            mode === "percent" ? `${Math.round(tick * 100)}%` : String(Math.round(tick));
          return (
            <g key={tick}>
              <line
                x1={x}
                x2={x}
                y1={topPad - 4}
                y2={plotBottom}
                stroke="var(--grid)"
                strokeWidth="1"
                shapeRendering="crispEdges"
              />
              <text
                x={ratio === 0 ? x : ratio === 1 ? x : x}
                y={plotBottom + 18}
                textAnchor={ratio === 0 ? "start" : ratio === 1 ? "end" : "middle"}
                className="svg-chart__tick"
              >
                {tickText}
              </text>
            </g>
          );
        })}

        {rows.map((row, index) => {
          const centerY = topPad + index * rowPitch + rowPitch / 2;
          const barHeight = 14;
          const barY = centerY - barHeight / 2;
          const ratio =
            row.value === null ? 0 : mode === "percent" ? row.value : row.value / upperCount;
          const barWidth = Math.max(0, Math.min(plotWidth, ratio * plotWidth));
          const displayPrimary =
            row.value === null
              ? "—"
              : mode === "percent"
                ? `${Math.round(row.value * 100)}%`
                : String(row.numerator);
          const displaySecondary =
            row.denominator === 0 && mode === "percent"
              ? "0 eligible"
              : `${row.numerator} / ${row.denominator}`;

          return (
            <g key={row.key}>
              <text x={0} y={centerY + 4} className="svg-chart__label">
                {row.label}
              </text>
              <rect
                x={plotLeft}
                y={barY}
                width={plotWidth}
                height={barHeight}
                fill="var(--raised)"
              />
              {barWidth > 0 ? (
                <rect
                  x={plotLeft}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill="var(--chart-1)"
                />
              ) : null}
              <text x={width - 54} y={centerY + 4} textAnchor="end" className="svg-chart__value">
                {displayPrimary}
              </text>
              <text x={width} y={centerY + 4} textAnchor="end" className="svg-chart__fraction">
                {displaySecondary}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
