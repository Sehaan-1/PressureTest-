import Papa from "papaparse";
import type { ZodError } from "zod";
import { datasetSchema, exampleSchema, MAX_EXAMPLES, MAX_IMPORT_BYTES } from "./schema";
import type { DatasetV1, Example } from "./schema";

export const CSV_SAFETY_COLUMN = "pressureTestCsvSafety";
export const CSV_SAFETY_MARKER = "pressuretest-safe-v1";

export const CSV_COLUMNS = [
  "id",
  "origin",
  "category",
  "language",
  "model",
  "question",
  "referenceAnswer",
  "initialResponse",
  "pushback",
  "finalResponse",
  "initialCorrectness",
  "pushbackType",
  "finalBehavior",
  "toneFlags",
  "note",
  "annotationUpdatedAt",
  CSV_SAFETY_COLUMN,
] as const;

const requiredCsvColumns = [
  "id",
  "category",
  "language",
  "model",
  "question",
  "referenceAnswer",
  "initialResponse",
  "pushback",
  "finalResponse",
] as const;

const allowedCsvColumns = new Set<string>(CSV_COLUMNS);
const MAX_REPORTED_ERRORS = 40;

export interface ImportProblem {
  location: string;
  message: string;
}

export type ImportResult =
  | { success: true; examples: Example[]; format: "csv" | "json" }
  | { success: false; problems: ImportProblem[] };

function sizeProblem(text: string): ImportProblem | null {
  const byteLength = new TextEncoder().encode(text).byteLength;
  if (byteLength <= MAX_IMPORT_BYTES) return null;
  return {
    location: "File",
    message: `The file is larger than the ${Math.round(MAX_IMPORT_BYTES / (1024 * 1024))} MB import limit.`,
  };
}

function formatZodProblem(error: ZodError, location: string): ImportProblem[] {
  return error.issues.slice(0, MAX_REPORTED_ERRORS).map((issue) => ({
    location: issue.path.length > 0 ? `${location}.${issue.path.join(".")}` : location,
    message: issue.message,
  }));
}

function collectZodProblems(error: ZodError, location: string): ImportProblem[] {
  const problems = formatZodProblem(error, location);
  if (error.issues.length > MAX_REPORTED_ERRORS) {
    problems.push({
      location,
      message: `And ${error.issues.length - MAX_REPORTED_ERRORS} more validation errors.`,
    });
  }
  return problems;
}

function unescapeSpreadsheetPrefix(value: string): string {
  return value.startsWith("'") ? value.slice(1) : value;
}

function protectSpreadsheetCell(value: string): string {
  if (value.startsWith("'") || /^[\t\r\n ]*[=+\-@]/.test(value)) return `'${value}`;
  return value;
}

function cell(row: Record<string, string | undefined>, key: string, safeExport: boolean): string {
  const value = row[key] ?? "";
  return safeExport ? unescapeSpreadsheetPrefix(value) : value;
}

function parseCsv(text: string): ImportResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    return {
      success: false,
      problems: parsed.errors.slice(0, MAX_REPORTED_ERRORS).map((error) => ({
        location: `Row ${(error.row ?? 0) + 2}`,
        message: `Could not parse CSV (${error.code}). ${error.message}`,
      })),
    };
  }

  const headers = parsed.meta.fields ?? [];
  const missing = requiredCsvColumns.filter((header) => !headers.includes(header));
  const unknown = headers.filter((header) => !allowedCsvColumns.has(header));
  const headerProblems: ImportProblem[] = [
    ...missing.map((header) => ({
      location: "Header",
      message: `Missing required column: ${header}`,
    })),
    ...unknown.map((header) => ({ location: "Header", message: `Unknown column: ${header}` })),
  ];
  if (headerProblems.length > 0) return { success: false, problems: headerProblems };
  if (parsed.data.length > MAX_EXAMPLES) {
    return {
      success: false,
      problems: [{ location: "File", message: `The CSV exceeds the ${MAX_EXAMPLES}-row limit.` }],
    };
  }

  const safeExport = parsed.data.every((row) => row[CSV_SAFETY_COLUMN] === CSV_SAFETY_MARKER);
  const examples: Example[] = [];
  const problems: ImportProblem[] = [];

  parsed.data.forEach((row, index) => {
    const raw = (key: string) => cell(row, key, safeExport);
    const toneFlags = raw("toneFlags")
      .split("|")
      .map((flag) => flag.trim())
      .filter(Boolean);
    const candidate = {
      id: raw("id").trim(),
      origin: raw("origin").trim() || "import",
      category: raw("category").trim(),
      language: raw("language"),
      model: raw("model"),
      question: raw("question"),
      referenceAnswer: raw("referenceAnswer"),
      initialResponse: raw("initialResponse"),
      pushback: raw("pushback"),
      finalResponse: raw("finalResponse"),
      annotation: {
        initialCorrectness: raw("initialCorrectness").trim() || null,
        pushbackType: raw("pushbackType").trim() || null,
        finalBehavior: raw("finalBehavior").trim() || null,
        toneFlags,
        note: raw("note"),
        updatedAt: raw("annotationUpdatedAt").trim() || null,
      },
    };
    const validation = exampleSchema.safeParse(candidate);
    if (validation.success) {
      examples.push(validation.data);
      return;
    }
    problems.push(...collectZodProblems(validation.error, `Row ${index + 2}`));
  });

  if (examples.length !== parsed.data.length || problems.length > 0) {
    return { success: false, problems: problems.slice(0, MAX_REPORTED_ERRORS) };
  }

  const datasetValidation = datasetSchema.safeParse({
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    examples,
  });
  if (!datasetValidation.success) {
    return { success: false, problems: collectZodProblems(datasetValidation.error, "Dataset") };
  }

  return { success: true, examples, format: "csv" };
}

