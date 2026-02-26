"use client";

import { useState } from "react";
import type { ExperimentFile, ReportBlock } from "@/lib/supabase/types";
import type { LabBlockPayload } from "@/lib/types/labProcess";
import Button from "@/components/ui/nb/Button";
import { createClient } from "@/lib/supabase/client";
import sylvyNoteSrc from "../../../logo/Sylvy note.webp";

interface ExportPdfButtonProps {
  experimentId: string;
  experimentName: string;
  createdAt: string;
  blocks: ReportBlock[];
  project: string | null;
  protocolName: string | null;
  sampleName: string | null;
  templateTitle: string | null;
  createdBy: string | null;
  experimentCreatedAt: string;
  initialFiles: ExperimentFile[];
}

// Group report blocks by their heading. Returns an array of { heading, blocks } groups.
function groupBlocksByHeading(blocks: ReportBlock[]): Array<{ heading: string | null; items: ReportBlock[] }> {
  const groups: Array<{ heading: string | null; items: ReportBlock[] }> = [];
  let current: { heading: string | null; items: ReportBlock[] } = { heading: null, items: [] };

  for (const block of blocks) {
    if (block.type === "heading") {
      if (current.items.length > 0 || current.heading !== null) {
        groups.push(current);
      }
      current = { heading: block.content ?? "", items: [] };
    } else {
      current.items.push(block);
    }
  }

  if (current.items.length > 0 || current.heading !== null) {
    groups.push(current);
  }

  return groups;
}

function isResultsHeading(h: string | null): boolean {
  return h !== null && /result/i.test(h);
}

function isCommentsHeading(h: string | null): boolean {
  return h !== null && /comment/i.test(h);
}

