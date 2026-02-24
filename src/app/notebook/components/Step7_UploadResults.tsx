"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDropZone } from "./common/FileDropZone";

interface ResultFile {
  id: string;
  file: File;
  description: string;
  protocolStep: string;
  tags: string;
}

interface Step7Props {
  experimentId: string | null;
  protocolSteps: string[];
  onComplete: () => void;
  onBack: () => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function Step7_UploadResults({
  experimentId,
  protocolSteps,
  onComplete,
  onBack,
  addToast,
}: Step7Props) {
  const [resultFiles, setResultFiles] = useState<ResultFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    const accepted = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const validExtensions = [".xlsx", ".csv", ".docx"];

    const valid = files.filter(
      (f) =>
        accepted.includes(f.type) ||
        validExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))
    );

    if (valid.length < files.length) {
      addToast("Some files were skipped. Only .xlsx, .csv, .docx are accepted.", "info");
    }

    const newFiles: ResultFile[] = valid.map((f) => ({
      id: `rf-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      description: "",
      protocolStep: "",
      tags: "",
    }));

    setResultFiles((prev) => [...prev, ...newFiles]);
  }, [addToast]);

  const updateFile = (id: string, field: keyof ResultFile, value: string) => {
    setResultFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const removeFile = (id: string) => {
    setResultFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    if (resultFiles.length === 0) {
      addToast("Please upload at least one result file.", "error");
      return;
    }

    // Check descriptions
    const missing = resultFiles.filter((f) => !f.description.trim());
    if (missing.length > 0) {
      addToast("Please add a description for all files.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const filesData = await Promise.all(
        resultFiles.map(async (rf) => ({
          file_name: rf.file.name,
          file_type: rf.file.type || rf.file.name.split(".").pop() || "",
          file_size: rf.file.size,
          file_data: await fileToBase64(rf.file),
          description: rf.description.trim(),
          protocol_step: rf.protocolStep || undefined,
          tags: rf.tags
            ? rf.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
        }))
      );

      const res = await fetch("/api/notebook/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experiment_id: experimentId || "local-session",
          files: filesData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addToast("Results uploaded successfully!", "success");
      onComplete();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "Pulp, sans-serif" }}
        >
          Upload <span style={{ color: "#00ac73" }}>Results</span>
        </h2>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          Upload your experimental result files with context and descriptions.
        </p>
      </div>

      <FileDropZone
        onFiles={handleFiles}
        accept=".xlsx,.csv,.docx"
        label="Drop result files here"
        sublabel=".xlsx, .csv, .docx files"
      />

      {/* File list */}
      {resultFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: "#374151" }}>
            Uploaded Files ({resultFiles.length})
          </h3>

          {resultFiles.map((rf) => (
            <div
              key={rf.id}
              className="rounded-xl border p-4 space-y-3"
              style={{ background: "#fff", borderColor: "#e5e7eb" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold"
                    style={{
                      background: rf.file.name.endsWith(".xlsx")
                        ? "#dcfce7"
                        : rf.file.name.endsWith(".csv")
                          ? "#dbeafe"
                          : "#ede9fe",
                      color: rf.file.name.endsWith(".xlsx")
                        ? "#16a34a"
                        : rf.file.name.endsWith(".csv")
                          ? "#2563eb"
                          : "#7c3aed",
                    }}
                  >
                    {rf.file.name.split(".").pop()?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#111827" }}>
                      {rf.file.name}
                    </p>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      {formatFileSize(rf.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(rf.id)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-red-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium" style={{ color: "#6b7280" }}>
                  Description *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Plate reader absorbance data at 450nm"
                  value={rf.description}
                  onChange={(e) => updateFile(rf.id, "description", e.target.value)}
                  className="h-9 mt-1 rounded-lg text-sm"
                  style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
                />
              </div>

              {/* Protocol step */}
              {protocolSteps.length > 0 && (
                <div>
                  <label className="text-xs font-medium" style={{ color: "#6b7280" }}>
                    Related Protocol Step
                  </label>
                  <select
                    value={rf.protocolStep}
                    onChange={(e) => updateFile(rf.id, "protocolStep", e.target.value)}
                    className="w-full h-9 mt-1 rounded-lg border px-3 text-sm"
                    style={{ background: "#f9fafb", borderColor: "#e5e7eb", color: "#374151" }}
                  >
                    <option value="">— None —</option>
                    {protocolSteps.map((step, i) => (
                      <option key={i} value={`Step ${i + 1}`}>
                        Step {i + 1}: {step.slice(0, 60)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="text-xs font-medium" style={{ color: "#6b7280" }}>
                  Tags (comma-separated)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., absorbance, plate-reader, day-1"
                  value={rf.tags}
                  onChange={(e) => updateFile(rf.id, "tags", e.target.value)}
                  className="h-9 mt-1 rounded-lg text-sm"
                  style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
                />
              </div>
            </div>
          ))}
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
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || resultFiles.length === 0}
          className="h-11 flex-1 rounded-xl text-sm font-semibold"
          style={{
            background: resultFiles.length > 0 ? "#00ac73" : "#d1d5db",
            color: "#fff",
          }}
        >
          {submitting ? "Submitting..." : "Submit Results"}
        </Button>
      </div>
    </div>
  );
}
