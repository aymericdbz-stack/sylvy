import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = process.env.OUT_DIR ?? path.resolve("tmp");
const OUT_PDF = process.env.OUT_PDF ?? path.join(OUT_DIR, "export.pdf");
const OUT_LOGIN_PNG = process.env.OUT_LOGIN_PNG ?? path.join(OUT_DIR, "login-required.png");
const OUT_NOTEBOOK_PNG = process.env.OUT_NOTEBOOK_PNG ?? path.join(OUT_DIR, "notebook.png");
const OUT_NOTEBOOK_AFTER_CLICK_PNG =
  process.env.OUT_NOTEBOOK_AFTER_CLICK_PNG ?? path.join(OUT_DIR, "notebook-after-click.png");

const RESULTS_TEXT = "asdsfgf";
const COMMENTS_TEXT = "szdfxgc";

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function waitUntilEnabled(locator, { timeoutMs = 15000, stepMs = 100 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (await locator.isEnabled()) return;
    if (Date.now() - start > timeoutMs) throw new Error("Timed out waiting for element to be enabled");
    await new Promise((r) => setTimeout(r, stepMs));
  }
}

async function clickFirstIfExists(locator, { timeoutMs = 1500 } = {}) {
  try {
    const first = locator.first();
    await first.waitFor({ state: "visible", timeout: timeoutMs });
    await first.click();
    return true;
  } catch {
    return false;
  }
}

