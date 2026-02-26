import { test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import pdfParse from "pdf-parse";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = process.env.OUT_DIR ?? path.resolve("tmp");
const OUT_JSON = process.env.OUT_JSON ?? path.join(OUT_DIR, "verify-export-result.json");
const OUT_PDF = process.env.OUT_PDF ?? path.join(OUT_DIR, "export.pdf");
const OUT_LOGIN_PNG = process.env.OUT_LOGIN_PNG ?? path.join(OUT_DIR, "login-required.png");

const RESULTS_TEXT = "asdsfgf";
const COMMENTS_TEXT = "szdfxgc";

async function safeUnlink(p: string) {
  try {
    await fs.unlink(p);
  } catch {
    // ignore
  }
}

test("Results/Comments typed before export appear in exported PDF", async ({ page }) => {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await safeUnlink(OUT_JSON);
  await safeUnlink(OUT_PDF);

  const result: {
    baseUrl: string;
    landedUrl: string | null;
    reachedExperimentUrl: string | null;
    loginRequired: boolean;
    exportButtonFound: boolean;
    downloadSucceeded: boolean;
    pdfTextContainsResults: boolean;
    pdfTextContainsComments: boolean;
    pdfTextSnippet: string | null;
    fallbackAfterRefreshResults: string | null;
    fallbackAfterRefreshComments: string | null;
    notes: string[];
  } = {
    baseUrl: BASE_URL,
    landedUrl: null,
    reachedExperimentUrl: null,
    loginRequired: false,
    exportButtonFound: false,
    downloadSucceeded: false,
    pdfTextContainsResults: false,
    pdfTextContainsComments: false,
    pdfTextSnippet: null,
    fallbackAfterRefreshResults: null,
    fallbackAfterRefreshComments: null,
    notes: [],
  };

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    result.landedUrl = page.url();

    const passwordInput = page.locator('input[type="password"]');
    const signInText = page.getByText(/sign in|log in/i).first();
    if ((await passwordInput.count()) > 0 || (await signInText.count()) > 0) {
      result.loginRequired = true;
      await page.screenshot({ path: OUT_LOGIN_PNG, fullPage: true });
      result.notes.push(`Login UI detected; screenshot saved to ${OUT_LOGIN_PNG}`);
      return;
    }

    await page.goto(`${BASE_URL.replace(/\/$/, "")}/notebook`, { waitUntil: "domcontentloaded" });

    // Expand first project.
    const projectExpandButtons = page.locator('button[aria-expanded]');
    await projectExpandButtons.first().click();

    // Expand first experiment set inside expanded panel.
    const expandedPanel = page.locator("div.border-t.border-nb-cream-border.bg-nb-cream-light").first();
    await expandedPanel.waitFor({ state: "visible", timeout: 8000 });
    await expandedPanel.locator('button[aria-expanded]').first().click();

    // Click first manipulation → experiment detail page.
    const firstManipulationLink = expandedPanel.locator('a[href^="/experiments/"]').first();
    await firstManipulationLink.waitFor({ state: "visible", timeout: 8000 });
    await firstManipulationLink.click();
    await page.waitForURL(/\/experiments\/[^/]+$/, { timeout: 15000 });
    result.reachedExperimentUrl = page.url();

    const exportButton = page.getByRole("button", { name: /export pdf/i });
    result.exportButtonFound = (await exportButton.count()) > 0;
    if (!result.exportButtonFound) {
      result.notes.push("Export PDF button not found on experiment page (maybe this experiment has no report).");
      return;
    }

    const resultsTextarea = page.locator('textarea[placeholder="Enter your results..."]');
    const commentsTextarea = page.locator('textarea[placeholder="Enter your comments..."]');
    await resultsTextarea.waitFor({ state: "visible", timeout: 15000 });
    await commentsTextarea.waitFor({ state: "visible", timeout: 15000 });
    await resultsTextarea.waitFor({ state: "attached" });
    await commentsTextarea.waitFor({ state: "attached" });
    await resultsTextarea.waitFor({ state: "visible" });
    await commentsTextarea.waitFor({ state: "visible" });
    await resultsTextarea.waitFor({ state: "visible" });

    // Ensure editor finished init (textareas are disabled until ready).
    await page.waitForFunction(
      (el) => !(el instanceof HTMLTextAreaElement) || !el.disabled,
      await resultsTextarea.elementHandle(),
      { timeout: 15000 },
    );
    await page.waitForFunction(
      (el) => !(el instanceof HTMLTextAreaElement) || !el.disabled,
      await commentsTextarea.elementHandle(),
      { timeout: 15000 },
    );

    // Type then immediately export (no delay between input and click).
    await resultsTextarea.fill(RESULTS_TEXT);
    await commentsTextarea.fill(COMMENTS_TEXT);

    let downloadPath: string | null = null;
    try {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 15000 }),
        exportButton.click(),
      ]);
      downloadPath = OUT_PDF;
      await download.saveAs(downloadPath);
      result.downloadSucceeded = true;
    } catch (e) {
      result.notes.push(`No download observed after clicking Export PDF: ${String(e)}`);
    }

    if (downloadPath) {
      const pdfBytes = await fs.readFile(downloadPath);
      const parsed = await pdfParse(pdfBytes);
      const text = parsed.text ?? "";
      result.pdfTextContainsResults = text.includes(RESULTS_TEXT);
      result.pdfTextContainsComments = text.includes(COMMENTS_TEXT);

      const idx = Math.max(text.indexOf(RESULTS_TEXT), text.indexOf(COMMENTS_TEXT));
      if (idx >= 0) {
        result.pdfTextSnippet = text.slice(Math.max(0, idx - 80), Math.min(text.length, idx + 160));
      }
    }

    // Fallback signal: refresh and confirm fields persist.
    await page.reload({ waitUntil: "domcontentloaded" });
    await resultsTextarea.waitFor({ state: "visible", timeout: 15000 });
    await commentsTextarea.waitFor({ state: "visible", timeout: 15000 });
    result.fallbackAfterRefreshResults = await resultsTextarea.inputValue();
    result.fallbackAfterRefreshComments = await commentsTextarea.inputValue();
  } finally {
    await fs.writeFile(OUT_JSON, JSON.stringify(result, null, 2), "utf8");
    // eslint-disable-next-line no-console
    console.log(`Wrote ${OUT_JSON}`);
    // eslint-disable-next-line no-console
    console.log(result);
  }
});

