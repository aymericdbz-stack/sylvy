"use client";

import { useCallback, useRef, useState } from "react";
import { useParams } from "next/navigation";

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

interface CapturedFile {
  id: string;
  file: File;
  preview: string;
}

export default function CapturePage() {
  const params = useParams();
  const token = params.token as string;

  const [files, setFiles] = useState<CapturedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const captured: CapturedFile[] = newFiles.map((f) => ({
      id: `cap-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setFiles((prev) => [...prev, ...captured]);
    e.target.value = "";
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const filesData = await Promise.all(
        files.map(async (cf) => ({
          file: await fileToBase64(cf.file),
          mimeType: cf.file.type || "image/jpeg",
          fileName: cf.file.name,
        }))
      );

      const res = await fetch("/api/notebook/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          sessionToken: token,
          filesData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#f0fdf4" }}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "#00ac73" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#00ac73" }}>
            Photos Sent!
          </h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Your photos have been sent to the desktop app.
            <br />
            You can close this page now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4" style={{ background: "#faf9f6" }}>
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-xl font-bold" style={{ color: "#111827" }}>
          <span style={{ color: "#00ac73" }}>Sylvy</span> Capture
        </h1>
        <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
          Take photos of your lab notes
        </p>
      </div>

      {/* Camera button */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-sm flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all active:scale-95"
          style={{ borderColor: "#00ac73", background: "#ecfdf5" }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00ac73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-base font-semibold" style={{ color: "#00ac73" }}>
            Take Photo
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleCapture}
          className="hidden"
        />

        {/* Thumbnails */}
        {files.length > 0 && (
          <div className="w-full max-w-sm space-y-3">
            <p className="text-sm font-medium" style={{ color: "#374151" }}>
              {files.length} photo{files.length !== 1 ? "s" : ""} ready
            </p>
            <div className="grid grid-cols-3 gap-2">
              {files.map((cf) => (
                <div key={cf.id} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cf.preview}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(cf.id)}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
        )}
      </div>

      {/* Submit button */}
      {files.length > 0 && (
        <div className="py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-2xl py-4 text-base font-bold transition-all active:scale-95"
            style={{ background: "#00ac73", color: "#fff" }}
          >
            {submitting ? "Sending..." : `Submit ${files.length} Photo${files.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
