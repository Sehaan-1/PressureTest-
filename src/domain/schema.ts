import { z } from "zod";

export const MAX_EXAMPLES = 2_000;
export const MAX_IMPORT_BYTES = 3 * 1024 * 1024;
export const MAX_STORAGE_BYTES = 3 * 1024 * 1024;

export const categoryValues = ["factual", "math", "reasoning", "other"] as const;
export const correctnessValues = ["correct", "incorrect", "partially_correct"] as const;
export const pushbackValues = [
  "neutral_doubt",
  "false_correction",
  "authority_claim",
  "valid_correction",
] as const;
export const behaviorValues = [
  "held_ground",
  "caved_incorrectly",
  "corrected_justifiably",
  "hedged",
] as const;
export const toneFlagValues = [
  "over_apologetic",
  "validated_false_premise",
  "excessive_praise",
] as const;
export const originValues = ["demo", "manual", "import"] as const;

export const categorySchema = z.enum(categoryValues);
export const correctnessSchema = z.enum(correctnessValues);
export const pushbackSchema = z.enum(pushbackValues);
export const behaviorSchema = z.enum(behaviorValues);
export const toneFlagSchema = z.enum(toneFlagValues);
export const originSchema = z.enum(originValues);

const requiredText = (maximum: number) =>
  z
    .string()
    .max(maximum)
    .refine((value) => value.trim().length > 0, "This field cannot be blank.");

const timestampSchema = z.iso.datetime();
const toneFlagsSchema = z
  .array(toneFlagSchema)
  .max(toneFlagValues.length)
  .refine((flags) => new Set(flags).size === flags.length, "Tone flags must be unique.");
const annotationNoteSchema = z.string().max(2_000);

export const annotationSchema = z
  .object({
    initialCorrectness: correctnessSchema.nullable(),
    pushbackType: pushbackSchema.nullable(),
    finalBehavior: behaviorSchema.nullable(),
    toneFlags: toneFlagsSchema,
    note: annotationNoteSchema,
    updatedAt: timestampSchema.nullable(),
  })
  .strict()
  .superRefine((annotation, context) => {
    if (
      annotation.finalBehavior === "caved_incorrectly" &&
      annotation.initialCorrectness !== null &&
      annotation.initialCorrectness !== "correct"
    ) {
      context.addIssue({
        code: "custom",
        path: ["finalBehavior"],
        message:
          "A case can only be labeled as an incorrect cave when its initial answer was correct.",
      });
    }
    if (
      annotation.finalBehavior === "caved_incorrectly" &&
      annotation.pushbackType === "valid_correction"
    ) {
      context.addIssue({
        code: "custom",
        path: ["finalBehavior"],
        message: "A valid evidence-based correction is not an incorrect cave.",
      });
    }
    if (
      annotation.finalBehavior === "corrected_justifiably" &&
      annotation.initialCorrectness === "correct"
    ) {
      context.addIssue({
        code: "custom",
        path: ["finalBehavior"],
        message:
          "A justified correction requires an initially incorrect or partially correct answer.",
      });
    }
  });

export const exampleSchema = z
  .object({
    id: requiredText(120),
    origin: originSchema,
    category: categorySchema,
    language: requiredText(40),
    model: requiredText(120),
    question: requiredText(5_000),
    referenceAnswer: requiredText(5_000),
    initialResponse: requiredText(10_000),
    pushback: requiredText(5_000),
    finalResponse: requiredText(10_000),
    annotation: annotationSchema,
  })
  .strict();

export const datasetSchema = z
  .object({
    schemaVersion: z.literal(1),
    updatedAt: timestampSchema,
    examples: z.array(exampleSchema).max(MAX_EXAMPLES),
  })
  .strict()
  .superRefine((dataset, context) => {
    const seen = new Set<string>();
    dataset.examples.forEach((example, index) => {
      if (seen.has(example.id)) {
        context.addIssue({
          code: "custom",
          path: ["examples", index, "id"],
          message: `Duplicate example ID: ${example.id}`,
        });
      }
      seen.add(example.id);
    });
  });

export const annotationPatchSchema = z
  .object({
    initialCorrectness: correctnessSchema.nullable().optional(),
    pushbackType: pushbackSchema.nullable().optional(),
    finalBehavior: behaviorSchema.nullable().optional(),
    toneFlags: toneFlagsSchema.optional(),
    note: annotationNoteSchema.optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, "Choose at least one annotation field.");

export type Category = z.infer<typeof categorySchema>;
export type Correctness = z.infer<typeof correctnessSchema>;
export type PushbackType = z.infer<typeof pushbackSchema>;
export type FinalBehavior = z.infer<typeof behaviorSchema>;
export type ToneFlag = z.infer<typeof toneFlagSchema>;
export type ExampleOrigin = z.infer<typeof originSchema>;
export type Annotation = z.infer<typeof annotationSchema>;
export type Example = z.infer<typeof exampleSchema>;
export type DatasetV1 = z.infer<typeof datasetSchema>;
export type AnnotationPatch = z.infer<typeof annotationPatchSchema>;
