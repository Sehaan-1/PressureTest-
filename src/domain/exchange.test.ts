import { describe, expect, it } from "vitest";
import { createDemoDataset } from "../data/demoDataset";
import { parseImportText, serializeDatasetJson, serializeExamplesCsv } from "./exchange";
import type { Example } from "./schema";

const dataset = createDemoDataset("2026-10-18T12:00:00.000Z");

function importedExamples(text: string, filename: string): Example[] {
  const result = parseImportText(text, filename);
  if (!result.success)
    throw new Error(result.problems.map((problem) => problem.message).join("; "));
  return result.examples;
}

describe("dataset import and export contracts", () => {
  it("round-trips all fields through safe CSV, including quoted commas and line breaks", () => {
    const first = dataset.examples[0];
    expect(first).toBeDefined();
    if (!first) throw new Error("Expected a demo example");
    const example: Example = {
      ...first,
      question: 'A quoted "question", with a comma\nand a second line.',
      annotation: { ...first.annotation, note: "A note, with a comma and\na newline." },
    };
    const examples = [example];

    const csv = serializeExamplesCsv(examples);
    const imported = importedExamples(csv, "round-trip.CSV");

    expect(imported).toEqual(examples);
  });

  it("protects spreadsheet formula-like content and restores it on app re-import", () => {
    const first = dataset.examples[0];
    expect(first).toBeDefined();
    if (!first) throw new Error("Expected a demo example");
    const formulaText = '=HYPERLINK("https://example.invalid", "open")';
    const example: Example = { ...first, question: formulaText, referenceAnswer: "'=literal" };

    const csv = serializeExamplesCsv([example]);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("''=literal");
    expect(importedExamples(csv, "safe.csv")).toEqual([example]);
  });

  it("round-trips an empty CSV template without inventing records", () => {
    const csv = serializeExamplesCsv([]);
    expect(csv).toContain("id,origin,category,language,model,question");
    expect(importedExamples(csv, "empty-template.csv")).toEqual([]);
  });

  it("round-trips the versioned JSON envelope", () => {
    const json = serializeDatasetJson(dataset);
    expect(importedExamples(json, "backup.json")).toEqual(dataset.examples);
  });

  it("accepts a JSON record array as an import convenience", () => {
    expect(importedExamples(JSON.stringify(dataset.examples.slice(0, 1)), "rows.json")).toEqual([
      dataset.examples[0],
    ]);
  });

  it("rejects unsupported JSON versions without partial acceptance", () => {
    const result = parseImportText(
      JSON.stringify({ schemaVersion: 8, updatedAt: "2026-10-18T12:00:00.000Z", examples: [] }),
      "future.json",
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.problems[0]?.message).toMatch(/version is not supported/i);
  });

  it("rejects the entire import when any JSON row violates the schema", () => {
    const first = dataset.examples[0];
    expect(first).toBeDefined();
    if (!first) throw new Error("Expected a demo example");
    const invalid = { ...first, category: "space" };
    const result = parseImportText(JSON.stringify([first, invalid]), "bad.json");
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.problems.some((problem) => problem.location.includes("category"))).toBe(true);
  });

  it("rejects duplicate IDs across imported JSON records", () => {
    const first = dataset.examples[0];
    expect(first).toBeDefined();
    if (!first) throw new Error("Expected a demo example");
    const result = parseImportText(JSON.stringify([first, first]), "duplicates.json");
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.problems.some((problem) => /duplicate/i.test(problem.message))).toBe(true);
  });

  it("rejects CSV with missing contract columns and unsupported file types", () => {
    const missingHeaders = parseImportText("id,question\n1,hello\n", "bad.csv");
    expect(missingHeaders.success).toBe(false);
    if (!missingHeaders.success) {
      expect(
        missingHeaders.problems.some((problem) => /Missing required column/.test(problem.message)),
      ).toBe(true);
    }

    const unsupported = parseImportText("{}", "dataset.txt");
    expect(unsupported.success).toBe(false);
  });

  it("rejects files larger than the configured import bound before parsing", () => {
    const result = parseImportText("x".repeat(3 * 1024 * 1024 + 1), "large.json");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.problems[0]?.message).toMatch(/larger than/i);
  });
});
