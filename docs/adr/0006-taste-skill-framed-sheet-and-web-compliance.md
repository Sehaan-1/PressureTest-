# ADR 0006: Framed Sheet Design System, Self-Hosted Typography, and Web Compliance

## Status

Accepted — 2026-10-21

## Context

PressureTest needed two complementary upgrades across the entire workbench:

1. **Design discipline (`taste-skill` v2 / `design-taste-frontend`):** The initial interface exhibited classic generated-dashboard anti-patterns measured by `lint.mjs --app src` (`9 FAIL, 65 WARN`) and live headless Chromium `inspect.mjs --app` (`7 FAIL, 3 WARN`), including uppercase tracked micro-labels (`10px`), hero and stat gradients, button drop shadows, rainbow icon chips, low-contrast secondary text (`2.4:1`), a mixed serif/sans headline switch, and mobile right-edge clipping (`5px` from viewport edge at `390px`). It also loaded Google Fonts (`Fraunces` and `Plus Jakarta Sans`) at runtime from external CDN domains.
2. **Web compliance, accessibility, and legal transparency:** The audit required WCAG 2.1 AA contrast (`>= 4.5:1`), self-hosted zero-third-party embeds, a strict Content-Security-Policy, dedicated Privacy Policy, Terms & Conditions, Cookies & Browser Storage Policy, Accessibility & Local Laws disclosures, equal-prominence storage consent controls, explicit form consent and sensitive-input detection, keyboard-friendly forms, honest maintainer details, and strict preservation of empirical caveats.

## Decision

1. **Adopt the dealt `Framed sheet` direction (`seed 1475573824`):**
   - Low-chroma tinted frame ground (`#f4f7f8`) holding a `228px` sidebar and `48px` top bar with no dividing rule between them, folding cleanly into an accessible slide-over drawer at `<= 860px`.
   - Inset pure white work sheet (`#ffffff`, `8px` right/bottom inset, `16px` sheet radius, `1px` hairline border `#e5e8eb`, flat elevation with zero drop shadows or gradients).
   - Five-step type scale (`12 / 14 / 16 / 22 / 28 px`) set in self-hosted **IBM Plex Sans** (`400`, `500`, `600`) with **IBM Plex Mono** (`400`, `500`) restricted strictly to literal example IDs, storage keys, and keyboard shortcut hints (`< 5%` share).
   - One calm teal-slate accent and chart hue (`#166073`) with semantic status pills reserved strictly for status badges, plus original code-drawn SVG horizontal bar charts displaying exact `numerator / denominator` fractions beside every rate.
2. **Eliminate runtime external dependencies and enforce CSP:**
   - Self-host Latin `.woff2` subsets of IBM Plex Sans and IBM Plex Mono in `public/fonts/` alongside their `OFL-1.1` license file.
   - Add a strict `<meta http-equiv="Content-Security-Policy">` blocking external scripts, styles, fonts, connections, and frames (`frame-src 'none'`).
3. **Ship complete in-app compliance routes and controls:**
   - Add dedicated tab-addressable views (`#privacy`, `#terms`, `#cookies`, `#accessibility`) using the two-column `Framed sheet` settings layout.
   - Persist explicit browser storage consent choices in `pressuretest.consent.v1` (`LocalStorageConsentRepository`) with equal-prominence `Essential storage only` and `Allow UI preferences` actions plus one-click local data erasure.
   - Require explicit local-storage/data-minimization confirmation before saving manually authored conversations, paired with live client-side detection (`detectSensitiveInput`) warning if pasted text resembles an API key or email address.

## Consequences

- **Positive:** `npm run taste:lint` passes with `0 FAIL, 0 WARN`, and live Chromium `inspect.mjs --app` passes with `0 FAIL, 0 WARN` (`FINDINGS none.`) across all 10 routes at `1440px`, `768px`, and `390px`. Zero visitor IP metadata leaks to third-party font CDNs, and researchers can inspect storage inventory, export backups, or erase browser data directly in the app.
- **Trade-offs:** Five self-hosted `.woff2` files add `~112 KB` to `public/fonts/`, avoiding all external network dependencies so the workbench works completely offline.
