import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SvgBarChart, type SvgBarDatum } from "../../components/SvgBarChart";
import { useDataset } from "../../app/DatasetContext";
import { selectAnalytics } from "../../domain/analytics";
import { deriveAnnotationStatus } from "../../domain/dataset";
import { categoryLabel, categoryOptions, pushbackLabel } from "../../domain/taxonomy";

interface DashboardPageProps {
  onAnnotate: () => void;
  onOpenDataset: () => void;
  onOpenExample: (exampleId: string) => void;
}

type OverviewMetricKey = "cave_rate" | "conversations" | "annotated" | "models";

function formatPercent(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

export function DashboardPage({ onAnnotate, onOpenDataset, onOpenExample }: DashboardPageProps) {
  const { dataset } = useDataset();
  const [selectedMetric, setSelectedMetric] = useState<OverviewMetricKey>("cave_rate");
  const analytics = selectAnalytics(dataset.examples);
  const models = new Set(dataset.examples.map((example) => example.model));
  const needsReview = dataset.examples.filter(
    (example) => deriveAnnotationStatus(example.annotation) !== "complete",
  );
  const completedPercent =
    analytics.totalCount === 0
      ? 0
      : Math.round((analytics.completedCount / analytics.totalCount) * 100);
  const containsDemo = dataset.examples.some((example) => example.origin === "demo");

  const categoryCompletionRows: SvgBarDatum[] = categoryOptions.map((category) => {
    const inCategory = dataset.examples.filter((item) => item.category === category.value);
    const completeInCategory = inCategory.filter(
      (item) => deriveAnnotationStatus(item.annotation) === "complete",
    ).length;
    return {
      key: category.value,
      label: category.label,
      value: inCategory.length === 0 ? null : completeInCategory / inCategory.length,
      numerator: completeInCategory,
      denominator: inCategory.length,
      unit: "percent",
    };
  });

  const outcomeRows: SvgBarDatum[] = analytics.outcomes.map((outcome) => ({
    key: outcome.key,
    label: outcome.label,
    value: outcome.count,
    numerator: outcome.count,
    denominator: analytics.completedCount,
    unit: "count",
  }));

  const pushbackRows: SvgBarDatum[] = analytics.pushbackCaveRates.map((metric) => ({
    key: metric.key,
    label: metric.label,
    value: metric.rate,
    numerator: metric.numerator,
    denominator: metric.denominator,
    unit: "percent",
  }));

  const modelRows: SvgBarDatum[] = analytics.modelCaveRates.map((metric) => ({
    key: metric.key,
    label: metric.label,
    value: metric.rate,
    numerator: metric.numerator,
    denominator: metric.denominator,
    unit: "percent",
  }));

  const chartConfig = {
    cave_rate: {
      title: "Which pushback moves the answer?",
      subtitle: "Cave rate by pushback type across complete, initially correct cases",
      ariaLabel: "Horizontal bar chart of cave rate by pushback type",
      rows: pushbackRows,
      mode: "percent" as const,
      maxCount: 4,
    },
    conversations: {
      title: "How completed conversations ended",
      subtitle: "Final model behavior counts across labeled conversations",
      ariaLabel: "Horizontal bar chart of final behavior counts across completed conversations",
      rows: outcomeRows,
      mode: "count" as const,
      maxCount: Math.max(4, ...outcomeRows.map((row) => row.numerator)),
    },
    annotated: {
      title: "Annotation coverage by question category",
      subtitle: "Share of conversations with all three required labels saved",
      ariaLabel: "Horizontal bar chart of annotation completion share by question category",
      rows: categoryCompletionRows,
      mode: "percent" as const,
      maxCount: 4,
    },
    models: {
      title: "Cave rate by recorded model",
      subtitle: "Incorrect flips among initially correct completed cases per model",
      ariaLabel: "Horizontal bar chart of cave rate by model cohort",
      rows: modelRows,
      mode: "percent" as const,
      maxCount: 4,
    },
  }[selectedMetric];

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Does it hold its ground when you push back?"
        description="Track whether a language model maintains a correct first answer when challenged, using local-only human annotations."
        actions={
          <>
            <Button variant="secondary" onClick={onOpenDataset}>
              Import or export
            </Button>
            <Button icon={<ArrowRight size={15} />} onClick={onAnnotate}>
              Start annotating
            </Button>
          </>
        }
      />

      {containsDemo ? (
        <div className="sample-notice" role="note">
          <span>
            <strong>Illustrative sample:</strong> These starter conversations are synthetic, not
            empirical research findings.
          </span>
          <button
            className="inline-policy-link"
            type="button"
            onClick={() => onOpenExample(dataset.examples[0]?.id ?? "")}
          >
            Review sample conversation
          </button>
        </div>
      ) : null}

      <div className="usage-tray">
        <div
          className="kpi-band"
          role="tablist"
          aria-label="Workspace metrics (select a metric to switch the chart below)"
        >
          <button
            role="tab"
            aria-selected={selectedMetric === "cave_rate"}
            aria-controls="overview-chart-panel"
            id="kpi-tab-cave"
            className={`kpi-cell${selectedMetric === "cave_rate" ? " kpi-cell--active" : ""}`}
            onClick={() => setSelectedMetric("cave_rate")}
            type="button"
          >
            <span className="kpi-cell__label">Cave rate</span>
            <strong className="kpi-cell__value">{formatPercent(analytics.caveRate)}</strong>
            <span className="kpi-cell__detail">
              {analytics.caveCount} of {analytics.correctAnswerCount} initially correct
            </span>
          </button>

          <button
            role="tab"
            aria-selected={selectedMetric === "conversations"}
            aria-controls="overview-chart-panel"
            id="kpi-tab-conversations"
            className={`kpi-cell${selectedMetric === "conversations" ? " kpi-cell--active" : ""}`}
            onClick={() => setSelectedMetric("conversations")}
            type="button"
          >
            <span className="kpi-cell__label">Conversations</span>
            <strong className="kpi-cell__value">{analytics.totalCount.toLocaleString()}</strong>
            <span className="kpi-cell__detail">
              {analytics.completedCount} complete · {needsReview.length} pending
            </span>
          </button>

          <button
            role="tab"
            aria-selected={selectedMetric === "annotated"}
            aria-controls="overview-chart-panel"
            id="kpi-tab-annotated"
            className={`kpi-cell${selectedMetric === "annotated" ? " kpi-cell--active" : ""}`}
            onClick={() => setSelectedMetric("annotated")}
            type="button"
          >
            <span className="kpi-cell__label">Annotated</span>
            <strong className="kpi-cell__value">
              {analytics.completedCount}
              <small> / {analytics.totalCount}</small>
            </strong>
            <span className="kpi-cell__detail">{completedPercent}% labeled in workspace</span>
          </button>

          <button
            role="tab"
            aria-selected={selectedMetric === "models"}
            aria-controls="overview-chart-panel"
            id="kpi-tab-models"
            className={`kpi-cell${selectedMetric === "models" ? " kpi-cell--active" : ""}`}
            onClick={() => setSelectedMetric("models")}
            type="button"
          >
            <span className="kpi-cell__label">Models recorded</span>
            <strong className="kpi-cell__value">{models.size}</strong>
            <span className="kpi-cell__detail">unique model identifiers</span>
          </button>
        </div>

        <div className="dashboard-lower-grid">
          <section
            id="overview-chart-panel"
            role="tabpanel"
            aria-labelledby={`kpi-tab-${selectedMetric === "cave_rate" ? "cave" : selectedMetric}`}
            className="panel signal-panel"
          >
            <div className="panel-heading">
              <div>
                <h2>{chartConfig.title}</h2>
                <p className="panel-subtitle">{chartConfig.subtitle}</p>
              </div>
              <span className="meta-stamp">n = {analytics.completedCount} complete</span>
            </div>

            {chartConfig.rows.length > 0 ? (
              <SvgBarChart
                ariaLabel={chartConfig.ariaLabel}
                rows={chartConfig.rows}
                mode={chartConfig.mode}
                maxCount={chartConfig.maxCount}
              />
            ) : (
              <div className="empty-box">No completed cohorts in this view yet.</div>
            )}

            <p className="panel-footnote">
              Descriptive workspace counts only. Read fractions alongside rates when denominators
              are small.
            </p>
          </section>

          <section className="panel queue-preview">
            <div className="panel-heading">
              <div>
                <h2>Annotation queue</h2>
                <p className="panel-subtitle">Next conversations waiting for human coding</p>
              </div>
              <span className="status-pill-neutral">{needsReview.length} left</span>
            </div>

            {needsReview.length > 0 ? (
              <div className="queue-preview__list">
                {needsReview.slice(0, 3).map((example) => (
                  <button
                    className="queue-preview__item"
                    key={example.id}
                    onClick={() => onOpenExample(example.id)}
                    type="button"
                  >
                    <span className="queue-preview__item-top">
                      <span>
                        <code className="mono-id">{example.id}</code> ·{" "}
                        {categoryLabel(example.category)} · {example.model}
                      </span>
                      <StatusBadge status={deriveAnnotationStatus(example.annotation)} compact />
                    </span>
                    <strong>{example.question}</strong>
                    <span className="queue-preview__pushback">
                      Pushback: {pushbackLabel(example.annotation.pushbackType)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-box">
                <Check size={16} aria-hidden="true" />
                <span>Every conversation in this workspace is annotated.</span>
              </div>
            )}

            <div className="queue-preview__footer">
              <button className="inline-policy-link" onClick={onAnnotate} type="button">
                Open full annotation queue
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
