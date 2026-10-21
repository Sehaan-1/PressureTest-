# PressureTest contributor guide

## Project purpose
PressureTest is a local-first workbench for annotating whether an LLM maintains a correct answer when a user challenges it. It is an annotation and descriptive analysis tool, not an LLM host or a claim that shipped starter rows are empirical research findings.

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
- **Core stock:** one versioned dataset of conversation examples and annotations (`pressuretest.dataset.v1`), paired with a lightweight storage-consent record (`pressuretest.consent.v1`).
- **Outputs:** searchable queue and dataset table, annotation completion progress, descriptive SVG bar charts, and portable CSV/JSON exports.
- **Persistence boundary:** browser-local storage only. Never upload user data, connect third-party analytics, or load external runtime assets/fonts.

## Architecture and directory boundaries

- `src/domain/`: schema, taxonomy, state derivation, import validation, and pure analytics. No browser APIs or UI imports.
- `src/storage/`: local dataset and consent repositories plus storage-specific errors. No React components.
- `src/data/`: explicitly synthetic, labeled starter records (`PT-DEMO-001`..`PT-DEMO-008`).
- `src/features/`: overview dashboard, annotation queue, dataset management, analysis, guidelines, and policies/legal views.
- `src/components/`: shared UI primitives, code-drawn SVG charts, brand mark, and storage consent banner.
- `src/app/`: application shell, hash routing (`#overview`, `#annotate`, `#dataset`, `#analysis`, `#guidelines`, `#privacy`, `#terms`, `#cookies`, `#refunds`, `#accessibility`), and state context.
- `src/styles/`: `Framed sheet` design tokens (`tokens.css`), shell layout, flat component rules, and responsive breakpoints.
- `src/utils/`: browser download helper and client-side PII/API-key warning helper (`sensitiveDataCheck.ts`).
- `.claude/skills/design-taste-frontend/`: `taste-skill` v2 static lint and live headless Chromium layout/contrast inspector.
- `docs/adr/`: architecture decision records (`0001` through `0006`).

## Design and compliance invariants

- Follow the dealt **`Framed sheet`** direction (`seed 1475573824`, ADR 0006): low-chroma tinted frame ground (`#f4f7f8`), pure white inset sheet (`#ffffff`), divided flat panels (`1px` borders, zero gradients, zero resting shadows), 5-size type scale (`12 / 14 / 16 / 22 / 28 px`) in self-hosted **IBM Plex Sans**, **IBM Plex Mono** strictly for IDs/keys, and WCAG 2.1 AA contrast (`>= 4.5:1`) everywhere.
- Keep `index.html` Content-Security-Policy intact (`default-src 'self'`, `frame-src 'none'`, zero external font/script CDNs).
- Preserve explicit numerators, denominators, and synthetic-sample disclaimers across all metrics. Never claim causal or population-level conclusions.

## Verification commands

```sh
npm ci
npm run verify
npm run taste:lint
CHROME_PATH=/path/to/chromium npm run taste:inspect -- http://localhost:5173/#overview
```

Run both `npm run verify` and `npm run taste:lint` (plus live `taste:inspect` across desktop `1440px`, tablet `768px`, and mobile `390px` when changing UI) before delivery.
