import { describe, expect, it } from "vitest";
import { createDemoDataset } from "../data/demoDataset";
import { selectAnalytics } from "./analytics";

const dataset = createDemoDataset("2026-10-18T12:00:00.000Z");

describe("selectAnalytics", () => {
  it("uses completed annotations and exposes every rate denominator", () => {
    const analytics = selectAnalytics(dataset.examples);

    expect(analytics.totalCount).toBe(8);
    expect(analytics.completedCount).toBe(6);
    expect(analytics.incompleteCount).toBe(2);
    expect(analytics.caveCount).toBe(1);
    expect(analytics.caveRate).toBeCloseTo(1 / 5);
    expect(analytics.completedFlipShare).toBeCloseTo(1 / 6);
    expect(analytics.modelCaveRates).toEqual([
      {
        key: "Synthetic model B",
        label: "Synthetic model B",
        numerator: 0,
        denominator: 3,
        rate: 0,
      },
      {
        key: "Synthetic model A",
        label: "Synthetic model A",
        numerator: 1,
        denominator: 2,
        rate: 1 / 2,
      },
    ]);
    expect(
      analytics.pushbackCaveRates.find((metric) => metric.key === "authority_claim"),
    ).toMatchObject({
      numerator: 1,
      denominator: 2,
      rate: 0.5,
    });
  });

  it("measures over-apology only among completed, initially correct answers", () => {
    const analytics = selectAnalytics(dataset.examples);
    expect(analytics.correctAnswerCount).toBe(5);
    expect(analytics.overApologeticCount).toBe(2);
    expect(analytics.overApologeticRate).toBeCloseTo(2 / 5);
  });

  it("does not dilute cave rates with complete examples whose first answer was wrong", () => {
    const initiallyWrong = dataset.examples[4];
    expect(initiallyWrong).toBeDefined();
    if (!initiallyWrong) throw new Error("Expected a complete example");

    const analytics = selectAnalytics([initiallyWrong]);
    expect(analytics.completedCount).toBe(1);
    expect(analytics.correctAnswerCount).toBe(0);
    expect(analytics.caveCount).toBe(0);
    expect(analytics.caveRate).toBeNull();
    expect(analytics.completedFlipShare).toBe(0);
    expect(analytics.modelCaveRates[0]).toMatchObject({
      denominator: 0,
      rate: null,
    });
  });

  it("returns null rather than a false zero when there are no completed cases", () => {
    const analytics = selectAnalytics(dataset.examples.slice(6));
    expect(analytics.completedCount).toBe(0);
    expect(analytics.caveRate).toBeNull();
    expect(analytics.completedFlipShare).toBeNull();
    expect(analytics.modelCaveRates).toEqual([]);
    expect(analytics.pushbackCaveRates.every((metric) => metric.rate === null)).toBe(true);
    expect(analytics.overApologeticRate).toBeNull();
  });
});
