import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  FileUp,
  MessageSquareText,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Button } from "../../components/Button";
import { RateBar } from "../../components/RateBar";
import { StatusBadge } from "../../components/StatusBadge";
import { useDataset } from "../../app/DatasetContext";
import { selectAnalytics } from "../../domain/analytics";
import { deriveAnnotationStatus } from "../../domain/dataset";
import { categoryLabel, pushbackLabel } from "../../domain/taxonomy";

interface DashboardPageProps {
  onAnnotate: () => void;
  onOpenExample: (exampleId: string) => void;
}

function formatPercent(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

export function DashboardPage({ onAnnotate, onOpenExample }: DashboardPageProps) {
  const { dataset } = useDataset();
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

  return (
    <div className="dashboard-page">
      <section className="overview-hero">
        <div className="overview-hero__copy">
          <p className="hero-kicker">
            <span className="hero-kicker__line" /> LLM BEHAVIOR EVALUATION
          </p>
          <h1 aria-label="Does it hold its ground when you push back?">
            Does it hold its ground
            <br />
            <em>when you push back?</em>
          </h1>
          <p className="overview-hero__description">
            Track when a model keeps a correct answer—or changes it just to agree with you.
          </p>
          <div className="overview-hero__actions">
            <Button icon={<ArrowRight size={16} />} onClick={onAnnotate}>
              Start annotating
            </Button>
            <span className="hero-microcopy">
              <Check size={14} aria-hidden="true" /> No model keys. No cloud uploads.
            </span>
          </div>
        </div>
        <div
          className="pressure-visual"
          aria-label="Illustration of an answer being tested under pressure"
          role="img"
        >
          <div className="pressure-visual__orbit pressure-visual__orbit--outer" />
          <div className="pressure-visual__orbit pressure-visual__orbit--inner" />
          <div className="pressure-visual__axis" />
          <div className="pressure-visual__center">
            <span className="pressure-visual__check">
              <Check size={22} strokeWidth={2.8} aria-hidden="true" />
            </span>
            <strong>THE ANSWER</strong>
            <small>initial answer</small>
          </div>
          <span className="pressure-visual__label pressure-visual__label--top">PUSHBACK</span>
          <span className="pressure-visual__label pressure-visual__label--bottom">
            DOES IT HOLD?
          </span>
          <span className="pressure-visual__spark pressure-visual__spark--one" />
          <span className="pressure-visual__spark pressure-visual__spark--two" />
        </div>
      </section>

      {containsDemo ? (
        <div className="sample-notice" role="note">
          <Sparkles size={16} aria-hidden="true" />
          <span>
            <strong>Illustrative sample.</strong> These starter conversations are synthetic—not
            research findings.
          </span>
          <button type="button" onClick={() => onOpenExample(dataset.examples[0]?.id ?? "")}>
            Review an example <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="stat-grid">
        <article className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__icon stat-card__icon--mint">
              <MessageSquareText size={17} aria-hidden="true" />
            </span>
            <span className="stat-card__eyebrow">CONVERSATIONS</span>
          </div>
          <strong className="stat-card__value">{analytics.totalCount.toLocaleString()}</strong>
          <span className="stat-card__detail">model responses in this workspace</span>
        </article>
        <article className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__icon stat-card__icon--blue">
              <Check size={17} aria-hidden="true" />
            </span>
            <span className="stat-card__eyebrow">ANNOTATED</span>
          </div>
          <strong className="stat-card__value">
            {analytics.completedCount}
            <small> / {analytics.totalCount}</small>
          </strong>
          <div
            className="stat-progress"
            role="progressbar"
            aria-label="Annotation progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completedPercent}
            aria-valuetext={`${completedPercent}% of examples annotated`}
          >
            <span style={{ width: `${completedPercent}%` }} />
          </div>
          <span className="stat-card__detail">{completedPercent}% complete</span>
        </article>
        <article className="stat-card stat-card--highlight">
          <div className="stat-card__top">
            <span className="stat-card__icon stat-card__icon--coral">
              <BarChart3 size={17} aria-hidden="true" />
            </span>
            <span className="stat-card__eyebrow">CAVE RATE</span>
          </div>
          <strong className="stat-card__value">{formatPercent(analytics.caveRate)}</strong>
          <span className="stat-card__detail">
            {analytics.caveCount} of {analytics.correctAnswerCount} initially correct examples
          </span>
        </article>
        <article className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__icon stat-card__icon--lavender">
              <UsersRound size={17} aria-hidden="true" />
            </span>
            <span className="stat-card__eyebrow">MODELS</span>
          </div>
          <strong className="stat-card__value">{models.size}</strong>
          <span className="stat-card__detail">unique model labels recorded</span>
        </article>
      </div>

      <div className="dashboard-lower-grid">
        <section className="panel signal-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">A FIRST LOOK</p>
              <h2>Which pushback moves the answer?</h2>
            </div>
            <span className="panel-heading__icon">
              <BarChart3 size={17} aria-hidden="true" />
            </span>
          </div>
          <p className="panel-subtitle">
            Cave rate by pushback type <span>· complete, initially correct cases only</span>
          </p>
          <div className="signal-bars">
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
          <div className="panel-footnote">
            <span className="footnote-dot" /> Descriptive only · sample sizes are small
          </div>
        </section>

        <section className="panel queue-preview">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NEXT UP</p>
              <h2>Your annotation queue</h2>
            </div>
            <span className="queue-count">{needsReview.length} left</span>
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
                      {categoryLabel(example.category)}{" "}
                      <span className="queue-preview__separator">·</span> {example.model}
                    </span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                  <strong>{example.question}</strong>
                  <span className="queue-preview__item-bottom">
                    <StatusBadge status={deriveAnnotationStatus(example.annotation)} compact />
                    <span className="queue-preview__pushback">
                      {pushbackLabel(example.annotation.pushbackType)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="queue-empty">
              <Check size={18} aria-hidden="true" />
              <strong>All caught up.</strong>
              <span>Every example is annotated.</span>
            </div>
          )}
          <button className="text-link queue-preview__all" onClick={onAnnotate} type="button">
            Open full queue <ChevronRight size={15} aria-hidden="true" />
          </button>
        </section>
      </div>

      <section className="workflow-strip">
        <div className="workflow-strip__intro">
          <span className="workflow-strip__icon">
            <Clock3 size={17} aria-hidden="true" />
          </span>
          <div>
            <strong>Small, careful, reproducible.</strong>
            <span>A workflow designed for annotation—not just charts.</span>
          </div>
        </div>
        <div className="workflow-steps">
          <span>
            <i>01</i>
            <FileUp size={15} aria-hidden="true" /> Import
          </span>
          <span>
            <i>02</i>
            <MessageSquareText size={15} aria-hidden="true" /> Annotate
          </span>
          <span>
            <i>03</i>
            <Check size={15} aria-hidden="true" /> Review
          </span>
          <span>
            <i>04</i>
            <BarChart3 size={15} aria-hidden="true" /> Analyze
          </span>
        </div>
        {!containsDemo && dataset.examples.length === 0 ? (
          <button className="text-link workflow-strip__add" onClick={onAnnotate} type="button">
            Get started
          </button>
        ) : null}
      </section>
    </div>
  );
}
