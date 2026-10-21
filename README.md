# PressureTest

**Does an AI change a correct answer just because you push back?** PressureTest is a small, local-first workbench for annotating LLM sycophancy across short question → answer → pushback → final-answer conversations.

> **Starter data is synthetic.** The included eight examples are a UI/workflow preview, not empirical results. Replace them with your own collected conversations before drawing conclusions.

## What it does

- Review the complete exchange beside its reference answer.
- Annotate initial correctness, pushback type, final behavior, and independent tone flags.
- Track pending / in-progress / complete work from the three required labels.
- Add conversations manually or import bounded CSV/JSON files.
- Export the versioned JSON backup or spreadsheet-safe CSV.
- Explore descriptive model and pushback comparisons with numerators, denominators, and sample-size caveats. Cave rates condition on complete examples whose initial answer was correct; the all-complete flip share is displayed separately.
- Read the concise in-app playbook and the full annotator protocol—with two examples per label—in [`docs/annotation-guidelines.md`](docs/annotation-guidelines.md).

### Taxonomy note

The starter taxonomy lists neutral doubt, false correction, and authority claim. PressureTest adds **valid correction** as a fourth pushback type so evidence-based corrections are not mislabeled as false corrections or neutral doubt. The primary behavior label stays narrow: **Caved incorrectly** requires an initially correct answer to become wrong without new valid evidence. See the [schema contract](docs/architecture.md) and [ADR 0002](docs/adr/0002-annotation-schema-and-label-semantics.md).

## Run locally

Requirements: Node.js 22.12+ and npm.

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

The app seeds a clearly marked synthetic workspace on first open. Use **Dataset → Import file** to load a CSV/JSON file, or **Add conversation** to enter a case. Append skips duplicate IDs; Replace is explicit and asks for confirmation. Export JSON backups regularly.

## Data exchange

- **Versioned JSON:** a `schemaVersion: 1` envelope containing the dataset and examples; best option for exact backup/restore.
- **CSV:** one row per conversation, with the stable header contract in [`docs/csv-schema.md`](docs/csv-schema.md) and a downloadable blank CSV template from the Dataset page (also checked in at [`docs/templates/pressuretest-template.csv`](docs/templates/pressuretest-template.csv)). Standard CSV quoting supports commas, quotes, and multiline text. Export adds a safety marker and a protective apostrophe to formula-like spreadsheet cells; PressureTest restores those values when the marked file is re-imported.
- Imports are limited to 3 MiB and 2,000 examples. The full candidate file is validated before any mutation; invalid input is all-or-nothing.
- Blank annotation cells mean “not labeled.” Tone flags use `|` separators.

## Privacy and operational boundaries

- No model API calls, telemetry, accounts, cloud storage, or runtime network requests.
- Conversation data is stored in one versioned browser `localStorage` key for this origin/profile. It is **not encrypted, synced, or backed up**; browser data can be cleared. Export backups.
- Use one active editing tab. Local storage is not a multi-writer database; concurrent tabs may overwrite each other's changes.
- Do not paste provider keys into this app. Obtain model responses outside the browser workbench and import them. A future provider integration needs a separately designed server-side boundary.
- The charts are descriptive only. They do not establish causation, model reliability, or population-level rates; always report cohort and denominator.

## Engineering map

```text
src/
  app/          bootstrap, shell state, dataset context
  components/   accessible shared UI
  data/         synthetic starter examples
  domain/       Zod schema, labels, mutations, analytics, CSV/JSON exchange
  features/     dashboard, annotation, dataset, analysis, guidelines
  storage/      browser-local repository and typed errors
  styles/       tokens, component styles, feature styles, responsive rules
  test/         test setup

docs/
  adr/          accepted architecture decisions
  architecture.md
  annotation-guidelines.md
  csv-schema.md
```

The system boundary, failure behavior, state transitions, contracts, and limits are in [`AGENTS.md`](AGENTS.md) and [`docs/architecture.md`](docs/architecture.md). Important decisions: [frontend/toolchain](docs/adr/0001-frontend-and-toolchain.md), [taxonomy/schema](docs/adr/0002-annotation-schema-and-label-semantics.md), [local persistence/concurrency](docs/adr/0003-local-first-state-and-concurrency.md), [provider boundary/import/export](docs/adr/0004-import-export-and-model-boundary.md), and [descriptive analysis](docs/adr/0005-descriptive-analytics-and-accessible-charts.md).

## Development checks

```sh
npm run dev -- --host 0.0.0.0
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
npm run verify
```

`npm run verify` runs lint, formatting checks, strict TypeScript checks, the Vitest suite, and a production build. GitHub Actions runs the same gate plus `npm audit` on pushes, pull requests, and manual dispatch. Tests cover taxonomy/state transitions, conditional analytics denominators, import/export validation and round-trips, storage failures, safe startup, accessible modal keyboard behavior, CSV import, and an annotation flow.

## Deliberate v1 limitations

No model generation, multi-user/IAA workflow, hosted persistence, notebook, Hugging Face publishing, or automated Cohen's Kappa calculation is included. The app provides the dataset workflow and careful descriptive analysis; research collection, independent second annotation, agreement calculation, and publication remain separate steps.
