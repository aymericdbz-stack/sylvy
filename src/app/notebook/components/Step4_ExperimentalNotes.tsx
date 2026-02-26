"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "./common/FileDropZone";

type Tab = "upload" | "paste" | "qr";

interface Step4Props {
  protocolTitle: string;
  onNotesSubmitted: (rawText: string) => void;
  onBack: () => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

const MAX_SIZE = 20 * 1024 * 1024;

async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const blob = (await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 })) as Blob;
  return new File([blob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
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

export function Step4_ExperimentalNotes({ protocolTitle, onNotesSubmitted, onBack, addToast }: Step4Props) {
  const [tab, setTab] = useState<Tab>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [transcribedText, setTranscribedText] = useState("");
  const [showRawData, setShowRawData] = useState(false);
  const [rawTranscription, setRawTranscription] = useState("");

  // QR code state
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrSessionToken, setQrSessionToken] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_SIZE) {
        throw new Error("File too large (max 20 MB).");
      }

      let processedFile = file;
      if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
        processedFile = await convertHeicToJpeg(file);
      }

      const isImage = ["image/jpeg", "image/png", "image/webp"].includes(processedFile.type);
      const isPdf = processedFile.type === "application/pdf";
      const isDocx = processedFile.name.endsWith(".docx");

      if (isImage || isPdf) {
        const base64 = await fileToBase64(processedFile);
        const res = await fetch("/api/notebook/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, mimeType: processedFile.type }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "OCR failed");
        return data.markdown as string;
      }

      if (isDocx) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await processedFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      }

      throw new Error("Unsupported file type");
    },
    []
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError("");
      setLoading(true);
      try {
        const results: string[] = [];
        for (const file of files) {
          const text = await processFile(file);
          if (text) results.push(text);
        }
        if (results.length > 0) {
          const combined = results.join("\n\n---\n\n");
          setTranscribedText(combined);
          setRawTranscription(combined);
          addToast("Notes processed successfully!", "success");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Processing failed";
        setError(msg);
        addToast(msg, "error");
      } finally {
        setLoading(false);
      }
    },
    [processFile, addToast]
  );

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      setError("Please enter or paste some text.");
      return;
    }
    setTranscribedText(pasteText.trim());
    setRawTranscription(pasteText.trim());
    addToast("Notes submitted!", "success");
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notebook/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQrDataUrl(data.qrDataUrl);
      setQrSessionToken(data.sessionToken);

      pollingRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch("/api/notebook/qr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "check", sessionToken: data.sessionToken }),
          });
          const checkData = await checkRes.json();
          if (checkData.status === "submitted" && checkData.filesData) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setLoading(true);
            const results: string[] = [];
            for (const fileInfo of checkData.filesData) {
              const ocrRes = await fetch("/api/notebook/ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ file: fileInfo.file, mimeType: fileInfo.mimeType }),
              });
              const ocrData = await ocrRes.json();
              if (ocrRes.ok && ocrData.markdown) results.push(ocrData.markdown);
            }
            if (results.length > 0) {
              const combined = results.join("\n\n---\n\n");
              setTranscribedText(combined);
              setRawTranscription(combined);
              addToast("Photos received from phone!", "success");
            }
            setQrDataUrl("");
            setQrSessionToken("");
            setLoading(false);
          }
        } catch {
          // Continue polling
        }
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "QR generation failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Raw data modal
  if (showRawData) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Pulp, sans-serif" }}>
            Raw <span style={{ color: "#00ac73" }}>Transcription</span>
          </h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            This is the unprocessed text from OCR / document parsing.
          </p>
        </div>

        <div className="rounded-2xl border p-4 max-h-[400px] overflow-y-auto" style={{ background: "#f9fafb", borderColor: "#e5e7eb" }}>
          <pre className="text-sm whitespace-pre-wrap" style={{ color: "#374151" }}>
            {rawTranscription}
          </pre>
        </div>

        <Button
          type="button"
          onClick={() => setShowRawData(false)}
          className="w-full h-11 rounded-xl text-sm font-medium"
          style={{ background: "#00ac73", color: "#fff" }}
        >
          Back to Notes
        </Button>
      </div>
    );
  }

  // Review transcription
  if (transcribedText) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Pulp, sans-serif" }}>
              Review <span style={{ color: "#00ac73" }}>Notes</span>
            </h2>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              Edit the extracted notes before generating the report.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setShowRawData(true)}
            className="h-9 rounded-lg px-4 text-xs font-medium"
            style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}
          >
            View Raw Data
          </Button>
        </div>

        <div className="rounded-2xl border p-1" style={{ background: "#fff", borderColor: "#e5e7eb" }}>
          <textarea
            value={transcribedText}
            onChange={(e) => setTranscribedText(e.target.value)}
            className="w-full min-h-[300px] rounded-xl border-0 p-4 text-sm leading-relaxed focus:outline-none resize-y"
            style={{ background: "#fff", color: "#374151" }}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => setTranscribedText("")}
            className="h-11 flex-1 rounded-xl text-sm font-medium"
            style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db" }}
          >
            Re-upload
          </Button>
          <Button
            type="button"
            onClick={() => onNotesSubmitted(transcribedText)}
            className="h-11 flex-1 rounded-xl text-sm font-semibold"
            style={{ background: "#00ac73", color: "#fff" }}
          >
            Generate Report
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Pulp, sans-serif" }}>
          Upload <span style={{ color: "#00ac73" }}>Experimental Notes</span>
        </h2>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          Upload notes from your experiment using protocol: <strong>{protocolTitle}</strong>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: "#f3f4f6" }}>
        {(["upload", "paste", "qr"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError(""); }}
            className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: tab === t ? "#fff" : "transparent",
              color: tab === t ? "#00ac73" : "#6b7280",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t === "upload" ? "Upload Files" : t === "paste" ? "Paste / Write" : "Scan (QR)"}
          </button>
        ))}
      </div>

      {tab === "upload" && (
        <FileDropZone
          onFiles={handleFiles}
          loading={loading}
          loadingMessage="Processing with Mistral OCR..."
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.docx"
          label="Drop experiment notes here"
          sublabel="Photos of lab notebook pages, PDFs, or DOCX files"
        />
      )}

      {tab === "paste" && (
        <div className="space-y-4">
          <div className="rounded-2xl border p-1" style={{ background: "#fff", borderColor: "#e5e7eb" }}>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste or type your experimental notes here..."
              className="w-full min-h-[250px] rounded-xl border-0 p-4 text-sm leading-relaxed focus:outline-none resize-y"
              style={{ background: "#fff", color: "#374151" }}
            />
          </div>
          <Button
            type="button"
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim()}
            className="w-full h-11 rounded-xl text-sm font-semibold"
            style={{ background: pasteText.trim() ? "#00ac73" : "#d1d5db", color: "#fff" }}
          >
            Submit Notes
          </Button>
        </div>
      )}

      {tab === "qr" && (
        <div className="flex flex-col items-center gap-6 py-4">
          {qrDataUrl ? (
            <>
              <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e5e7eb" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code" width={250} height={250} />
              </div>
              <p className="text-sm text-center" style={{ color: "#6b7280" }}>
                Scan to take photos of your lab notebook pages.
                <br />
                <span className="font-medium" style={{ color: "#00ac73" }}>Waiting for photos...</span>
              </p>
            </>
          ) : (
            <>
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl" style={{ background: "#f3f4f6" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="3" height="3" />
                </svg>
              </div>
              <Button
                type="button"
                onClick={handleGenerateQR}
                disabled={loading}
                className="h-11 rounded-xl px-8 text-sm font-semibold"
                style={{ background: "#00ac73", color: "#fff" }}
              >
                Generate QR Code
              </Button>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-center" style={{ color: "#ef4444" }}>{error}</p>
      )}

      <Button
        type="button"
        onClick={onBack}
        className="w-full h-11 rounded-xl text-sm font-medium"
        style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db" }}
      >
        Back to Protocol
      </Button>
    </div>
  );
}
