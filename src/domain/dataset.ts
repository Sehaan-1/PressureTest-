import {
  annotationPatchSchema,
  annotationSchema,
  datasetSchema,
  exampleSchema,
  MAX_EXAMPLES,
  type Annotation,
  type AnnotationPatch,
  type DatasetV1,
  type Example,
} from "./schema";

export type AnnotationStatus = "pending" | "in_progress" | "complete";

export function deriveAnnotationStatus(annotation: Annotation): AnnotationStatus {
  const requiredLabels = [
    annotation.initialCorrectness,
    annotation.pushbackType,
    annotation.finalBehavior,
  ];
  const completedCount = requiredLabels.filter((value) => value !== null).length;

  if (completedCount === 0) return "pending";
  if (completedCount === requiredLabels.length) return "complete";
  return "in_progress";
}

export function createDataset(examples: Example[], now = new Date().toISOString()): DatasetV1 {
  return datasetSchema.parse({
    schemaVersion: 1,
    updatedAt: now,
    examples,
  });
}

export function appendExamples(
  current: DatasetV1,
  incoming: Example[],
  now = new Date().toISOString(),
): { dataset: DatasetV1; added: number; skipped: number } {
  const validatedIncoming = incoming.map((example) => exampleSchema.parse(example));
  const seenIds = new Set(current.examples.map((example) => example.id));
  const newExamples: Example[] = [];
  let skipped = 0;

  for (const example of validatedIncoming) {
    if (seenIds.has(example.id)) {
      skipped += 1;
      continue;
    }
    seenIds.add(example.id);
    newExamples.push(example);
  }

  if (newExamples.length === 0) {
    return { dataset: current, added: 0, skipped };
  }

  if (current.examples.length + newExamples.length > MAX_EXAMPLES) {
    throw new RangeError(`A dataset cannot contain more than ${MAX_EXAMPLES} examples.`);
  }

  return {
    dataset: createDataset([...current.examples, ...newExamples], now),
    added: newExamples.length,
    skipped,
  };
}

export function replaceExamples(examples: Example[], now = new Date().toISOString()): DatasetV1 {
  const validatedExamples = examples.map((example) => exampleSchema.parse(example));
  return createDataset(validatedExamples, now);
}

export function addExample(
  current: DatasetV1,
  example: Example,
  now = new Date().toISOString(),
): DatasetV1 {
  if (current.examples.some((existing) => existing.id === example.id)) {
    throw new Error(`Example ID already exists: ${example.id}`);
  }
  return appendExamples(current, [example], now).dataset;
}

export function removeExample(
  current: DatasetV1,
  exampleId: string,
  now = new Date().toISOString(),
): DatasetV1 {
  const examples = current.examples.filter((example) => example.id !== exampleId);
  if (examples.length === current.examples.length) return current;
  return createDataset(examples, now);
}

export function saveAnnotation(
  current: DatasetV1,
  exampleId: string,
  patch: AnnotationPatch,
  now = new Date().toISOString(),
): DatasetV1 {
  const validatedPatch = annotationPatchSchema.parse(patch);
  const index = current.examples.findIndex((example) => example.id === exampleId);
  if (index === -1) throw new Error(`Example not found: ${exampleId}`);

  const example = current.examples[index];
  if (!example) throw new Error(`Example not found: ${exampleId}`);

  const changed = Object.entries(validatedPatch).some(([key, value]) => {
    const currentValue = example.annotation[key as keyof Annotation];
    return JSON.stringify(currentValue) !== JSON.stringify(value);
  });
  if (!changed) return current;

  const annotation = annotationSchema.parse({
    ...example.annotation,
    ...validatedPatch,
    updatedAt: now,
  });
  const examples = [...current.examples];
  examples[index] = { ...example, annotation };
  return createDataset(examples, now);
}
