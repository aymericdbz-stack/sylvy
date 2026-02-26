"use client";

import { useCallback, useRef, useState } from "react";

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
}

export function FileDropZone({
  onFiles,
  accept = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.docx,.pptx",
  multiple = true,
  loading = false,
  loadingMessage = "Processing...",
  label = "Drop your files here",
  sublabel = "or click to browse",
  disabled = false,
}: FileDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || loading) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles(multiple ? files : [files[0]]);
    },
    [onFiles, multiple, disabled, loading]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) onFiles(files);
      e.target.value = "";
    },
    [onFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !loading) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && !loading && fileInputRef.current?.click()}
      className="relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-all"
      style={{
        borderColor: dragOver ? "#00ac73" : "#d1d5db",
        background: dragOver ? "#ecfdf5" : "#ffffff",
        minHeight: 220,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled || loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4"
            style={{ borderColor: "#d1fae5", borderTopColor: "#00ac73" }}
          />
          <p className="text-sm font-medium" style={{ color: "#00ac73" }}>
            {loadingMessage}
          </p>
        </div>
      ) : (
        <>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div className="text-center">
            <p className="text-base font-medium" style={{ color: "#374151" }}>
              {label}
            </p>
            <p className="text-sm" style={{ color: "#9ca3af" }}>
              {sublabel}
            </p>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}
