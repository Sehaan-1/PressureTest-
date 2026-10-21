export const pages = ["overview", "annotate", "dataset", "analysis", "guidelines"] as const;
export type PageId = (typeof pages)[number];

export const pageLabels: Record<PageId, string> = {
  overview: "Overview",
  annotate: "Annotation queue",
  dataset: "Dataset",
  analysis: "Analysis",
  guidelines: "Guidelines",
};
