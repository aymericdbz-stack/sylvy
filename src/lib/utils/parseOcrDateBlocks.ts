import type { OcrDateBlock } from "@/lib/types/labProcess";

// Matches common lab notebook date formats:
// DD/MM/YYYY, MM/DD/YYYY, DD.MM.YY, YYYY-MM-DD
// Feb 24 2026, February 24 2026, February 24, 2026
// 24 Feb 2026, 24 February 2026
const DATE_REGEX =
  /\b(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}|\d{4}[\/\.\-]\d{2}[\/\.\-]\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,?\s+\d{2,4})?|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:,?\s+\d{2,4})?)\b/gi;

function extractFirstDate(line: string): string | null {
  DATE_REGEX.lastIndex = 0;
  const match = DATE_REGEX.exec(line);
  return match ? match[0] : null;
}

export function parseOcrIntoDateBlocks(markdown: string): OcrDateBlock[] {
  const lines = markdown.split("\n");
  const blocks: OcrDateBlock[] = [];
  let currentDate: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const date = extractFirstDate(line);
    if (date) {
      // Flush the current block
      if (currentLines.length > 0 || currentDate !== null) {
        blocks.push({ date: currentDate, text: currentLines.join("\n").trim() });
      }
      // Start a new block — include the rest of the line (minus the date) as text
      currentDate = date;
      const rest = line.replace(date, "").replace(/^[\s:\-–—]+/, "").trim();
      currentLines = rest ? [rest] : [];
    } else {
      currentLines.push(line);
    }
  }

  // Flush last block
  if (currentLines.length > 0 || currentDate !== null) {
    blocks.push({ date: currentDate, text: currentLines.join("\n").trim() });
  }

  // If nothing was parsed, return all text as one undated block
  if (blocks.length === 0) {
    return [{ date: null, text: markdown.trim() }];
  }

  return blocks;
}
