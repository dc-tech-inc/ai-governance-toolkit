import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";
import { exampleAssessment } from "../src/lib/example";
import { toJSON } from "../src/lib/io";
import { loadDraft } from "../src/lib/storage";

beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:test");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

const progress = () => screen.getByTestId("progress").textContent;

describe("App", () => {
  it("starts blank with zero sections complete and open items listed", () => {
    render(<App />);
    expect(progress()).toBe("0 of 7");
    expect(screen.getByText("Give the system a name.")).toBeInTheDocument();
  });

  it("loads the example and every section reports complete", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    expect(progress()).toBe("7 of 7");
    expect(screen.getByRole("status")).toHaveTextContent("Loaded the fictional example.");
    expect(screen.getByLabelText("System name")).toHaveValue("Reading Recommender (fictional)");
  });

  it("autosaves edits to local storage", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("System name"), "Demo");
    expect(loadDraft()?.overview.name).toBe("Demo");
  });

  it("asks before discarding the draft", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("System name"), "Demo");
    await user.click(screen.getByRole("button", { name: "Start blank" }));
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("System name")).toHaveValue("Demo");
    await user.click(screen.getByRole("button", { name: "Start blank" }));
    await user.click(screen.getByRole("button", { name: "Discard and start blank" }));
    expect(screen.getByLabelText("System name")).toHaveValue("");
  });

  it("walks the sections, adds uses, stakeholders and a harm, and shows the matrix", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Assessment sections" });

    await user.click(within(nav).getByRole("button", { name: /Uses and misuse/ }));
    await user.click(screen.getByRole("button", { name: "Add intended use" }));
    await user.click(screen.getByRole("button", { name: "Add foreseeable misuse" }));
    expect(screen.getAllByLabelText("Description")).toHaveLength(2);
    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]!);
    expect(screen.getAllByLabelText("Description")).toHaveLength(1);

    await user.click(within(nav).getByRole("button", { name: /Stakeholders/ }));
    await user.click(screen.getByRole("button", { name: "Add stakeholder" }));
    await user.type(screen.getByLabelText("Name or group"), "Patients");

    await user.click(within(nav).getByRole("button", { name: /Impacts/ }));
    await user.click(screen.getByRole("button", { name: "Add impact" }));
    await user.selectOptions(screen.getByLabelText("Severity (1-5)"), "5");
    await user.selectOptions(screen.getByLabelText("Likelihood (1-5)"), "5");
    expect(screen.getByText("Highest inherent: critical")).toBeInTheDocument();
    expect(screen.getByText(/is rated above low and has no mitigation/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Mitigation"), "Human review");
    await user.selectOptions(screen.getByLabelText("Residual severity"), "2");
    await user.selectOptions(screen.getByLabelText("Residual likelihood"), "1");
    expect(screen.getByText("Highest residual: low")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Kind"), "benefit");
    expect(screen.queryByLabelText("Mitigation")).not.toBeInTheDocument();
    expect(screen.getAllByRole("table")).toHaveLength(2);
  });

  it("exports JSON and Markdown through a download link", async () => {
    const user = userEvent.setup();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    await user.click(screen.getByRole("button", { name: "Export JSON" }));
    await user.click(screen.getByRole("button", { name: "Export Markdown" }));
    expect(click).toHaveBeenCalledTimes(2);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    click.mockRestore();
  });

  it("imports a valid file and rejects an invalid one with a clear message", async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText("Import assessment JSON file");
    await user.upload(input, new File([toJSON(exampleAssessment())], "a.json", { type: "application/json" }));
    expect(await screen.findByText("Imported a.json.")).toBeInTheDocument();
    expect(progress()).toBe("7 of 7");
    await user.upload(input, new File(["{nope"], "b.json", { type: "application/json" }));
    expect(await screen.findByText("Import failed: That file is not valid JSON.")).toBeInTheDocument();
    expect(progress()).toBe("7 of 7");
  });

  it("renders every section without crashing and marks the current one", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    const nav = screen.getByRole("navigation", { name: "Assessment sections" });
    for (const b of within(nav).getAllByRole("button")) {
      await user.click(b);
      expect(b).toHaveAttribute("aria-current", "page");
      expect(screen.getByText("Nothing open in this section.")).toBeInTheDocument();
    }
  });
  it("every field in every section writes through to the assessment", async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    const nav = screen.getByRole("navigation", { name: "Assessment sections" });
    for (const b of within(nav).getAllByRole("button")) {
      await user.click(b);
      for (const box of screen.queryAllByRole("textbox")) await user.type(box, "!");
      for (const check of screen.queryAllByRole("checkbox")) await user.click(check);
      for (const select of screen.queryAllByRole("combobox")) {
        const last = within(select).getAllByRole("option").at(-1)!;
        await user.selectOptions(select, last);
      }
    }
    const saved = loadDraft()!;
    expect(saved.overview.name.endsWith("!")).toBe(true);
    expect(saved.review.notes.endsWith("!")).toBe(true);
    expect(saved.stakeholders[0]!.vulnerabilityNotes.endsWith("!")).toBe(true);
    expect(saved.impacts[0]!.direction).toBe("harm");
    expect(saved.dataAndModel.usesPersonalData).toBe(false);
  }, 30_000);
});