function parseJson(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      success: false,
      problems: [{ location: "File", message: "The JSON file could not be parsed." }],
    };
  }

  if (Array.isArray(parsed)) {
    if (parsed.length > MAX_EXAMPLES) {
      return {
        success: false,
        problems: [
          { location: "File", message: `The JSON exceeds the ${MAX_EXAMPLES}-row limit.` },
        ],
      };
    }
    const examples: Example[] = [];
    const problems: ImportProblem[] = [];
    parsed.forEach((candidate, index) => {
      const validation = exampleSchema.safeParse(candidate);
      if (validation.success) {
        examples.push(validation.data);
      } else {
        problems.push(...collectZodProblems(validation.error, `Example ${index + 1}`));
      }
    });
    if (problems.length > 0)
      return { success: false, problems: problems.slice(0, MAX_REPORTED_ERRORS) };

    const datasetValidation = datasetSchema.safeParse({
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      examples,
    });
    if (!datasetValidation.success) {
      return { success: false, problems: collectZodProblems(datasetValidation.error, "Dataset") };
    }
    return { success: true, examples, format: "json" };
  }

  const envelopeValidation = datasetSchema.safeParse(parsed);
  if (!envelopeValidation.success) {
    const unsupportedVersion =
      typeof parsed === "object" &&
      parsed !== null &&
      "schemaVersion" in parsed &&
      (parsed as { schemaVersion?: unknown }).schemaVersion !== 1;
    if (unsupportedVersion) {
      return {
        success: false,
        problems: [
          { location: "schemaVersion", message: "This dataset version is not supported." },
        ],
      };
    }
    return { success: false, problems: collectZodProblems(envelopeValidation.error, "Dataset") };
  }

  return { success: true, examples: envelopeValidation.data.examples, format: "json" };
}

export function parseImportText(text: string, filename: string): ImportResult {
  const tooLarge = sizeProblem(text);
  if (tooLarge) return { success: false, problems: [tooLarge] };

  const extension = filename.toLowerCase().split(".").pop();
  if (extension === "csv") return parseCsv(text);
  if (extension === "json") return parseJson(text);
  return {
    success: false,
    problems: [{ location: "File", message: "Choose a .csv or .json file." }],
  };
}

export function serializeDatasetJson(dataset: DatasetV1): string {
  return JSON.stringify(datasetSchema.parse(dataset), null, 2);
}

export function serializeExamplesCsv(examples: Example[]): string {
  const validatedExamples = examples.map((example) => exampleSchema.parse(example));
  const rows = validatedExamples.map((example) => {
    const values: Record<(typeof CSV_COLUMNS)[number], string> = {
      id: example.id,
      origin: example.origin,
      category: example.category,
      language: example.language,
      model: example.model,
      question: example.question,
      referenceAnswer: example.referenceAnswer,
      initialResponse: example.initialResponse,
      pushback: example.pushback,
      finalResponse: example.finalResponse,
      initialCorrectness: example.annotation.initialCorrectness ?? "",
      pushbackType: example.annotation.pushbackType ?? "",
      finalBehavior: example.annotation.finalBehavior ?? "",
      toneFlags: example.annotation.toneFlags.join("|"),
      note: example.annotation.note,
      annotationUpdatedAt: example.annotation.updatedAt ?? "",
      [CSV_SAFETY_COLUMN]: CSV_SAFETY_MARKER,
    };
    return Object.fromEntries(CSV_COLUMNS.map((key) => [key, protectSpreadsheetCell(values[key])]));
  });
  if (rows.length === 0) return CSV_COLUMNS.join(",");
  return Papa.unparse(rows, { columns: [...CSV_COLUMNS], newline: "\r\n" });
}
