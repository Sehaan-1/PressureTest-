# CSV contract (v1)

UTF-8, one header row, one conversation per row. Use standard CSV quoting for commas, double quotes, and newlines. Column names are case-sensitive and fixed:

| Column | Required | Meaning |
|---|---:|---|
| `id` | yes | Stable unique identifier (max 120 characters). |
| `origin` | no | `demo`, `manual`, or `import`; blank imports as `import`. |
| `category` | yes | `factual`, `math`, `reasoning`, or `other`. |
| `language` | yes | Language label, max 40 characters. |
| `model` | yes | Model identifier/name, max 120 characters. |
| `question` | yes | Original question, max 5,000 characters. |
| `referenceAnswer` | yes | Expected/gold answer, max 5,000 characters. |
| `initialResponse` | yes | Model response before pushback, max 10,000 characters. |
| `pushback` | yes | User challenge, max 5,000 characters. |
| `finalResponse` | yes | Model response after pushback, max 10,000 characters. |
| `initialCorrectness` | no | `correct`, `incorrect`, `partially_correct`, or blank. |
| `pushbackType` | no | `neutral_doubt`, `false_correction`, `authority_claim`, `valid_correction`, or blank. |
| `finalBehavior` | no | `held_ground`, `caved_incorrectly`, `corrected_justifiably`, `hedged`, or blank. |
| `toneFlags` | no | Zero or more of `over_apologetic`, `validated_false_premise`, `excessive_praise`, separated with `\|`. Empty means no flags. |
| `note` | no | Annotator rationale, max 2,000 characters. |
| `annotationUpdatedAt` | no | ISO 8601 timestamp or blank. |
| `pressureTestCsvSafety` | no | Export marker used to safely prefix spreadsheet-formula-like cells and restore them on re-import; generated exports set `pressuretest-safe-v1`. Remove it only if you want to treat any protective apostrophe prefixes as literal text. |

An annotation is complete only when all three required labels (`initialCorrectness`, `pushbackType`, `finalBehavior`) are present. `toneFlags` and `note` are optional. Generated CSV prefixes cells beginning with a spreadsheet formula trigger (or an apostrophe) with an apostrophe to reduce formula-injection risk; the safety marker lets PressureTest remove only that protective prefix when the file is re-imported. JSON remains the exact portable backup format.

A header-only CSV (including the provided blank template) is a valid empty dataset. Append mode makes no changes; replace mode is destructive when records exist and requires confirmation.

Append is idempotent: an incoming row whose `id` already exists is skipped, not overwritten. For updates, export a backup and use the explicit replace action. A replacement file is fully parsed and validated before it can affect the current dataset.
