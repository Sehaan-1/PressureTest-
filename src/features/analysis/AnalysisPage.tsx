import { Activity, AlertTriangle, BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { useDataset } from "../../app/DatasetContext";
import { PageHeader } from "../../components/PageHeader";
import { RateBar } from "../../components/RateBar";
import { selectAnalytics } from "../../domain/analytics";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

export function AnalysisPage() {
  const { dataset } = useDataset();
  const analytics = selectAnalytics(dataset.examples);
  const hasDemo = dataset.examples.some((example) => example.origin === "demo");
  const maxOutcome = Math.max(1, ...analytics.outcomes.map((outcome) => outcome.count));

  return (
    <div className="analysis-page">
      <PageHeader
        eyebrow="DESCRIPTIVE ANALYSIS"
        title="What changes after the challenge?"
        description="A small-sample view of answer flips, pushback types, and tone. Cave rates use complete cases whose first answer was correct."
      />

      {hasDemo ? (
        <div className="analysis-sample-warning" role="note">
          <Sparkles size={16} aria-hidden="true" />
          <span>
            <strong>Synthetic sample included.</strong> Replace the starter rows before treating any
            pattern as a research result.
          </span>
        </div>
      ) : null}

      {analytics.completedCount === 0 ? (
        <div className="analysis-empty-state">
          <span>
            <Activity size={22} aria-hidden="true" />
          </span>
          <h2>No completed annotations yet</h2>
          <p>
            Complete the three required labels on at least one conversation to unlock descriptive
            rates.
          </p>
        </div>
      ) : null}

      <section className="analysis-hero-grid">
        <article className="analysis-primary-card">
          <div className="analysis-primary-card__top">
            <span className="analysis-primary-card__icon">
              <AlertTriangle size={17} aria-hidden="true" />
            </span>
            <span className="analysis-primary-card__tag">CORE SIGNAL</span>
          </div>
          <p className="analysis-primary-card__label">Cave rate among initially correct answers</p>
          <strong className="analysis-primary-card__value">{formatRate(analytics.caveRate)}</strong>
          <div className="analysis-primary-card__denominator">
            <span>{analytics.caveCount} incorrect flips</span>
            <i />
            <span>{analytics.correctAnswerCount} initially correct cases</span>
          </div>
          <p className="analysis-primary-card__joint-share">
            Across all complete cases: {analytics.caveCount} of {analytics.completedCount} (
            {formatRate(analytics.completedFlipShare)})
          </p>
          <div className="analysis-primary-card__foot">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>
              Strict definition: correct first answer → wrong final answer, without new valid
              evidence.
            </span>
          </div>
        </article>
        <article className="analysis-tone-card">
          <div className="analysis-tone-card__top">
            <span className="analysis-tone-card__icon">
              <Activity size={17} aria-hidden="true" />
            </span>
            <span className="analysis-tone-card__tag">TONE CHECK</span>
          </div>
          <p>
            Over-apologetic tone
            <br />
            when the first answer was right
          </p>
          <strong>{formatRate(analytics.overApologeticRate)}</strong>
          <span className="analysis-tone-card__denominator">
            {analytics.overApologeticCount} of {analytics.correctAnswerCount} complete, initially
            correct examples
          </span>
          <div className="analysis-tone-card__note">
            Human-annotated flag · not automated sentiment analysis
          </div>
        </article>
      </section>

      <section className="analysis-comparison-grid">
        <article className="panel analysis-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">MODEL COMPARISON</p>
              <h2>Which model caves more?</h2>
            </div>
            <span className="panel-heading__icon">
              <BarChart3 size={17} aria-hidden="true" />
            </span>
          </div>
          <p className="panel-subtitle">
            Caves / initially correct completed examples for that model
          </p>
          <div className="analysis-rates">
            {analytics.modelCaveRates.length > 0 ? (
              analytics.modelCaveRates.map((metric) => (
                <RateBar
                  key={metric.key}
                  label={metric.label}
                  numerator={metric.numerator}
                  denominator={metric.denominator}
                  rate={metric.rate}
                />
              ))
            ) : (
              <p className="analysis-no-cohort">No completed model cohorts yet.</p>
            )}
          </div>
          <p className="analysis-panel__footnote">
            Always read the fraction next to the rate; a small denominator can swing sharply.
          </p>
        </article>

        <article className="panel analysis-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">PUSHBACK TYPE</p>
              <h2>What kind of pressure?</h2>
            </div>
            <span className="panel-heading__icon">
              <Activity size={17} aria-hidden="true" />
            </span>
          </div>
          <p className="panel-subtitle">
            Caves among initially correct examples within each pushback group
          </p>
          <div className="analysis-rates">
            {analytics.pushbackCaveRates.map((metric) => (
              <RateBar
                key={metric.key}
                label={metric.label}
                numerator={metric.numerator}
                denominator={metric.denominator}
                rate={metric.rate}
              />
            ))}
          </div>
          <p className="analysis-panel__footnote">
            Association only—not evidence that a pushback type caused a flip.
          </p>
        </article>
      </section>

      <section className="analysis-bottom-grid">
        <article className="panel outcomes-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">FINAL BEHAVIOR</p>
              <h2>How did the model respond?</h2>
            </div>
            <span className="panel-heading__icon">
              <BarChart3 size={17} aria-hidden="true" />
            </span>
          </div>
          <div className="outcome-list">
            {analytics.outcomes.map((outcome) => (
              <div className="outcome-row" key={outcome.key}>
                <div className="outcome-row__top">
                  <span>{outcome.label}</span>
                  <strong>{outcome.count}</strong>
                </div>
                <div
                  className="outcome-row__track"
                  role="progressbar"
                  aria-label={`${outcome.label} count`}
                  aria-valuemin={0}
                  aria-valuemax={maxOutcome}
                  aria-valuenow={outcome.count}
                  aria-valuetext={`${outcome.count} examples`}
                >
                  <span
                    className={`outcome-row__fill outcome-row__fill--${outcome.key}`}
                    style={{ width: `${(outcome.count / maxOutcome) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="analysis-panel__footnote">
            {analytics.completedCount} completed examples · incomplete cases excluded
          </p>
        </article>

        <article className="analysis-method-card">
          <span className="analysis-method-card__icon">
            <ShieldCheck size={19} aria-hidden="true" />
          </span>
          <p className="eyebrow">READ WITH CARE</p>
          <h2>Patterns are prompts—not proof.</h2>
          <p>
            This workspace reports descriptive counts. It does not estimate causal effects, model
            reliability, or population-level rates.
          </p>
          <div className="analysis-method-card__rule">
            <span>n</span>
            <p>Always show the denominator beside a percentage.</p>
          </div>
          <div className="analysis-method-card__rule">
            <span>↗</span>
            <p>Compare only cohorts with equivalent question sets and prompting.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
