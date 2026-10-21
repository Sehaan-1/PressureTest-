import { useDataset } from "../../app/DatasetContext";
import { PageHeader } from "../../components/PageHeader";
import { SvgBarChart, type SvgBarDatum } from "../../components/SvgBarChart";
import { selectAnalytics } from "../../domain/analytics";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

export function AnalysisPage() {
  const { dataset } = useDataset();
  const analytics = selectAnalytics(dataset.examples);
  const hasDemo = dataset.examples.some((example) => example.origin === "demo");
  const maxOutcome = Math.max(4, ...analytics.outcomes.map((outcome) => outcome.count));

  const modelRows: SvgBarDatum[] = analytics.modelCaveRates.map((metric) => ({
    key: metric.key,
    label: metric.label,
    value: metric.rate,
    numerator: metric.numerator,
    denominator: metric.denominator,
    unit: "percent",
  }));

  const pushbackRows: SvgBarDatum[] = analytics.pushbackCaveRates.map((metric) => ({
    key: metric.key,
    label: metric.label,
    value: metric.rate,
    numerator: metric.numerator,
    denominator: metric.denominator,
    unit: "percent",
  }));

  const outcomeRows: SvgBarDatum[] = analytics.outcomes.map((outcome) => ({
    key: outcome.key,
    label: outcome.label,
    value: outcome.count,
    numerator: outcome.count,
    denominator: analytics.completedCount,
    unit: "count",
  }));

  return (
    <div className="analysis-page">
      <PageHeader
        title="What changes after the challenge?"
        description="Descriptive summary of answer flips, pushback types, and tone flags. Cave rates condition on completed conversations whose first answer was correct."
      />

      {hasDemo ? (
        <div className="sample-notice" role="note">
          <span>
            <strong>Synthetic sample included:</strong> Replace starter rows before citing any rate
            as an empirical result.
          </span>
        </div>
      ) : null}

      {analytics.completedCount === 0 ? (
        <div className="empty-box">
          <span>
            Complete the three required labels on at least one conversation to compute descriptive
            rates.
          </span>
        </div>
      ) : null}

      <section className="kpi-band analysis-kpi-band" aria-label="Headline analysis metrics">
        <div className="kpi-cell">
          <span className="kpi-cell__label">Cave rate among initially correct answers</span>
          <strong className="kpi-cell__value">{formatRate(analytics.caveRate)}</strong>
          <span className="kpi-cell__detail">
            <span>{analytics.caveCount} incorrect flips</span> ·{" "}
            <span>{analytics.correctAnswerCount} initially correct cases</span>
          </span>
          <span className="kpi-cell__subnote">
            Across all complete cases: {analytics.caveCount} of {analytics.completedCount} (
            {formatRate(analytics.completedFlipShare)})
          </span>
        </div>

        <div className="kpi-cell">
          <span className="kpi-cell__label">
            Over-apologetic tone when the first answer was right
          </span>
          <strong className="kpi-cell__value">{formatRate(analytics.overApologeticRate)}</strong>
          <span className="kpi-cell__detail">
            {analytics.overApologeticCount} of {analytics.correctAnswerCount} complete, initially
            correct cases
          </span>
          <span className="kpi-cell__subnote">Human-coded flag, separate from answer accuracy</span>
        </div>

        <div className="kpi-cell">
          <span className="kpi-cell__label">Completed annotations</span>
          <strong className="kpi-cell__value">
            {analytics.completedCount}
            <small> / {analytics.totalCount}</small>
          </strong>
          <span className="kpi-cell__detail">
            {analytics.totalCount - analytics.completedCount} incomplete excluded from denominators
          </span>
          <span className="kpi-cell__subnote">Strict three-label completion rule</span>
        </div>
      </section>

      <section className="analysis-comparison-grid">
        <article className="panel analysis-panel">
          <div className="panel-heading">
            <div>
              <h2>Which model caves more?</h2>
              <p className="panel-subtitle">
                Caves divided by initially correct completed cases for each model
              </p>
            </div>
          </div>
          {modelRows.length > 0 ? (
            <SvgBarChart ariaLabel="Cave rate by model cohort" rows={modelRows} mode="percent" />
          ) : (
            <div className="empty-box">No completed model cohorts in this workspace yet.</div>
          )}
          <p className="panel-footnote">
            Read fractions next to percentages; small denominators shift sharply with a single row.
          </p>
        </article>

        <article className="panel analysis-panel">
          <div className="panel-heading">
            <div>
              <h2>What kind of pressure?</h2>
              <p className="panel-subtitle">
                Caves among initially correct completed cases within each pushback tactic
              </p>
            </div>
          </div>
          <SvgBarChart ariaLabel="Cave rate by pushback type" rows={pushbackRows} mode="percent" />
          <p className="panel-footnote">
            Descriptive association within labeled rows, not proof that a tactic caused a flip.
          </p>
        </article>
      </section>

      <section className="analysis-bottom-grid">
        <article className="panel outcomes-panel">
          <div className="panel-heading">
            <div>
              <h2>How did the model respond?</h2>
              <p className="panel-subtitle">
                Count of completed conversations across final behavior categories
              </p>
            </div>
          </div>
          <SvgBarChart
            ariaLabel="Final model behavior counts across completed cases"
            rows={outcomeRows}
            mode="count"
            maxCount={maxOutcome}
          />
          <p className="panel-footnote">
            {analytics.completedCount} completed conversations · incomplete cases excluded
          </p>
        </article>

        <article className="panel analysis-method-card">
          <h2>Patterns are prompts, not proof</h2>
          <p>
            This workbench summarizes human-coded counts on your local dataset. It does not estimate
            statistical significance, causal effects, inter-annotator reliability, or population
            rates.
          </p>
          <ul className="method-checklist">
            <li>Report exact numerator and denominator fractions beside every percentage.</li>
            <li>Compare models only when evaluated on matched prompts and pushback turns.</li>
            <li>Run independent dual annotation externally before publishing benchmark claims.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
