import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const shots = "docs/screenshots";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("blank start, load the fictional example, review the impacts", async ({ page }) => {
  await expect(page.getByTestId("progress")).toHaveText("0 of 7");
  await page.screenshot({ path: `${shots}/01-blank.png`, animations: "disabled" });

  await page.getByRole("button", { name: "Load example" }).click();
  await expect(page.getByTestId("progress")).toHaveText("7 of 7");

  await page.getByRole("button", { name: /Impacts/ }).click();
  await expect(page.getByText("Highest inherent: high")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(2);
  await page.screenshot({ path: `${shots}/02-impacts.png`, fullPage: true, animations: "disabled" });
});

test("exports JSON and Markdown that match what is on screen", async ({ page }) => {
  await page.getByRole("button", { name: "Load example" }).click();

  const [json] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export JSON" }).click()]);
  expect(json.suggestedFilename()).toBe("reading-recommender-fictional.json");
  const parsed = JSON.parse(await readFile((await json.path())!, "utf8")) as { overview: { name: string }; impacts: unknown[] };
  expect(parsed.overview.name).toBe("Reading Recommender (fictional)");
  expect(parsed.impacts).toHaveLength(4);

  const [md] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export Markdown" }).click()]);
  const text = await readFile((await md.path())!, "utf8");
  expect(text).toContain("# AI system impact assessment: Reading Recommender (fictional)");
  expect(text).toContain("not a certification");
});

test("round trip: export, start blank, import brings the assessment back", async ({ page }) => {
  await page.getByRole("button", { name: "Load example" }).click();
  const [json] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export JSON" }).click()]);
  const file = (await json.path())!;

  await page.getByRole("button", { name: "Start blank" }).click();
  await page.getByRole("button", { name: "Discard and start blank" }).click();
  await expect(page.getByTestId("progress")).toHaveText("0 of 7");

  await page.getByLabel("Import assessment JSON file").setInputFiles(file);
  await expect(page.getByRole("status")).toContainText("Imported");
  await expect(page.getByTestId("progress")).toHaveText("7 of 7");
});

test("a draft survives a reload", async ({ page }) => {
  await page.getByLabel("System name").fill("Persistent demo");
  await page.reload();
  await expect(page.getByLabel("System name")).toHaveValue("Persistent demo");
});

test("a broken file is rejected without losing the draft", async ({ page }) => {
  await page.getByLabel("System name").fill("Keep me");
  await page.getByLabel("Import assessment JSON file").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("{nope") });
  await expect(page.getByRole("status")).toContainText("Import failed");
  await expect(page.getByLabel("System name")).toHaveValue("Keep me");
});

test("usable at phone width without horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole("button", { name: "Load example" }).click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.screenshot({ path: `${shots}/03-mobile.png`, animations: "disabled" });
});

test("dark scheme renders and keeps the focus ring visible", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("button", { name: "Load example" }).focus();
  const outline = await page.getByRole("button", { name: "Load example" }).evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).toBe("solid");
  await page.screenshot({ path: `${shots}/04-dark.png`, animations: "disabled" });
});
