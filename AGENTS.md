# PressureTest contributor guide

## Project purpose
PressureTest is a small, local-first workbench for annotating whether an LLM maintains a correct answer when a user challenges it. It is an annotation and analysis tool, not an LLM host or a claim that the included sample results are empirical.

## System map

```text
CSV / JSON file ──> import adapter ──> runtime schema validation ──> dataset domain
                                                                  │
Annotation form / manual entry ───────────────────────────────────┤
                                                                  ▼
                                                       versioned local dataset
                                                          (browser storage)
                                                                  │
                             ┌────────────────────────────────────┴────────────────────────┐
                             ▼                                                             ▼
                   work queue / dataset UI                                    derived analysis views
                             │                                                             │
                             └──────────────────────> CSV / JSON export <─────────────────┘
```

- **Inputs:** user-authored annotation edits, manually entered conversations, and imported CSV/JSON files.
- **Core stock:** one versioned dataset of conversation examples and annotations. Annotation progress and all chart metrics are derived from those records; there is no second analytics database.
- **Outputs:** searchable queue/table, annotation progress, descriptive charts, and portable CSV/JSON exports.
- **Persistence boundary:** browser-local storage only. The app does not upload research data. The single-user MVP is intended to be edited in one active browser tab; local storage is not a multi-writer database or encrypted backup.
- **External runtime dependencies:** none. Model responses are supplied by the researcher. Never put provider API keys in browser code. Model API integration requires a separately designed server-side proxy and an ADR.
- **Failure boundaries:** invalid imports are rejected before mutation; storage parse/quota errors are surfaced without replacing the current dataset; analytics are recomputed from the validated dataset; exports are generated on demand.
- **Feedback and stability:** importing adds data, annotation increases completed coverage, and computed outcomes change the displayed analysis. There are no background retries, polling loops, queues, or automatic model calls, so no retry storm or unbounded work queue exists. Keep imports bounded, writes atomic at the dataset-envelope level, and mutations user initiated.
- **Blast radius:** a browser-storage failure affects persistence in that browser, not an external service. Export regularly. Do not silently seed over unreadable stored data or silently discard partially completed work.

## Architecture and planned directory boundaries

- `src/domain/`: schema, taxonomy, state derivation, import validation, and pure analytics. No browser APIs or UI imports.
- `src/storage/`: local dataset repository and storage-specific errors. No React components.
- `src/data/`: explicitly synthetic, labeled demo records.
- `src/features/`: dashboard, annotation queue, dataset management, analysis, and guideline views.
- `src/components/`: shared UI primitives and layout.
- `src/app/`: application shell and navigation.
- `src/styles/`: design tokens, responsive layout, and global styles.
- `docs/adr/`: decisions that affect system boundaries, data, dependencies, or operations.

Keep each file below 1,000 lines; prefer cohesive 200–500 line modules. Split by domain responsibility, not arbitrary line count.

## Contracts and invariants

- Dataset envelope version is `1`; the stable record and CSV contract is described in `docs/architecture.md`.
- Validate imported and persisted values at runtime before they reach domain/UI code. Unknown schema versions are errors, not an invitation to overwrite data.
- Annotation completion is derived from the three required labels: initial correctness, pushback type, and final behavior. Tone flags and notes are optional.
- `Caved incorrectly` requires that the initial answer was correct and the final answer became incorrect without new valid evidence. Do not infer it from politeness alone.
- Analysis denominators must be explicit and exclude incomplete labels. Cave-rate denominators further include only initially correct cases; keep the all-complete flip share distinct. Empty/zero-eligible cohorts display an empty state, not a fabricated zero-rate insight.
- Demo examples are synthetic. Keep the demo disclaimer visible anywhere demo-derived metrics are shown.

## Development commands

Use Node.js 22.12+ and npm. From the repository root:

```sh
npm ci
npm run dev -- --host 0.0.0.0
npm run build
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run verify
```

`npm run verify` is the pre-delivery gate and runs lint, formatting checks, type checking, tests, and production build. GitHub Actions runs this gate plus `npm audit` on pushes and pull requests. Do not run the development server as a one-shot shell command; use the workspace process tool when a live preview is needed.

## Code, quality, and security conventions

- TypeScript strict mode; avoid `any`. Keep domain functions pure and inject browser storage at the repository boundary so failure cases are testable.
- Keep React components focused on presentation and event orchestration. Derived counts/rates belong in pure domain selectors.
- Use semantic HTML, visible focus states, accessible labels, keyboard-operable controls, and responsive layouts.
- Show plain-language, actionable errors. Log no user dialogue, API secrets, or raw stack traces in the UI.
- Do not add provider credentials, third-party analytics, runtime network calls, or unreviewed external assets. Dependencies must be justified in an ADR, MIT/BSD/Apache/ISC compatible, and checked for maintenance/peer compatibility before adoption.
- Imports must be bounded and all-or-nothing validated before append/replace. A duplicate ID in append mode is idempotently skipped. A replace action must be explicit.
- Persist a complete versioned dataset snapshot. If writing fails, do not report success or discard the user's in-memory edits.
- Keep generated output and local datasets out of version control unless explicitly requested. The shipped demo data must be clearly identified as illustrative, not research evidence.

## Verification expectations

- Unit-test taxonomy/status/analytics and CSV/JSON contract logic.
- Test malformed imports, unsupported versions, storage read/write failures, quota handling, duplicate import behavior, and denominator edge cases.
- Run the full `npm run verify` gate after each logical milestone. If a check is unavailable or fails, report it rather than claiming success.
