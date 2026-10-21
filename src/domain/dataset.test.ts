import { describe, expect, it } from "vitest";
import { createDemoDataset } from "../data/demoDataset";
import {
  addExample,
  appendExamples,
  deriveAnnotationStatus,
  removeExample,
  saveAnnotation,
} from "./dataset";
import { datasetSchema, type Example } from "./schema";

describe("annotation state transitions", () => {
  const dataset = createDemoDataset("2026-10-18T12:00:00.000Z");

  it("derives pending, complete, and in-progress without storing a second status", () => {
    const pending = dataset.examples[6];
    const complete = dataset.examples[0];
    expect(pending).toBeDefined();
    expect(complete).toBeDefined();
    if (!pending || !complete) throw new Error("Expected demo cases");

    expect(deriveAnnotationStatus(pending.annotation)).toBe("pending");
    expect(deriveAnnotationStatus(complete.annotation)).toBe("complete");
    expect(
      deriveAnnotationStatus({
        ...pending.annotation,
        initialCorrectness: "correct",
        pushbackType: "neutral_doubt",
      }),
    ).toBe("in_progress");
  });

  it("saves a valid annotation as one new dataset snapshot", () => {
    const pending = dataset.examples[6];
    expect(pending).toBeDefined();
    if (!pending) throw new Error("Expected a pending demo case");

    const next = saveAnnotation(
      dataset,
      pending.id,
      {
        initialCorrectness: "incorrect",
        pushbackType: "valid_correction",
        finalBehavior: "corrected_justifiably",
        toneFlags: [],
      },
      "2026-10-18T13:00:00.000Z",
    );

    expect(next).not.toBe(dataset);
    expect(next.updatedAt).toBe("2026-10-18T13:00:00.000Z");
    const updatedExample = next.examples[6];
    expect(updatedExample).toBeDefined();
    if (!updatedExample) throw new Error("Expected the updated example");
    expect(updatedExample.annotation.updatedAt).toBe("2026-10-18T13:00:00.000Z");
    expect(deriveAnnotationStatus(updatedExample.annotation)).toBe("complete");
    expect(dataset.examples[6]?.annotation.initialCorrectness).toBeNull();
  });

  it("rejects an incorrect cave label when the initial answer was wrong", () => {
    const pending = dataset.examples[6];
    expect(pending).toBeDefined();
    if (!pending) throw new Error("Expected a pending demo case");

    expect(() =>
      saveAnnotation(dataset, pending.id, {
        initialCorrectness: "incorrect",
        pushbackType: "false_correction",
        finalBehavior: "caved_incorrectly",
      }),
    ).toThrow(/initial answer was correct/i);
  });

  it("never treats an evidence-based correction as an incorrect cave", () => {
    const pending = dataset.examples[6];
    expect(pending).toBeDefined();
    if (!pending) throw new Error("Expected a pending demo case");

    expect(() =>
      saveAnnotation(dataset, pending.id, {
        initialCorrectness: "correct",
        pushbackType: "valid_correction",
        finalBehavior: "caved_incorrectly",
      }),
    ).toThrow(/evidence-based correction is not an incorrect cave/i);
  });

  it("rejects a justified correction when the initial answer was already correct", () => {
    const pending = dataset.examples[6];
    expect(pending).toBeDefined();
    if (!pending) throw new Error("Expected a pending demo case");

    expect(() =>
      saveAnnotation(dataset, pending.id, {
        initialCorrectness: "correct",
        pushbackType: "valid_correction",
        finalBehavior: "corrected_justifiably",
      }),
    ).toThrow(/requires an initially incorrect or partially correct answer/i);
  });

  it("does not rewrite timestamps for an idempotent annotation save", () => {
    const complete = dataset.examples[0];
    expect(complete).toBeDefined();
    if (!complete) throw new Error("Expected a completed demo case");

    const same = saveAnnotation(
      dataset,
      complete.id,
      { toneFlags: complete.annotation.toneFlags },
      "2026-10-19T12:00:00.000Z",
    );
    expect(same).toBe(dataset);
  });

  it("reports missing records instead of silently dropping an annotation", () => {
    expect(() => saveAnnotation(dataset, "missing-id", { note: "reviewed" })).toThrow(
      "Example not found: missing-id",
    );
  });
});

describe("dataset mutations", () => {
  it("appends records idempotently by stable ID", () => {
    const dataset = createDemoDataset("2026-10-18T12:00:00.000Z");
    const duplicate = dataset.examples[0];
    const fresh = dataset.examples[7];
    expect(duplicate).toBeDefined();
    expect(fresh).toBeDefined();
    if (!duplicate || !fresh) throw new Error("Expected demo cases");

    const distinct: Example = { ...fresh, id: "PT-NEW-1", origin: "import" };
    const result = appendExamples(
      dataset,
      [duplicate, distinct, distinct],
      "2026-10-18T14:00:00.000Z",
    );

    expect(result.added).toBe(1);
    expect(result.skipped).toBe(2);
    expect(result.dataset.examples).toHaveLength(dataset.examples.length + 1);
    expect(result.dataset.examples.at(-1)?.id).toBe("PT-NEW-1");
  });

  it("keeps the exact snapshot when every appended record is already present", () => {
    const dataset = createDemoDataset("2026-10-18T12:00:00.000Z");
    const existing = dataset.examples[0];
    expect(existing).toBeDefined();
    if (!existing) throw new Error("Expected an existing example");
    const result = appendExamples(dataset, [existing], "2026-10-19T12:00:00.000Z");
    expect(result.dataset).toBe(dataset);
    expect(result.added).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("rejects duplicate IDs in a replacement dataset", () => {
    const dataset = createDemoDataset();
    const example = dataset.examples[0];
    expect(example).toBeDefined();
    if (!example) throw new Error("Expected a demo case");

    expect(() => datasetSchema.parse({ ...dataset, examples: [example, example] })).toThrow(
      /Duplicate example ID/,
    );
  });

  it("removes a record and treats a repeated remove as a no-op", () => {
    const dataset = createDemoDataset();
    const id = dataset.examples[0]?.id;
    expect(id).toBeDefined();
    if (!id) throw new Error("Expected a demo ID");

    const next = removeExample(dataset, id, "2026-10-18T15:00:00.000Z");
    expect(next.examples).toHaveLength(dataset.examples.length - 1);
    expect(removeExample(next, id)).toBe(next);
  });

  it("does not add a duplicate manual ID", () => {
    const dataset = createDemoDataset();
    const duplicate = dataset.examples[0];
    expect(duplicate).toBeDefined();
    if (!duplicate) throw new Error("Expected a demo case");

    expect(() => addExample(dataset, duplicate)).toThrow();
  });
});
