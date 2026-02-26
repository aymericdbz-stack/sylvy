"use client";

import { useCallback, useEffect, useState } from "react";
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

interface Step5Props {
  protocolTitle: string;
  protocolContent: string;
  experimentNotes: string;
  existingReport: Report | null;
  onReportReady: (report: Report) => void;
  onBack: () => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

export function Step5_Report({
  protocolTitle,
  protocolContent,
  experimentNotes,
  existingReport,
  onReportReady,
  onBack,
  addToast,
}: Step5Props) {
  const [report, setReport] = useState<Report | null>(existingReport);
  const [loading, setLoading] = useState(false);
  const [showRawNotes, setShowRawNotes] = useState(false);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notebook/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocolTitle, protocolContent, experimentNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReport(data.report);
      addToast("Report generated!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Report generation failed";
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [protocolTitle, protocolContent, experimentNotes, addToast]);

  useEffect(() => {
    if (!existingReport) {
      generateReport();
    }
  }, [existingReport, generateReport]);

  const updateStepField = (stepIdx: number, field: keyof ReportStep, value: string) => {
    if (!report) return;
    const updated = { ...report };
    updated.steps = [...updated.steps];
    updated.steps[stepIdx] = { ...updated.steps[stepIdx], [field]: value };
    setReport(updated);
  };

  // Raw notes modal
  if (showRawNotes) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Pulp, sans-serif" }}>
            Raw <span style={{ color: "#00ac73" }}>Transcription</span>
          </h2>
        </div>
        <div className="rounded-2xl border p-4 max-h-[400px] overflow-y-auto" style={{ background: "#f9fafb", borderColor: "#e5e7eb" }}>
          <pre className="text-sm whitespace-pre-wrap" style={{ color: "#374151" }}>{experimentNotes}</pre>
        </div>
        <Button
          type="button"
          onClick={() => setShowRawNotes(false)}
          className="w-full h-11 rounded-xl text-sm font-medium"
          style={{ background: "#00ac73", color: "#fff" }}
        >
          Back to Report
        </Button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl flex flex-col items-center gap-6 py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "#d1fae5", borderTopColor: "#00ac73" }} />
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: "#111827" }}>Generating Report...</p>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Mapping your experimental notes to protocol steps using AI.
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16">
        <p className="text-sm" style={{ color: "#ef4444" }}>
          Failed to generate report.
        </p>
        <div className="flex gap-3 justify-center mt-4">
          <Button onClick={onBack} className="h-11 rounded-xl px-6" style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db" }}>
            Back
          </Button>
          <Button onClick={generateReport} className="h-11 rounded-xl px-6" style={{ background: "#00ac73", color: "#fff" }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Pulp, sans-serif" }}>
            Experimental <span style={{ color: "#00ac73" }}>Report</span>
          </h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            {report.title} — {report.date}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowRawNotes(true)}
          className="h-9 rounded-lg px-4 text-xs font-medium"
          style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}
        >
          Raw Data
        </Button>
      </div>

      {/* Summary */}
      {report.summary && (
        <div className="rounded-xl border p-4" style={{ background: "#f0fdf4", borderColor: "#d1fae5" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#00ac73" }}>
            Summary
          </p>
          <p className="text-sm" style={{ color: "#374151" }}>{report.summary}</p>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-4">
        {report.steps.map((step, idx) => (
          <div
            key={idx}
            className="rounded-2xl border p-5 space-y-3"
            style={{ background: "#fff", borderColor: step.deviation ? "#fde68a" : "#e5e7eb" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "#d1fae5", color: "#00ac73" }}
              >
                {step.stepNumber}
              </div>
              <h3 className="text-sm font-semibold" style={{ color: "#111827" }}>
                Step {step.stepNumber}
              </h3>
              {step.deviation && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#fef3c7", color: "#92400e" }}>
                  Deviation
                </span>
              )}
            </div>

            {/* Expected */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
                Expected
              </label>
              <textarea
                value={step.expectedAction}
                onChange={(e) => updateStepField(idx, "expectedAction", e.target.value)}
                className="w-full mt-1 rounded-lg border p-2 text-sm focus:outline-none resize-none"
                style={{ borderColor: "#e5e7eb", minHeight: 40 }}
                rows={2}
              />
            </div>

            {/* Actual */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
                Actual Observation
              </label>
              <textarea
                value={step.actualObservation}
                onChange={(e) => updateStepField(idx, "actualObservation", e.target.value)}
                className="w-full mt-1 rounded-lg border p-2 text-sm focus:outline-none resize-none"
                style={{ borderColor: "#e5e7eb", minHeight: 40 }}
                rows={2}
              />
            </div>

            {/* Parameters */}
            {step.parameters.length > 0 && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
                  Parameters
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {step.parameters.map((param, pi) => (
                    <span
                      key={pi}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ background: "#ede9fe", color: "#6d28d9" }}
                    >
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Deviation */}
            {step.deviation && (
              <div className="rounded-lg p-3" style={{ background: "#fffbeb" }}>
                <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#92400e" }}>
                  Deviation Note
                </label>
                <p className="text-sm mt-0.5" style={{ color: "#78350f" }}>{step.deviation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional notes */}
      {report.additionalNotes && (
        <div className="rounded-xl border p-4" style={{ background: "#fff", borderColor: "#e5e7eb" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#9ca3af" }}>
            Additional Notes
          </p>
          <p className="text-sm" style={{ color: "#374151" }}>{report.additionalNotes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onBack}
          className="h-11 flex-1 rounded-xl text-sm font-medium"
          style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db" }}
        >
          Back to Notes
        </Button>
        <Button
          type="button"
          onClick={() => onReportReady(report)}
          className="h-11 flex-1 rounded-xl text-sm font-semibold"
          style={{ background: "#00ac73", color: "#fff" }}
        >
          Export Report
        </Button>
      </div>
    </div>
  );
}
