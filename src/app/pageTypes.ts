export const pages = [
  "overview",
  "annotate",
  "dataset",
  "analysis",
  "guidelines",
  "legal",
] as const;
export type PageId = (typeof pages)[number];

export const legalTabs = ["privacy", "terms", "cookies", "refunds", "accessibility"] as const;
export type LegalTabId = (typeof legalTabs)[number];

export const pageLabels: Record<PageId, string> = {
  overview: "Overview",
  annotate: "Annotation queue",
  dataset: "Dataset",
  analysis: "Analysis",
  guidelines: "Guidelines",
  legal: "Policies & legal",
};

export const legalTabLabels: Record<LegalTabId, string> = {
  privacy: "Privacy policy",
  terms: "Terms & conditions",
  cookies: "Cookies & storage",
  refunds: "Refund policy",
  accessibility: "Accessibility & laws",
};

export interface RouteState {
  page: PageId;
  legalTab: LegalTabId;
}

export function parseRouteHash(hash: string): RouteState {
  const raw = hash.replace(/^#\/?/, "").trim().toLowerCase();
  if ((legalTabs as readonly string[]).includes(raw)) {
    return { page: "legal", legalTab: raw as LegalTabId };
  }
  if ((pages as readonly string[]).includes(raw)) {
    return { page: raw as PageId, legalTab: "privacy" };
  }
  return { page: "overview", legalTab: "privacy" };
}

export function formatRouteHash(page: PageId, legalTab: LegalTabId = "privacy"): string {
  if (page === "legal") return `#${legalTab}`;
  return `#${page}`;
}
