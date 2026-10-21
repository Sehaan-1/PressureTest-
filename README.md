# PressureTest

**Does an AI change a correct answer just because you push back?** PressureTest is a local-first research workbench for annotating LLM sycophancy across short question, answer, pushback, and final-answer conversations.

> **Starter data is synthetic.** The included eight examples (`PT-DEMO-001` through `PT-DEMO-008`) preview the workflow only and are not empirical model evaluation findings. Replace them with your own collected conversations before citing results.

## What it does

- Review complete four-turn conversations beside their reference answers.
- Annotate initial correctness, pushback type, final behavior, and independent tone flags (`Ctrl/Cmd + Enter` shortcut supported).
- Track pending, in-progress, and complete status from the three required labels.
- Add conversations manually (with explicit consent and client-side PII/API-key warnings) or import bounded CSV/JSON files.
- Export portable versioned JSON backups, spreadsheet-safe CSV exports, or a blank CSV template.
- Explore descriptive model and pushback SVG bar comparisons with explicit numerators, denominators, and sample-size caveats. Cave rates condition on complete examples whose initial answer was correct; the all-complete flip share is reported separately.
- Inspect built-in **Policies & legal** views (`#privacy`, `#terms`, `#cookies`, `#accessibility`) covering local browser storage inventory, consent controls, one-click local data erasure, MIT license disclosures, WCAG 2.1 AA accessibility, and applicable data laws.
- Read the concise in-app protocol and the full annotator handbook in [`docs/annotation-guidelines.md`](docs/annotation-guidelines.md).

### Taxonomy note

PressureTest classifies pushback across neutral doubt, false correction, authority claim, and **valid correction** so evidence-backed user corrections are distinguished from unsupported pressure. **Caved incorrectly** requires an initially correct answer to become wrong without new valid evidence. See [`docs/architecture.md`](docs/architecture.md) and [ADR 0002](docs/adr/0002-annotation-schema-and-label-semantics.md).

## Run locally

Requirements: Node.js 22.12+ and npm.

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

The app seeds a clearly marked synthetic workspace on first open. Use **Dataset -> Import file** to load a CSV or JSON file, or **Add conversation** to create a case locally. Append skips duplicate IDs; Replace asks for explicit confirmation. Export JSON backups regularly.

## Data exchange

- **Versioned JSON:** `schemaVersion: 1` envelope containing the dataset and examples; recommended for lossless backup and restore.
- **CSV:** one row per conversation following [`docs/csv-schema.md`](docs/csv-schema.md), with a blank template downloadable from Dataset (also at [`docs/templates/pressuretest-template.csv`](docs/templates/pressuretest-template.csv)). Formula-like cells receive spreadsheet-safe escaping on export and round-trip cleanly on re-import.
- Imports are bounded to 3 MiB and 2,000 examples and validated all-or-nothing before mutating workspace state.

## Privacy, compliance, and operational boundaries

- Zero model API calls, analytics scripts, tracking cookies, accounts, cloud sync, external font CDNs, or third-party embeds (`Content-Security-Policy` enforced in `index.html`).
- Self-hosted **IBM Plex Sans** and **IBM Plex Mono** `.woff2` fonts (`public/fonts/`, SIL OFL 1.1).
- Data resides solely in browser `localStorage` (`pressuretest.dataset.v1` and `pressuretest.consent.v1`). It is not encrypted or backed up online; export JSON backups regularly or wipe local data anytime from **Policies & legal -> Cookies & storage**.
- Use a single active browser tab when editing.
- Never paste API keys or personal data into conversation fields.
- Charts summarize labeled workspace counts only and never establish causation, statistical significance, or population-level model reliability.

## Engineering map

```text
src/
  app/          bootstrap, shell routing, dataset context
  components/   shared accessible UI, SVG bar chart, brand mark, consent banner
  data/         synthetic starter examples
  domain/       Zod schemas, taxonomy, mutations, analytics, CSV/JSON exchange
  features/     dashboard, annotation, dataset, analysis, guidelines, legal
  storage/      browser-local dataset & consent repositories
  styles/       Framed sheet design tokens, layout, feature & responsive styles
  utils/        file download helper and sensitive-input detector

.claude/skills/design-taste-frontend/
                taste-skill v2 design lint, draw, and headless Chromium inspector
```

Architecture decisions: [0001 toolchain](docs/adr/0001-frontend-and-toolchain.md), [0002 taxonomy](docs/adr/0002-annotation-schema-and-label-semantics.md), [0003 local state](docs/adr/0003-local-first-state-and-concurrency.md), [0004 import/export](docs/adr/0004-import-export-and-model-boundary.md), [0005 analytics](docs/adr/0005-descriptive-analytics-and-accessible-charts.md), and [0006 Framed sheet & web compliance](docs/adr/0006-taste-skill-framed-sheet-and-web-compliance.md).

## Verification checks

```sh
npm run verify
npm run taste:lint
CHROME_PATH=/path/to/chromium npm run taste:inspect -- http://localhost:5173/#overview
```

## License and authorship

Released under the [MIT License](LICENSE) by Sehaan Ur Rahman (`@Sehaan-1`, Patna, Bihar, India). Source and issue tracker: <https://github.com/Sehaan-1/PressureTest->.
