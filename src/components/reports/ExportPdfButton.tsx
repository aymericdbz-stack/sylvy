"use client";

import { useState } from "react";
import type { ExperimentFile, ReportBlock } from "@/lib/supabase/types";
import Button from "@/components/ui/nb/Button";
import { createClient } from "@/lib/supabase/client";

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
  templateTitle,
  createdBy,
  experimentCreatedAt,
  initialFiles,
}: ExportPdfButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

      // Always fetch the latest raw data files so newly uploaded items are included.
      let files: ExperimentFile[] = initialFiles;
      try {
        const supabase = createClient();
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

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const margin = 50;
      let page = pdfDoc.addPage();
      let { width, height } = page.getSize();
      let y = height - margin;

      const lineHeight = 14;
      const primary = rgb(0, 0.675, 0.451); // #00ac73

      const drawHeader = () => {
        const headerHeight = 64;
        page.drawRectangle({
          x: 0,
          y: height - headerHeight,
          width,
          height: headerHeight,
          color: rgb(0.98, 0.98, 0.96),
        });
        page.drawText("Sylvy", {
          x: margin,
          y: height - headerHeight / 2 - 4,
          size: 20,
          font: boldFont,
          color: primary,
        });
        page.drawText("AI brain for lab efficiency", {
          x: margin + 80,
          y: height - headerHeight / 2,
          size: 10,
          font,
          color: rgb(0.35, 0.35, 0.35),
        });
        y = height - headerHeight - 24;
      };

      const addPage = () => {
        page = pdfDoc.addPage();
        ({ width, height } = page.getSize());
        y = height - margin;
        drawHeader();
      };

      // Initial page header
      drawHeader();

      const drawLine = (
        text: string,
        options?: { bold?: boolean; size?: number; color?: [number, number, number] },
      ) => {
        const size = options?.size ?? 11;
        const usedFont = options?.bold ? boldFont : font;
        const color = options?.color ?? [0, 0, 0];

        if (y < margin + lineHeight) {
          addPage();
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

      const wrapAndDraw = (text: string, options?: { bold?: boolean; size?: number }) => {
        const size = options?.size ?? 11;
        const usedFont = options?.bold ? boldFont : font;
        const maxWidth = width - margin * 2;
        const paragraphs = text.split("\n");

        for (const paragraph of paragraphs) {
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
        y -= 6;
        if (y < margin + lineHeight * 3) addPage();
        drawLine(`${num}. ${title.toUpperCase()}`, { bold: true, size: 15, color: [0, 0.675, 0.451] });
        // Underline
        page.drawLine({
          start: { x: margin, y },
          end: { x: width - margin, y },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
        y -= 10;
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

      // ── Cover title ──────────────────────────────────────────────────
      drawLine("EXPERIMENT REPORT", { bold: true, size: 16 });
      y -= 4;
      wrapAndDraw(experimentName, { bold: true, size: 14 });
      y -= 4;
      drawLine(`Report created: ${new Date(createdAt).toLocaleDateString()}`, { size: 10 });
      drawLine(`Experiment created: ${new Date(experimentCreatedAt).toLocaleDateString()}`, { size: 10 });
      y -= 10;

      // ── 1. PRESENTATION ──────────────────────────────────────────────
      drawSectionTitle(1, "Presentation");
      wrapAndDraw(`Project: ${project || "—"}`);
      wrapAndDraw(`Protocol: ${protocolName || "—"}`);
      wrapAndDraw(`Sample: ${sampleName || "—"}`);
      wrapAndDraw(`Template: ${templateTitle || "—"}`);
      wrapAndDraw(`Created by: ${createdBy || "—"}`);
      y -= 4;

      // ── Split blocks into lab / results / comments groups ─────────────
      const allGroups = groupBlocksByHeading(blocks);
      const labGroups = allGroups.filter((g) => !isResultsHeading(g.heading) && !isCommentsHeading(g.heading));
      const resultGroups = allGroups.filter((g) => isResultsHeading(g.heading));
      const commentGroups = allGroups.filter((g) => isCommentsHeading(g.heading));

      // ── 2. LABORATORY PROCESS ─────────────────────────────────────────
      drawSectionTitle(2, "Laboratory Process");
      if (labGroups.length === 0 || labGroups.every((g) => g.items.length === 0 && !g.heading)) {
        wrapAndDraw("—");
      } else {
        for (const group of labGroups) {
          drawBlockGroup(group.heading, group.items);
        }
      }

      // ── 3. RESULTS ───────────────────────────────────────────────────
      drawSectionTitle(3, "Results");
      if (resultGroups.length === 0 || resultGroups.every((g) => g.items.length === 0)) {
        wrapAndDraw("—");
      } else {
        for (const group of resultGroups) {
          drawBlockGroup(group.heading, group.items);
        }
      }

      // ── 4. COMMENTS ──────────────────────────────────────────────────
      drawSectionTitle(4, "Comments");
      if (commentGroups.length === 0 || commentGroups.every((g) => g.items.length === 0)) {
        wrapAndDraw("—");
      } else {
        for (const group of commentGroups) {
          drawBlockGroup(group.heading, group.items);
        }
      }

      // ── 5. RAW DATA ──────────────────────────────────────────────────
      drawSectionTitle(5, "Raw Data");

      if (files.length === 0) {
        wrapAndDraw("No raw data files attached to this experiment.");
      } else {
        const imageFiles = files.filter((f) => f.file_type.startsWith("image/"));
        const pdfFiles = files.filter(
          (f) => f.file_type === "application/pdf" || f.file_name.toLowerCase().endsWith(".pdf"),
        );
        const tableFiles = files.filter(
          (f) =>
            ["text/csv", "text/tab-separated-values"].includes(f.file_type) ||
            f.file_name.toLowerCase().match(/\.(csv|tsv|xlsx|xls)$/),
        );
        const otherFiles = files.filter(
          (f) => !imageFiles.includes(f) && !pdfFiles.includes(f) && !tableFiles.includes(f),
        );

        if (imageFiles.length) {
          wrapAndDraw("Images:", { bold: true });
          imageFiles.forEach((f) => wrapAndDraw(`• ${f.file_name}`));
          y -= 4;
        }
        if (tableFiles.length) {
          wrapAndDraw("Tables:", { bold: true });
          tableFiles.forEach((f) => wrapAndDraw(`• ${f.file_name}`));
          y -= 4;
        }
        if (pdfFiles.length) {
          wrapAndDraw("PDFs:", { bold: true });
          pdfFiles.forEach((f) => wrapAndDraw(`• ${f.file_name}`));
          y -= 4;
        }
        if (otherFiles.length) {
          wrapAndDraw("Other files:", { bold: true });
          otherFiles.forEach((f) => wrapAndDraw(`• ${f.file_name}`));
        }
      }

      // Embed images
      const imageFilesForEmbedding = files.filter(
        (f) =>
          f.file_type === "image/png" ||
          f.file_type === "image/jpeg" ||
          f.file_name.toLowerCase().endsWith(".png") ||
          f.file_name.toLowerCase().endsWith(".jpg") ||
          f.file_name.toLowerCase().endsWith(".jpeg"),
      );

      if (imageFilesForEmbedding.length > 0) {
        addPage();
        drawLine("5. RAW DATA — Images", { bold: true, size: 16, color: [0, 0.675, 0.451] });
        y -= 10;

        for (const f of imageFilesForEmbedding) {
          try {
            const res = await fetch(f.storage_url);
            const bytes = await res.arrayBuffer();
            const isPng =
              f.file_type === "image/png" || f.file_name.toLowerCase().endsWith(".png");
            const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

            const maxImgWidth = width - margin * 2;
            const scale = maxImgWidth / img.width;
            const imgWidth = img.width * scale;
            const imgHeight = img.height * scale;

            if (y - imgHeight - 30 < margin) {
              addPage();
              drawLine("5. RAW DATA — Images (cont.)", { bold: true, size: 16, color: [0, 0.675, 0.451] });
              y -= 10;
            }

            wrapAndDraw(f.file_name, { bold: true });
            page.drawImage(img, {
              x: margin,
              y: y - imgHeight - 10,
              width: imgWidth,
              height: imgHeight,
            });
            y = y - imgHeight - 30;
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Failed to embed image in PDF", f.file_name, err);
          }
        }
      }

      // Append PDF files
      const pdfFilesForAppend = files.filter(
        (f) => f.file_type === "application/pdf" || f.file_name.toLowerCase().endsWith(".pdf"),
      );

      if (pdfFilesForAppend.length > 0) {
        addPage();
        drawLine("5. RAW DATA — PDF Appendices", { bold: true, size: 16, color: [0, 0.675, 0.451] });
        y -= 10;
        wrapAndDraw(
          "The following pages contain the original PDF files attached to this experiment, concatenated as appendices.",
        );

        for (const f of pdfFilesForAppend) {
          try {
            const res = await fetch(f.storage_url);
            const bytes = await res.arrayBuffer();
            const srcDoc = await PDFDocument.load(bytes);
            const copiedPages = await pdfDoc.copyPages(srcDoc, srcDoc.getPageIndices());
            copiedPages.forEach((p) => pdfDoc.addPage(p));
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Failed to append PDF raw data", f.file_name, err);
          }
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