export default function ExportPdfButton({
  experimentId,
  experimentName,
  createdAt,
  blocks,
  project,
  protocolName,
  sampleName,
  // templateTitle and createdBy are intentionally omitted from the PDF
  experimentCreatedAt,
  initialFiles,
}: ExportPdfButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

      // Flush any pending debounced saves (e.g. Results/Comments) before fetching blocks.
      if (typeof window !== "undefined") {
        const flushes: Array<Promise<void>> = [];
        window.dispatchEvent(
          new CustomEvent("sylvy:reportBlocksFlush", {
            detail: {
              experimentId,
              add: (p: Promise<void>) => flushes.push(p),
            },
          }),
        );
        if (flushes.length > 0) {
          await Promise.allSettled(flushes);
        }
      }

      const supabase = createClient();

      // Always fetch the latest raw data files so newly uploaded items are included.
      let files: ExperimentFile[] = initialFiles;
      try {
        const { data, error } = await supabase
          .from("experiment_files")
          .select("*")
          .eq("experiment_id", experimentId)
          .order("uploaded_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          files = data as ExperimentFile[];
        }
      } catch {
        // Fall back to initialFiles on any fetch error.
      }

      // Always fetch the latest report blocks so Results/Comments edits are included.
      // Fetch report id first, then report_blocks in a separate query so we reliably
      // get all blocks (including Results/Comments text content) that the editor saves.
      let latestBlocks: ReportBlock[] = blocks;
      try {
        const { data: reportRow } = await supabase
          .from("reports")
          .select("id")
          .eq("experiment_id", experimentId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (reportRow?.id) {
          const { data: blocksData } = await supabase
            .from("report_blocks")
            .select("*")
            .eq("report_id", reportRow.id)
            .order("order", { ascending: true });

          if (blocksData && Array.isArray(blocksData) && blocksData.length > 0) {
            latestBlocks = blocksData as ReportBlock[];
          }
        }
      } catch {
        // Fall back to initial blocks on any fetch error.
      }

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Attempt to embed the Sylvy note logo (WebP → PNG via canvas).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let logoEmbed: any = null;
      try {
        const logoUrl = (sylvyNoteSrc as { src: string }).src;
        const logoImg = new window.Image();
        logoImg.crossOrigin = "anonymous";
        await new Promise<void>((res, rej) => {
          logoImg.onload = () => res();
          logoImg.onerror = () => rej(new Error("logo load failed"));
          logoImg.src = logoUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = logoImg.naturalWidth;
        canvas.height = logoImg.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(logoImg, 0, 0);
          const pngBytes = await new Promise<ArrayBuffer>((res) =>
            canvas.toBlob((b) => b!.arrayBuffer().then(res), "image/png"),
          );
          logoEmbed = await pdfDoc.embedPng(new Uint8Array(pngBytes));
        }
      } catch {
        // Fall back to text-only header.
      }

      const margin = 60;
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;

      let pageNumber = 0;
      let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      let { width, height } = page.getSize();
      let y = height - margin;

      const lineHeight = 16;
      const primary = rgb(0, 0.675, 0.451); // #00ac73
      const headerFooterBg = rgb(0.878, 0.973, 0.925);

      type PageKind = "DETAILS" | "RAW DATA";
      let currentPageKind: PageKind = "DETAILS";

      const drawHeader = (kind: PageKind) => {
        const headerHeight = 40;
        page.drawRectangle({
          x: 0,
          y: height - headerHeight,
          width,
          height: headerHeight,
          color: headerFooterBg,
        });

        if (logoEmbed) {
          const logoH = 24;
          const logoW = (logoEmbed.width / logoEmbed.height) * logoH;
          page.drawImage(logoEmbed, {
            x: margin,
            y: height - headerHeight / 2 - logoH / 2,
            width: logoW,
            height: logoH,
          });
        } else {
          // Text-only fallback (no tagline)
          page.drawText("Sylvy", {
            x: margin,
            y: height - headerHeight / 2 - 4,
            size: 20,
            font: boldFont,
            color: primary,
          });
        }

        const tag = kind === "RAW DATA" ? "RAW DATA" : "DETAILS";
        const tagSize = 10;
        const tagWidth = boldFont.widthOfTextAtSize(tag, tagSize);
        page.drawText(tag, {
          x: width - margin - tagWidth,
          y: height - headerHeight / 2,
          size: tagSize,
          font: boldFont,
          color: primary,
        });

        y = height - headerHeight - 24;
      };

      const drawFooter = (pageNo: number) => {
        const footerHeight = 40;
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height: footerHeight,
          color: headerFooterBg,
        });

        const footerText = `Page ${pageNo}    ·    Copyright 2026 Sylvy. All rights reserved.`;
        const footerSize = 9;
        const textWidth = font.widthOfTextAtSize(footerText, footerSize);
        page.drawText(footerText, {
          x: (width - textWidth) / 2,
          y: footerHeight / 2 - footerSize / 2,
          size: footerSize,
          font,
          color: rgb(0.25, 0.25, 0.25),
        });
      };

      const startNewPage = () => {
        pageNumber += 1;
        if (pageNumber === 1) {
          page = pdfDoc.getPages()[0];
          page.setSize(A4_WIDTH, A4_HEIGHT);
        } else {
          page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        }
        ({ width, height } = page.getSize());
        drawHeader(currentPageKind);
        drawFooter(pageNumber);
        y = height - margin;
      };

      // Initial page header + footer
      startNewPage();

      const drawLine = (
        text: string,
        options?: { bold?: boolean; size?: number; color?: [number, number, number] },
      ) => {
        const size = options?.size ?? 11;
        const usedFont = options?.bold ? boldFont : font;
        const color = options?.color ?? [0, 0, 0];

        if (y < margin + lineHeight) {
          startNewPage();
        }

        page.drawText(text, {
          x: margin,
          y,
          size,
          font: usedFont,
          color: rgb(color[0], color[1], color[2]),
        });
        y -= lineHeight;
      };

      const drawCenteredLine = (
        text: string,
        options?: { bold?: boolean; size?: number; color?: [number, number, number] },
      ) => {
        const size = options?.size ?? 11;
        const usedFont = options?.bold ? boldFont : font;
        const color = options?.color ?? [0, 0, 0];

        if (y < margin + size + 6) {
          startNewPage();
        }

        const tw = usedFont.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: (width - tw) / 2,
          y,
          size,
          font: usedFont,
          color: rgb(color[0], color[1], color[2]),
        });
        y -= size + 8;
      };

      const wrapAndDraw = (text: string, options?: { bold?: boolean; size?: number }) => {
        const size = options?.size ?? 11;
        const usedFont = options?.bold ? boldFont : font;
        const maxWidth = width - margin * 2;
        const paragraphs = text.split("\n");

        for (const paragraph of paragraphs) {
          // Skip separator lines made entirely of =, -, or _ characters
          if (/^[=\-_]{3,}$/.test(paragraph.trim())) continue;

          const words = paragraph.split(/\s+/);
          let line = "";

          for (const word of words) {
            const testLine = line ? `${line} ${word}` : word;
            const testWidth = usedFont.widthOfTextAtSize(testLine, size);
            if (testWidth > maxWidth && line) {
              drawLine(line, { ...options, size });
              line = word;
            } else {
              line = testLine;
            }
          }

          if (line) {
            drawLine(line, { ...options, size });
          }

          y -= 4;
        }
      };

      const drawSectionTitle = (num: number, title: string) => {
        y -= 14;
        if (y < margin + lineHeight * 3) startNewPage();

        const sectionText = `${num}. ${title.toUpperCase()}`;
        const barH = 24;

        // Subtle green background bar
        page.drawRectangle({
          x: margin,
          y: y - 6,
          width: width - margin * 2,
          height: barH,
          color: rgb(0.878, 0.973, 0.925),
        });

        page.drawText(sectionText, {
          x: margin + 8,
          y: y + 2,
          size: 13,
          font: boldFont,
          color: primary,
        });

        y -= barH + 8;
      };

      const drawBlockGroup = (heading: string | null, items: ReportBlock[]) => {
        if (heading) {
          y -= 4;
          drawLine(heading, { bold: true, size: 12 });
          y -= 2;
        }

        for (const block of items) {
          if (block.type === "text" && block.content) {
            wrapAndDraw(block.content);
          } else if (block.type === "data_table" && block.content) {
            wrapAndDraw(`Table: ${block.content}`);
          } else if (block.type === "image_placeholder" && block.storage_url) {
            wrapAndDraw(`[Image: ${block.storage_url}]`);
          }
        }
      };

      // Renders a single block for Section 2 (Lab Process), handling JSON payloads.
      const drawLabBlock = (block: ReportBlock) => {
        if (block.type !== "text" || !block.content) return;

        let payload: LabBlockPayload | null = null;
        if (block.content.trim().startsWith("{")) {
          try {
            payload = JSON.parse(block.content) as LabBlockPayload;
          } catch {
            // fall through to legacy plain text
          }
        }

        if (!payload) {
          // Legacy plain text block
          wrapAndDraw(block.content);
          return;
        }

        if (payload.__blockKind === "lab_text") {
          if (payload.text) wrapAndDraw(payload.text);
          return;
        }

        if (payload.__blockKind === "lab_image_ocr") {
          for (const dateBlock of payload.dateBlocks) {
            if (dateBlock.date) {
              y -= 2;
              drawLine(`— ${dateBlock.date} —`, { bold: true, size: 11, color: [0, 0.675, 0.451] });
              y -= 2;
            }
            if (dateBlock.text) {
              wrapAndDraw(dateBlock.text);
            }
            y -= 4;
          }
        }
      };

      // ── Cover ────────────────────────────────────────────────────────
      y -= 20;
      drawCenteredLine("EXPERIMENT REPORT", { bold: true, size: 22, color: [0, 0.675, 0.451] });
      y -= 4;
      drawCenteredLine(experimentName, { bold: true, size: 16 });
      y -= 14;

      // Subtle divider line
      page.drawLine({
        start: { x: margin + 60, y },
        end: { x: width - margin - 60, y },
        thickness: 0.5,
        color: rgb(0.75, 0.75, 0.75),
      });
      y -= 18;

      drawLine(`Report created: ${new Date(createdAt).toLocaleDateString()}`, {
        size: 10,
        color: [0.45, 0.45, 0.45],
      });
      drawLine(`Experiment created: ${new Date(experimentCreatedAt).toLocaleDateString()}`, {
        size: 10,
        color: [0.45, 0.45, 0.45],
      });
      y -= 14;

      // ── 1. PRESENTATION ──────────────────────────────────────────────
      drawSectionTitle(1, "Presentation");
      wrapAndDraw(`Project: ${project || "—"}`);
      wrapAndDraw(`Protocol: ${protocolName || "—"}`);
      wrapAndDraw(`Sample: ${sampleName || "—"}`);
      y -= 4;

      // ── Split blocks into lab / results / comments groups ─────────────
      const allGroups = groupBlocksByHeading(latestBlocks);
      const labGroups = allGroups.filter((g) => !isResultsHeading(g.heading) && !isCommentsHeading(g.heading));

      // Deduplicate: if there are multiple Results/Comments groups (from duplicate DB blocks),
      // keep only the first one that has content, falling back to the first group.
      const pickBestGroup = (groups: typeof allGroups) => {
        if (groups.length === 0) return [];
        const withContent = groups.find((g) => g.items.some((b) => b.content?.trim()));
        return [withContent ?? groups[0]];
      };
      const resultGroups = pickBestGroup(allGroups.filter((g) => isResultsHeading(g.heading)));
      const commentGroups = pickBestGroup(allGroups.filter((g) => isCommentsHeading(g.heading)));

      // ── 2. LABORATORY PROCESS ─────────────────────────────────────────
      drawSectionTitle(2, "Laboratory Process");
      if (labGroups.length === 0 || labGroups.every((g) => g.items.length === 0 && !g.heading)) {
        wrapAndDraw("—");
      } else {
        for (const group of labGroups) {
          // Suppress the "Lab Notebook" structural heading — it is scaffolding, not content.
          const isLabNotebookHeading = group.heading !== null && /lab\s*notebook/i.test(group.heading);
          if (group.heading && !isLabNotebookHeading) {
            y -= 4;
            drawLine(group.heading, { bold: true, size: 12 });
            y -= 2;
          }
          for (const block of group.items) {
            drawLabBlock(block);
          }
        }
      }

      // ── 3. RESULTS ───────────────────────────────────────────────────
      drawSectionTitle(3, "Results");
      if (resultGroups.length === 0 || resultGroups.every((g) => g.items.length === 0)) {
        wrapAndDraw("—");
      } else {
        for (const group of resultGroups) {
          // Do not repeat the structural "Results" heading under the section title.
          drawBlockGroup(null, group.items);
        }
      }

      // ── 4. COMMENTS ──────────────────────────────────────────────────
      drawSectionTitle(4, "Comments");
      if (commentGroups.length === 0 || commentGroups.every((g) => g.items.length === 0)) {
        wrapAndDraw("—");
      } else {
        for (const group of commentGroups) {
          // Do not repeat the structural "Comments" heading under the section title.
          drawBlockGroup(null, group.items);
        }
      }

      // ── 5. RAW DATA ──────────────────────────────────────────────────
      currentPageKind = "RAW DATA";
      drawSectionTitle(5, "Raw Data");

      if (files.length === 0) {
        wrapAndDraw("No raw data files attached to this experiment.");
      }

      // Embed images — filename and image always on the same page
      const imageFilesForEmbedding = files.filter(
        (f) =>
          f.file_type === "image/png" ||
          f.file_type === "image/jpeg" ||
          f.file_name.toLowerCase().endsWith(".png") ||
          f.file_name.toLowerCase().endsWith(".jpg") ||
          f.file_name.toLowerCase().endsWith(".jpeg"),
      );

      if (imageFilesForEmbedding.length > 0) {
        startNewPage();

        for (const f of imageFilesForEmbedding) {
          try {
            const res = await fetch(f.storage_url);
            const bytes = await res.arrayBuffer();
            const isPng =
              f.file_type === "image/png" || f.file_name.toLowerCase().endsWith(".png");
            const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

            const maxImgWidth = width - margin * 2;
            const maxImgHeight = height - margin * 2 - 40; // leave breathing room
            const widthScale = maxImgWidth / img.width;
            const heightScale = maxImgHeight / img.height;
            const scale = Math.min(widthScale, heightScale);
            const imgWidth = img.width * scale;
            const imgHeight = img.height * scale;

            const captionSize = 11;
            const caption = f.file_name;
            const captionHeight = captionSize + 10;

            if (y - imgHeight - captionHeight < margin) {
              startNewPage();
            }

            const imgX = (width - imgWidth) / 2;
            const imgY = y - imgHeight;
            page.drawImage(img, {
              x: imgX,
              y: imgY,
              width: imgWidth,
              height: imgHeight,
            });
            const captionWidth = boldFont.widthOfTextAtSize(caption, captionSize);
            page.drawText(caption, {
              x: (width - captionWidth) / 2,
              y: imgY - captionHeight + 6,
              size: captionSize,
              font: boldFont,
              color: primary,
            });
            y = imgY - captionHeight - 20;
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Failed to embed image in PDF", f.file_name, err);
          }
        }
      }

      // Append PDF files as embedded pages on A4 portrait with RAW DATA header/footer
      const pdfFilesForAppend = files.filter(
        (f) => f.file_type === "application/pdf" || f.file_name.toLowerCase().endsWith(".pdf"),
      );

      for (const f of pdfFilesForAppend) {
        try {
          const res = await fetch(f.storage_url);
          const bytes = await res.arrayBuffer();
          const srcDoc = await PDFDocument.load(bytes);
          const srcPageRefs = srcDoc.getPages();

          for (let i = 0; i < srcPageRefs.length; i++) {
            const [embedded] = await pdfDoc.embedPages([srcPageRefs[i]]);

            currentPageKind = "RAW DATA";
            startNewPage();

            const availableWidth = width - margin * 2;
            const availableHeight = height - margin * 2;

            const drawWidth = embedded.width;
            const drawHeight = embedded.height;

            const widthScale = availableWidth / drawWidth;
            const heightScale = availableHeight / drawHeight;
            const scale = Math.min(widthScale, heightScale);
            const scaledWidth = drawWidth * scale;
            const scaledHeight = drawHeight * scale;

            const x = (width - scaledWidth) / 2;
            const yEmbed = margin + (availableHeight - scaledHeight) / 2;

            page.drawPage(embedded, {
              x,
              y: yEmbed,
              width: scaledWidth,
              height: scaledHeight,
            });
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Failed to append PDF raw data", f.file_name, err);
        }
      }

      const safeTitle = experimentName.replace(/[^a-zA-Z0-9]/g, "_") || "experiment";
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeTitle}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleExport} disabled={exporting}>
      {exporting ? "Exporting…" : "Export PDF"}
    </Button>
  );
}
