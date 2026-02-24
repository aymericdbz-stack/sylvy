"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ReportStep {
  stepNumber: number;
  expectedAction: string;
  actualObservation: string;
  parameters: string[];
  deviation: string | null;
}

interface Report {
  title: string;
  date: string;
  steps: ReportStep[];
  summary: string;
  additionalNotes: string;
}

interface Step6Props {
  report: Report;
  onContinue: () => void;
  onBack: () => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

function reportToPlainText(report: Report): string {
  let text = "";
  text += `EXPERIMENTAL REPORT\n`;
  text += `${"=".repeat(50)}\n\n`;
  text += `Title: ${report.title}\n`;
  text += `Date: ${report.date}\n\n`;

  if (report.summary) {
    text += `SUMMARY\n${"-".repeat(30)}\n${report.summary}\n\n`;
  }

  for (const step of report.steps) {
    text += `STEP ${step.stepNumber}\n${"-".repeat(30)}\n`;
    text += `Expected: ${step.expectedAction}\n`;
    text += `Actual: ${step.actualObservation}\n`;
    if (step.parameters.length > 0) {
      text += `Parameters: ${step.parameters.join(", ")}\n`;
    }
    if (step.deviation) {
      text += `Deviation: ${step.deviation}\n`;
    }
    text += "\n";
  }

  if (report.additionalNotes) {
    text += `ADDITIONAL NOTES\n${"-".repeat(30)}\n${report.additionalNotes}\n`;
  }

  return text;
}

export function Step6_Export({ report, onContinue, onBack, addToast }: Step6Props) {
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportDocx = async () => {
    setExportingDocx(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any[] = [];

      // Title
      children.push(
        new Paragraph({
          text: "EXPERIMENTAL REPORT",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: report.title, bold: true, size: 28 }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Date: ${report.date}`, italics: true, color: "666666" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // Summary
      if (report.summary) {
        children.push(
          new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 })
        );
        children.push(
          new Paragraph({ text: report.summary, spacing: { after: 300 } })
        );
      }

      // Steps
      for (const step of report.steps) {
        children.push(
          new Paragraph({
            text: `Step ${step.stepNumber}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Expected: ", bold: true }),
              new TextRun({ text: step.expectedAction }),
            ],
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Actual: ", bold: true }),
              new TextRun({ text: step.actualObservation }),
            ],
          })
        );

        if (step.parameters.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: "Parameters: ", bold: true }),
                new TextRun({ text: step.parameters.join(", ") }),
              ],
            })
          );
        }

        if (step.deviation) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: "Deviation: ", bold: true, color: "B45309" }),
                new TextRun({ text: step.deviation, color: "92400E" }),
              ],
              spacing: { after: 200 },
            })
          );
        }
      }

      // Additional notes
      if (report.additionalNotes) {
        children.push(
          new Paragraph({
            text: "Additional Notes",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400 },
          })
        );
        children.push(new Paragraph({ text: report.additionalNotes }));
      }

      const doc = new Document({
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, "_")}_report.docx`;
      a.click();
      URL.revokeObjectURL(url);

      addToast("DOCX downloaded!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      addToast(msg, "error");
    } finally {
      setExportingDocx(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const text = reportToPlainText(report);
      const lines = doc.splitTextToSize(text, 180);
      let y = 20;

      for (const line of lines) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 15, y);
        y += 6;
      }

      doc.save(`${report.title.replace(/[^a-zA-Z0-9]/g, "_")}_report.pdf`);
      addToast("PDF downloaded!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      addToast(msg, "error");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-8 text-center">
      <div className="space-y-3">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "Pulp, sans-serif" }}
        >
          Export <span style={{ color: "#00ac73" }}>Report</span>
        </h2>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          Download your experimental report as a Word or PDF document.
        </p>
      </div>

      <div className="space-y-3">
        {/* DOCX button */}
        <button
          type="button"
          onClick={handleExportDocx}
          disabled={exportingDocx}
          className="w-full flex items-center gap-4 rounded-2xl border-2 p-6 text-left transition-all hover:shadow-md"
          style={{ borderColor: "#e5e7eb", background: "#fff" }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: "#dbeafe" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold" style={{ color: "#111827" }}>
              {exportingDocx ? "Generating..." : "Download as Word"}
            </p>
            <p className="text-xs" style={{ color: "#9ca3af" }}>.docx format — editable in Word, Google Docs</p>
          </div>
          {exportingDocx && (
            <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: "#dbeafe", borderTopColor: "#2563eb" }} />
          )}
        </button>

        {/* PDF button */}
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exportingPdf}
          className="w-full flex items-center gap-4 rounded-2xl border-2 p-6 text-left transition-all hover:shadow-md"
          style={{ borderColor: "#e5e7eb", background: "#fff" }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: "#fee2e2" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold" style={{ color: "#111827" }}>
              {exportingPdf ? "Generating..." : "Download as PDF"}
            </p>
            <p className="text-xs" style={{ color: "#9ca3af" }}>.pdf format — ready to share and print</p>
          </div>
          {exportingPdf && (
            <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: "#fee2e2", borderTopColor: "#dc2626" }} />
          )}
        </button>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onBack}
          className="h-11 flex-1 rounded-xl text-sm font-medium"
          style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db" }}
        >
          Back to Report
        </Button>
        <Button
          type="button"
          onClick={onContinue}
          className="h-11 flex-1 rounded-xl text-sm font-semibold"
          style={{ background: "#00ac73", color: "#fff" }}
        >
          Upload Results
        </Button>
      </div>
    </div>
  );
}
