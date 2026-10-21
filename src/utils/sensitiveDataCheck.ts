export interface SensitiveDataWarning {
  field: string;
  reason: string;
}

const API_KEY_PATTERN =
  /\b(sk-[a-zA-Z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,}|ghp_[0-9A-Za-z]{20,}|xox[baprs]-[0-9A-Za-z-]{16,})\b/;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

export function detectSensitiveInput(fields: Record<string, string>): SensitiveDataWarning[] {
  const warnings: SensitiveDataWarning[] = [];

  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue;
    if (API_KEY_PATTERN.test(value)) {
      warnings.push({
        field,
        reason:
          "Looks like an API token or secret key. Remove credentials before saving to browser storage.",
      });
    } else if (EMAIL_PATTERN.test(value)) {
      warnings.push({
        field,
        reason:
          "Contains an email address. Redact personal identifiers so you only store necessary research data.",
      });
    }
  }

  return warnings;
}
