# ADR 0004: File-based data exchange; no browser-side model calls

- **Status:** Accepted
- **Date:** 2026-10-18

## Context

The project plan calls for conversations from multiple LLMs, CSV delivery, and potentially free hosted model APIs. A static browser application cannot safely hold Groq, Gemini, or other provider credentials. Automatic inference also changes the privacy, cost, rate-limit, reproducibility, and operational profile of an annotation tool.

## Considered options

- **Import/export CSV and JSON; inference happens outside the app:** works offline, reproducible, no secrets or provider failures; requires researcher to obtain/prepare responses separately.
- **Call model providers directly from browser:** simplest UI integration, but credentials are exposed to browser storage/network tooling and requests can leak dialogue; unacceptable.
- **Add a server-side generation proxy now:** hides credentials and can apply limits, but introduces deployment, authentication, provider contracts, retries, and sensitive-data retention for a feature not needed to annotate.
- **Use a third-party annotation SaaS embed:** quick start but adds account, data transfer, and platform-specific schema dependencies.

## Decision

Keep the runtime network-free. Support bounded, validated CSV/JSON import and local CSV/JSON export. Use PapaParse for CSV syntax and Zod for semantic validation. Store no credentials. Treat generation as an external upstream workflow; this app records the model name and the conversation evidence. Any future provider integration must be a separately scoped server-side adapter with environment-managed secrets, timeouts, rate limits, idempotent request IDs, explicit data consent, and a new ADR.

## Consequences and failure modes

- There is no provider outage, rate-limit retry loop, or accidental client-side secret exposure in the annotation path.
- Researchers must maintain provenance and reproducibility when collecting responses; the model field and import file provide a minimal record, not a full prompt/config audit trail.
- CSV parsing handles quoting and embedded newlines; schema validation still rejects bad rows before changes.
- Imports are bounded and all-or-nothing, append is ID-idempotent, and replacement is explicit. Malformed/oversized files do not partially populate the dataset.
- No third-party annotation platform, telemetry, or analytics service receives private conversations.
