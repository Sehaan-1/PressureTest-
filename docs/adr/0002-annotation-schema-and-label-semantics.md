# ADR 0002: Flat conversation records and explicit annotation taxonomy

- **Status:** Accepted
- **Date:** 2026-10-18

## Context

The core deliverable is a reviewable dataset, not a generalized conversation platform. A row must preserve the question, reference answer, two model responses, pushback, provenance, and the four label groups the project proposes. Researchers need predictable CSV round-trips and an audit-friendly definition of what is considered complete.

## Considered options

- **Flat record per dialogue:** simple annotation/export unit, easy to filter and compare; some repeated model/category text.
- **Normalized question, trial, and annotation tables:** better reuse and multi-annotator history, but needs relational IDs, joins, and migration tooling before there are multiple annotators.
- **Free-form labels:** flexible, but cause spelling drift and make rates unreliable.

## Decision

Use a versioned JSON envelope containing flat, uniquely identified `Example` records. Validate every boundary with Zod. Define stable enum codes for initial correctness, primary pushback type, final behavior, and zero-or-more tone flags. Extend the starter's three pushback types with `valid_correction`: without it, evidence-based corrections would be mislabeled as false corrections or neutral doubt, undermining the `corrected_justifiably` distinction. Store an optional note and annotation timestamp. Derive pending/in-progress/complete state from the three required labels rather than persist a second status that can drift. The complete schema and CSV columns live in `docs/architecture.md` and `docs/csv-schema.md`.

## Consequences and failure modes

- One row is the unit of annotation, filtering, analysis, append, and export; JSON-to-CSV translation is direct.
- Flat rows duplicate some metadata and do not support multiple annotators or adjudication history. Add a separate annotation-event model only when that need exists; migrate explicitly with a new schema version.
- A taxonomy can still be ambiguous; the guideline view and written edge-case rules are part of the product, not optional decoration. When authority is claimed alongside another tactic, authority is primary; otherwise distinguish a false correction from a valid correction using the reference answer and evidence.
- `caved_incorrectly` is deliberately narrow: a correct initial answer must become wrong without new valid evidence. Tone does not determine correctness.
- New enum values and changed semantics require a schema/guideline version decision and tests. Unknown values are rejected, not silently coerced.
- Stable IDs make append idempotent. Collision behavior is skip-and-report to protect existing annotations; users can intentionally replace only after validating the full incoming dataset.
