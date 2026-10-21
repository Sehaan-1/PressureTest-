import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createDemoDataset } from "../data/demoDataset";
import { serializeExamplesCsv } from "../domain/exchange";
import { App } from "./App";

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = "";
});

describe("PressureTest workbench", () => {
  it("starts with a clearly labeled local synthetic sample", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /does it hold its ground when you push back/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/these starter conversations are synthetic/i)).toBeInTheDocument();

    const saved = window.localStorage.getItem("pressuretest.dataset.v1");
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved ?? "{}").examples).toHaveLength(8);
  });

  it("shows the eligible cave denominator separately from the all-complete share", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Analysis" }));
    expect(
      await screen.findByRole("heading", { name: "What changes after the challenge?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cave rate among initially correct answers")).toBeInTheDocument();
    expect(screen.getByText("5 initially correct cases")).toBeInTheDocument();
    expect(screen.getByText(/Across all complete cases: 1 of 6 \(17%\)/)).toBeInTheDocument();
  });

  it("warns before discarding an unsaved annotation on navigation", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Annotation queue" }));
    await user.click(await screen.findByRole("radio", { name: /^Incorrect/i }));
    await user.click(screen.getByRole("button", { name: "Dataset" }));

    expect(confirm).toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Read the exchange. Make the call." }),
    ).toBeInTheDocument();
    const saved = JSON.parse(window.localStorage.getItem("pressuretest.dataset.v1") ?? "{}");
    const example = saved.examples.find((item: { id: string }) => item.id === "PT-DEMO-007");
    expect(example.annotation.initialCorrectness).toBeNull();
  });

  it("validates and appends a CSV file from the dataset page", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Dataset" }));
    const source = createDemoDataset("2026-10-19T12:00:00.000Z").examples[6];
    expect(source).toBeDefined();
    if (!source) throw new Error("Expected a demo example for the import fixture");
    const imported = {
      ...source,
      id: "PT-IMPORT-TEST-001",
      origin: "import" as const,
      model: "Imported test model",
      question: "Does a valid CSV row appear in the dataset?",
    };
    const file = new File([serializeExamplesCsv([imported])], "import-test.csv", {
      type: "text/csv",
    });
    await user.upload(screen.getByLabelText("Import CSV or JSON file"), file);

    expect(await screen.findByRole("dialog", { name: "Review import" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Append rows" }));
    expect(await screen.findByText(/1 added · 0 duplicate IDs skipped/i)).toBeInTheDocument();

    const saved = JSON.parse(window.localStorage.getItem("pressuretest.dataset.v1") ?? "{}");
    expect(saved.examples).toHaveLength(9);
    expect(
      saved.examples.some((example: { id: string }) => example.id === "PT-IMPORT-TEST-001"),
    ).toBe(true);
  });

  it("persists a completed annotation from the queue", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Annotation queue" }));
    await screen.findByText("Code the response");
    await user.click(await screen.findByRole("radio", { name: /^Incorrect/i }));
    await user.click(screen.getByRole("radio", { name: /Valid correction/i }));
    await user.click(screen.getByRole("radio", { name: /^Corrected justifiably/i }));
    await user.click(screen.getByRole("button", { name: "Save annotation" }));

    expect(await screen.findByText("Annotation saved to this browser.")).toBeInTheDocument();
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem("pressuretest.dataset.v1") ?? "{}");
      const example = saved.examples.find((item: { id: string }) => item.id === "PT-DEMO-007");
      expect(example.annotation).toMatchObject({
        initialCorrectness: "incorrect",
        pushbackType: "valid_correction",
        finalBehavior: "corrected_justifiably",
      });
    });
  });

  it("records browser storage consent choices with equal-prominence controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText(/browser storage notice: zero tracking cookies/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Essential storage only" }));

    expect(
      screen.queryByText(/browser storage notice: zero tracking cookies/i),
    ).not.toBeInTheDocument();
    const consent = JSON.parse(window.localStorage.getItem("pressuretest.consent.v1") ?? "{}");
    expect(consent.level).toBe("essential_only");

    await user.click(screen.getByRole("button", { name: "Storage consent" }));
    expect(screen.getByText(/browser storage notice: zero tracking cookies/i)).toBeInTheDocument();
  });

  it("renders legal and compliance policy views and supports local data erasure", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Policies & legal" }));
    expect(
      await screen.findByRole("heading", { name: "Policies, legal terms, and compliance" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sehaan Ur Rahman (@Sehaan-1)")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Terms & conditions" }));
    expect(screen.getByText(/SIL Open Font License 1\.1/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Accessibility & laws" }));
    expect(screen.getByText(/Accessibility statement \(WCAG 2\.1 AA\)/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Cookies & storage" }));
    await user.click(screen.getByRole("button", { name: "Erase all local data" }));
    expect(
      await screen.findByText("All browser storage data has been erased from this workspace."),
    ).toBeInTheDocument();
  });

  it("enforces explicit form consent and warns on sensitive input when adding a conversation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Dataset" }));
    await user.click(screen.getByRole("button", { name: "Add conversation" }));
    await screen.findByRole("dialog", { name: "Add a conversation" });

    await user.type(screen.getByLabelText(/^Model name/i), "Local eval model");
    await user.type(
      screen.getByLabelText(/^Original question/i),
      "Contact nina.patel@research-lab.in about boiling water?",
    );
    await user.type(screen.getByLabelText(/^Reference answer/i), "100 C");
    await user.type(screen.getByLabelText(/^Model first answer/i), "100 C at 1 atm.");
    await user.type(screen.getByLabelText(/^User pushback/i), "Are you certain it is not 90 C?");
    await user.type(screen.getByLabelText(/^Model final answer/i), "Yes, 100 C at sea level.");

    expect(screen.getByText(/contains an email address/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save conversation" }));
    expect(
      screen.getByText(/please confirm data minimization and local browser storage consent/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", {
        name: /i confirm this transcript excludes personal data and api keys/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Save conversation" }));
    expect(
      await screen.findByText("Conversation added to the annotation queue."),
    ).toBeInTheDocument();
  });

  it("supports keyboard Ctrl+Enter saving inside the annotation form", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Annotation queue" }));
    await user.click(await screen.findByRole("radio", { name: /^Incorrect/i }));
    const noteBox = screen.getByLabelText(/annotator note/i);
    fireEvent.keyDown(noteBox, { key: "Enter", ctrlKey: true });

    expect(await screen.findByText("Annotation saved to this browser.")).toBeInTheDocument();
  });
});
