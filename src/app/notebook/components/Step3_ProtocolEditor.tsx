"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Step3Props {
  protocolTitle: string;
  protocolContent: string;
  protocolId: string | null;
  onValidate: (title: string, content: string, savedId: string) => void;
  onBack: () => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

export function Step3_ProtocolEditor({
  protocolTitle: initialTitle,
  protocolContent: initialContent,
  protocolId,
  onValidate,
  onBack,
  addToast,
}: Step3Props) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleValidate = async () => {
    if (!title.trim()) {
      addToast("Please enter a protocol title.", "error");
      return;
    }
    if (!content.trim()) {
      addToast("Protocol content cannot be empty.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/notebook/protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: protocolId || undefined,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addToast("Protocol saved successfully!", "success");
      onValidate(title.trim(), content.trim(), data.protocol.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save protocol";
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "Pulp, sans-serif" }}
        >
          Edit <span style={{ color: "#00ac73" }}>Protocol</span>
        </h2>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          Review and edit your protocol before validating it.
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: "#374151" }}>
          Protocol Title
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12 rounded-xl text-base font-semibold"
          style={{ background: "#fff", border: "1px solid #e5e7eb" }}
        />
      </div>

      {/* Content editor */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: "#374151" }}>
          Protocol Content
        </label>
        <div className="rounded-2xl border" style={{ background: "#fff", borderColor: "#e5e7eb" }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[400px] rounded-2xl border-0 p-5 text-sm leading-relaxed focus:outline-none resize-y"
            style={{ background: "#fff", color: "#374151" }}
          />
        </div>
        <p className="text-xs" style={{ color: "#9ca3af" }}>
          {content.split("\n").filter(Boolean).length} lines
        </p>
      </div>

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
          onClick={handleValidate}
          disabled={saving}
          className="h-11 flex-1 rounded-xl text-sm font-semibold"
          style={{ background: "#00ac73", color: "#fff" }}
        >
          {saving ? "Saving..." : "Validate Protocol"}
        </Button>
      </div>
    </div>
  );
}
