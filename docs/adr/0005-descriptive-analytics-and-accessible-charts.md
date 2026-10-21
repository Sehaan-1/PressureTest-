# ADR 0005: Descriptive, denominator-visible analytics

- **Status:** Accepted
- **Date:** 2026-10-18

## Context

The app should show model and pushback patterns without turning a small student dataset into a causal claim. The target scale is hundreds of records, the dependency budget is small, and charts must remain usable on narrow screens and without color perception.

## Considered options

- **Pure TypeScript selectors + CSS bars/tables:** no chart runtime, easy to test, clear labels and counts; limited to straightforward comparisons.
- **Recharts/Chart.js:** more chart types and tooltips; adds runtime and accessibility responsibility for a few bar comparisons.
- **External analytics/BI:** richer analysis; uploads private data and adds service/account dependencies.

## Decision

Compute rates with pure domain selectors over complete annotations. The primary cave rate is conditional on a complete, initially correct answer (the eligible population); also expose caves divided by all complete annotations as a separate joint flip share. Pushback/model comparisons use the same eligible denominator within each cohort. Present concise CSS bar comparisons and semantic tabular counts; include numerator, denominator, and cohort size. Show an explicit empty state for zero eligible observations. Label the included sample as synthetic and every comparison as descriptive, not causal. Add a charting library only if a concrete analytical requirement exceeds these components.

## Consequences and failure modes

- Metrics remain deterministic and easy to test against CSV/JSON records.
- Small or imbalanced cohorts can look persuasive; keep `n`, denominators, and a synthetic/demo caveat visible.
- No confidence interval or causal conclusion is implied. Future statistical analysis belongs in a notebook or a separately reviewed analysis feature.
- CSS bars and tables need sufficient text labels, contrast, and responsive behavior; color alone must never encode a result.
