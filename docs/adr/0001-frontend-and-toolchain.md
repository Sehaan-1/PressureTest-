# ADR 0001: Lightweight typed browser application

- **Status:** Accepted
- **Date:** 2026-10-18

## Context

The repository is empty apart from its license. PressureTest needs a responsive multi-view annotation UI, dynamic forms, derived analysis, and a live browser preview, but no server rendering, accounts, HTTP API, or model inference. Runtime and operations should remain small enough for a student-maintained project.

## Considered options

- **React + TypeScript + Vite:** broad component/testing ecosystem and straightforward static SPA build; a few dependencies and a client-side shell.
- **Next.js:** more routing/server features, but introduces a server/runtime boundary that this local-only workflow does not need and can accidentally invite unsafe browser-to-provider calls.
- **SvelteKit / Vue + Vite:** capable and compact, but offers no system-level advantage for this small app; React has a larger reusable portfolio and testing ecosystem.
- **Vanilla TypeScript:** no framework dependency, but interactive forms, navigation, state transitions, and accessible component reuse would become custom infrastructure.

For formatting/linting, considered ESLint + Prettier and Biome. Biome provides one maintained, fast formatter/linter configuration; the build remains separately type-checked. For visual styling, considered Tailwind and a component system; hand-authored CSS avoids a design-system dependency and keeps the visual language explicit.

## Ecosystem check

Checked npm package metadata on 2026-10-18 for React, Vite, TypeScript, Zod, PapaParse, Lucide, and Vitest, including package licenses and Vite plugin peer dependencies. The installed direct packages are React 19.3.1 / React DOM 19.3.1 (MIT), Vite 8.3.4 / Vitest 5.0.5 (MIT), TypeScript 7.0.2 (Apache-2.0), Zod 4.6.7 and PapaParse 5.7.0 (MIT), Lucide React 1.59.0 (ISC), and Biome 2.5.15 (MIT OR Apache-2.0). These are compatible with the repository's MIT license, subject to preserving dependency notices. Use the lockfile for reproducibility and re-check engine/peer requirements when upgrading. Use React Testing Library with jsdom for interaction tests; avoid introducing a larger end-to-end runner until the app has a real need for one.

## Comparative evaluation

| Concern | Selected option | Alternatives and trade-offs |
|---|---|---|
| UI/runtime operations | React + Vite: static browser output, no deployed server or runtime service to operate. The production bundle measured ~123 kB gzip JavaScript and ~13 kB gzip CSS at this milestone. | Next.js adds server/hosting and secret-handling boundaries that v1 does not need. Vanilla TS minimizes framework bytes but would make accessible component state, forms, and tests bespoke. |
| Runtime contracts/type safety | TypeScript + Zod: inferred static types plus runtime checks for local storage, user forms, and imported files. | TypeScript alone erases at runtime and cannot validate file/storage data. Ajv/JSON Schema is established and attractive for a shared cross-language schema, but adds schema/type-generation choices for this single browser app. Zod adds some bundle cost; strict import size/row limits bound work. |
| CSV exchange/security | PapaParse: browser-ready, standards-aware quoting/multiline parsing and serialization; explicit column allowlist and Zod validation remain application responsibilities. | Handwritten `split(',')` parsing is smaller but fails on quoting/newlines and expands the security/test surface. A server parser would require upload infrastructure and move private conversations off-device. |
| Persistence/concurrency | One `localStorage` envelope: simplest zero-service deployment and one-key replacement; keep a conservative 3 MiB limit and a one-active-tab operating rule. | IndexedDB supports larger structured datasets and transactions but adds async lifecycle/migration complexity; a hosted DB enables collaboration but needs auth, access control, backups, conflict handling, and operating cost. |
| Charts/visualization | Native HTML/CSS rate bars and count tables: no chart runtime dependency, direct text labels, denominator and sample caveats remain visible. | A chart package would help with large interactive/time-series plots, but adds bytes and more accessibility/empty-state behavior for the current five descriptive views. |
| Formatting/tests | Biome + Vitest + Testing Library/jsdom: one formatter/linter config and fast unit/UI tests. | ESLint + Prettier has a wider plugin/rule ecosystem but requires separate configuration; Biome's narrower rules are a known trade-off. A real browser suite is deferred until browser-only behavior justifies its installation/maintenance cost. |
| Security/observability | No credentials, telemetry, provider calls, or remote logging. Boundary failures surface as actionable UI messages and typed errors; tests cover storage/import failures. | The local-only boundary avoids transmitting research data, but provides no aggregate telemetry, tracing, or operational dashboard. If a server is later added, observability must be designed without logging conversation contents or secrets. |

## Decision

Use React with strict TypeScript and Vite for a client-rendered SPA. Use custom CSS, Lucide React for interface icons, Biome for formatting/linting, and Vitest + React Testing Library for tests. Use Zod for runtime boundary schemas and PapaParse for standards-compliant CSV parsing/serialization. Keep domain logic framework-independent.

## Consequences and failure modes

- Build output is static and can be hosted without an application server; development preview must bind to `0.0.0.0`.
- No SSR or provider-side secret boundary is implied; local storage and file APIs are browser-only adapters.
- React context/native hooks are adequate for one local dataset; do not add Redux/Zustand without a demonstrated cross-feature state problem.
- Vite/plugin/TypeScript version drift can break peer compatibility; keep the lockfile and run `npm run verify` on upgrades.
- Custom CSS costs more hand-authored responsive/accessibility work than a component library; shared tokens and focused primitives mitigate duplication.
- Biome has a smaller rule ecosystem than ESLint; if a required semantic rule is unsupported, document and add a focused check instead of accumulating overlapping configs. The CSS `noDescendingSpecificity` rule is disabled because intentional component-layer and responsive overrides produced noisy order warnings; other recommended lint rules remain enabled.
