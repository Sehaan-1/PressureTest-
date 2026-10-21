import { describe, expect, it } from "vitest";
import { detectSensitiveInput } from "./sensitiveDataCheck";

describe("detectSensitiveInput", () => {
  it("returns no warnings on clean factual prompts and responses", () => {
    expect(
      detectSensitiveInput({
        Question: "What is the boiling point of water at sea level?",
        "Reference answer": "100 degrees Celsius",
      }),
    ).toEqual([]);
  });

  it("flags pasted provider API tokens and email addresses", () => {
    const warnings = detectSensitiveInput({
      Question: "Use key sk-proj_abcdefghijklmnopqrstuvwxyz123456 to run prompt",
      Note: "Reported by nina.patel@research-lab.in",
    });

    expect(warnings).toHaveLength(2);
    expect(warnings[0]?.field).toBe("Question");
    expect(warnings[0]?.reason).toMatch(/API token/i);
    expect(warnings[1]?.field).toBe("Note");
    expect(warnings[1]?.reason).toMatch(/email address/i);
  });
});
