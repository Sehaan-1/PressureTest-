# ADR 0003: Browser-local, single-writer persistence

- **Status:** Accepted
- **Date:** 2026-10-18

## Context

The initial target is an individual researcher annotating roughly 300 examples. The dataset should stay private and work without accounts, service operations, or API secrets. Browser local storage is synchronous and easy to back up as CSV/JSON, but it is quota-limited and not transactional across multiple writers.

## Considered options

- **One versioned `localStorage` envelope:** minimal operations, synchronous save, straightforward export; limited quota, clearable, unencrypted, and last-write-wins across tabs.
- **IndexedDB:** more capacity and transactions; asynchronous repository and migrations add complexity beyond the initial dataset.
- **Hosted database/API:** supports collaboration, backups, access control, and audit history; requires deployment, authentication, security review, and ongoing operations.
- **In-memory only:** simplest but loses work on reload and is inappropriate for multi-hour annotation.

## Decision

Use one versioned localStorage key as the v1 persistence boundary. Keep current application state in React context/native hooks and route every mutation through a repository command that validates and writes a complete candidate snapshot before reporting success. Seed synthetic examples only when storage is genuinely absent. If storage is malformed, unsupported, denied, or over quota, surface a recovery/error state and never silently overwrite or claim that an edit was saved. Assume one active editing tab; export backups regularly.

## Consequences and failure modes

- Local-first operation avoids external availability, privacy, authentication, and API-key risks. Analytics and import/export work offline.
- Data is origin/profile specific and is not encrypted. Clearing browser data can delete the only copy; the UI/docs must advise exports.
- Typical quotas are adequate for the target dataset but not guaranteed. Bound imports, detect failed writes, preserve the last saved snapshot, and provide actionable recovery messaging.
- Multiple active tabs can overwrite each other's snapshots. v1 does not claim concurrency safety; one active tab is an explicit operational constraint. If multiple annotators or concurrent tabs become a requirement, use a transactional store and conflict/version model rather than bolting on an unreliable localStorage lock.
- React state is not authoritative after a persistence failure. Commit in-memory state only after the repository reports a successful save, or clearly distinguish unsaved draft state.
- No server-side backup, restore, access control, or audit log is provided; those are future system-boundary changes requiring a new ADR.