function summarizeBool(label, value) {
  return `${label}=${value ? "yes" : "no"}`;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  if (await fileExists(OUT_PDF)) await fs.unlink(OUT_PDF);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  const result = {
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

    // Navigate to Notebook.
    await page.goto(`${BASE_URL.replace(/\/$/, "")}/notebook`, { waitUntil: "domcontentloaded" });

    // If unauthenticated, /notebook typically redirects to a login/auth page or shows a password field.
    const afterNotebookUrl = page.url();
    const passwordInput = page.locator('input[type="password"]');
    if (/\/(login|auth)\b/i.test(afterNotebookUrl) || (await passwordInput.count()) > 0) {
      result.loginRequired = true;
      await page.screenshot({ path: OUT_LOGIN_PNG, fullPage: true });
      result.notes.push(`Login required to access /notebook; screenshot saved to ${OUT_LOGIN_PNG}`);
      return result;
    }

    // Best-effort: extract Supabase auth user id from localStorage (without exfiltrating tokens).
    try {
      const authUserId = await page.evaluate(() => {
        const b64urlToJson = (b64url) => {
          const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
          const json = atob(b64);
          return JSON.parse(json);
        };

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key || !key.startsWith("sb-")) continue;
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            const token = parsed?.access_token;
            if (typeof token !== "string") continue;
            const parts = token.split(".");
            if (parts.length < 2) continue;
            const payload = b64urlToJson(parts[1]);
            if (payload?.sub) return payload.sub;
          } catch {
            // ignore this key
          }
        }
        return null;
      });
      if (authUserId) result.notes.push(`Detected authenticated user id (sub): ${authUserId}`);
      else result.notes.push("Could not extract authenticated user id from localStorage.");
    } catch {
      result.notes.push("Failed to inspect localStorage for auth user id.");
    }

    await page.screenshot({ path: OUT_NOTEBOOK_PNG, fullPage: true });

    // Expand first project, then first experiment set, then click first manipulation.
    const projectExpandButtons = page.locator('button[aria-expanded]');
    const expandedPanel = page.locator("div.border-t.border-nb-cream-border.bg-nb-cream-light");

    if (!(await clickFirstIfExists(projectExpandButtons, { timeoutMs: 8000 }))) {
      result.notes.push("Could not find any expandable project rows on /notebook.");
      return result;
    }

    await page.screenshot({ path: OUT_NOTEBOOK_AFTER_CLICK_PNG, fullPage: true });

    try {
      await expandedPanel.first().waitFor({ state: "visible", timeout: 8000 });
    } catch {
      result.notes.push(
        `Clicked first aria-expanded button but did not see expanded project panel. ` +
          `Screenshots: ${OUT_NOTEBOOK_PNG} and ${OUT_NOTEBOOK_AFTER_CLICK_PNG}`,
      );
      return result;
    }

    const experimentExpandButtons = expandedPanel.locator('button[aria-expanded]');
    if (!(await clickFirstIfExists(experimentExpandButtons, { timeoutMs: 8000 }))) {
      result.notes.push("Expanded a project, but could not find any experiment set rows to expand.");
      return result;
    }

    const firstManipulationLink = expandedPanel.locator('a[href^="/experiments/"]').first();
    await firstManipulationLink.waitFor({ state: "visible", timeout: 8000 });
    await firstManipulationLink.click();

    await page.waitForURL(/\/experiments\/[^/]+$/, { timeout: 15000 });
    result.reachedExperimentUrl = page.url();

    const exportButton = page.getByRole("button", { name: /export pdf/i });
    result.exportButtonFound = (await exportButton.count()) > 0;
    if (!result.exportButtonFound) {
      result.notes.push("Export PDF button not found on experiment page (maybe experiment has no report).");
      return result;
    }

    const resultsTextarea = page.locator('textarea[placeholder="Enter your results..."]');
    const commentsTextarea = page.locator('textarea[placeholder="Enter your comments..."]');

    await resultsTextarea.waitFor({ state: "visible", timeout: 15000 });
    await commentsTextarea.waitFor({ state: "visible", timeout: 15000 });
    await waitUntilEnabled(resultsTextarea);
    await waitUntilEnabled(commentsTextarea);

    // Fill and immediately export (no delay between last input and export click).
    await resultsTextarea.fill(RESULTS_TEXT);
    await commentsTextarea.fill(COMMENTS_TEXT);

    let download;
    try {
      [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 15000 }),
        exportButton.click(),
      ]);
    } catch (e) {
      result.notes.push(`No download event observed after clicking Export PDF (${String(e)})`);
    }

    if (download) {
      await download.saveAs(OUT_PDF);
      result.downloadSucceeded = true;

      const pdfBytes = await fs.readFile(OUT_PDF);
      const parser = new PDFParse(pdfBytes);
      await parser.load();
      const text = (await parser.getText()) ?? "";

      result.pdfTextContainsResults = text.includes(RESULTS_TEXT);
      result.pdfTextContainsComments = text.includes(COMMENTS_TEXT);

      const idx = Math.max(text.indexOf(RESULTS_TEXT), text.indexOf(COMMENTS_TEXT));
      if (idx >= 0) {
        result.pdfTextSnippet = text.slice(Math.max(0, idx - 80), Math.min(text.length, idx + 160));
      }
    }

    // Fallback check (also useful as an additional signal): refresh and read textareas.
    await page.reload({ waitUntil: "domcontentloaded" });
    await resultsTextarea.waitFor({ state: "visible", timeout: 15000 });
    await commentsTextarea.waitFor({ state: "visible", timeout: 15000 });
    result.fallbackAfterRefreshResults = await resultsTextarea.inputValue();
    result.fallbackAfterRefreshComments = await commentsTextarea.inputValue();

    result.notes.push(
      [
        summarizeBool("exportButtonFound", result.exportButtonFound),
        summarizeBool("downloadSucceeded", result.downloadSucceeded),
        summarizeBool("pdfHasResults", result.pdfTextContainsResults),
        summarizeBool("pdfHasComments", result.pdfTextContainsComments),
      ].join(" "),
    );

    return result;
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main()
  .then((r) => {
    // Print as JSON for easy grepping in CI/terminal output.
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(r, null, 2));
    if (r.loginRequired) process.exitCode = 2;
    else if (r.downloadSucceeded && r.pdfTextContainsResults && r.pdfTextContainsComments) process.exitCode = 0;
    else process.exitCode = 1;
  })
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  });

