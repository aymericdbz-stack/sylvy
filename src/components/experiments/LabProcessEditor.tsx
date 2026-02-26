"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseOcrIntoDateBlocks } from "@/lib/utils/parseOcrDateBlocks";
import type {
  LabBlockPayload,
  LabImageOcrBlockPayload,
  LabTextBlockPayload,
  OcrDateBlock,
} from "@/lib/types/labProcess";

type SaveStatus = "idle" | "saving" | "saved" | "uploading" | "processing" | "error";

type LabEntry = {
  id: string | null;
  tempId: string;
  order: number;
  payload: LabBlockPayload;
  storageUrl: string | null;
  saveStatus: SaveStatus;
};

interface LabProcessEditorProps {
  reportId: string | null;
  experimentId: string;
  orgId: string;
}

let _tempCounter = 0;
function newTempId() {
  return `temp-${++_tempCounter}`;
}

export default function LabProcessEditor({ reportId, experimentId, orgId }: LabProcessEditorProps) {
  const [entries, setEntries] = useState<LabEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [labNotebookHeadingId, setLabNotebookHeadingId] = useState<string | null>(null);

  const saveTimers = useRef(new Map<string, NodeJS.Timeout>());
  const inFlight = useRef(new Map<string, Promise<void>>());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load lab process blocks on mount or when reportId resolves
  useEffect(() => {
    if (!reportId) return;
    setReady(false);

    const init = async () => {
      const supabase = createClient();

      const { data: allBlocks } = await supabase
        .from("report_blocks")
        .select("*")
        .eq("report_id", reportId)
        .order("order", { ascending: true });

      if (!allBlocks) {
        setReady(true);
        return;
      }

      const lnHeading = allBlocks.find(
        (b) => b.type === "heading" && /lab\s*notebook/i.test(b.content || ""),
      );

      if (lnHeading) {
        setLabNotebookHeadingId(lnHeading.id);

        const nextHeadingOrder =
          allBlocks.find((b) => b.type === "heading" && b.order > lnHeading.order)?.order ??
          Infinity;

        const labBlocks = allBlocks.filter(
          (b) => b.type === "text" && b.order > lnHeading.order && b.order < nextHeadingOrder,
        );

        const loaded: LabEntry[] = labBlocks.map((b) => {
          let payload: LabBlockPayload;
          try {
            const parsed = JSON.parse(b.content || "");
            if (parsed.__blockKind === "lab_text" || parsed.__blockKind === "lab_image_ocr") {
              payload = parsed as LabBlockPayload;
            } else {
              payload = { __blockKind: "lab_text", text: b.content || "" };
            }
          } catch {
            // Legacy plain text — migrate to lab_text format in memory
            payload = { __blockKind: "lab_text", text: b.content || "" };
          }

          return {
            id: b.id,
            tempId: newTempId(),
            order: b.order,
            payload,
            storageUrl: b.storage_url ?? null,
            saveStatus: "idle",
          };
        });

        setEntries(loaded);
      }

      setReady(true);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const getNextOrder = useCallback(async (): Promise<number> => {
    if (!reportId) return 1;
    const supabase = createClient();
    const { data } = await supabase
      .from("report_blocks")
      .select("order")
      .eq("report_id", reportId)
      .order("order", { ascending: false })
      .limit(1);
    return (data?.[0]?.order ?? 0) + 1;
  }, [reportId]);

  const saveEntry = useCallback(async (entryId: string, payload: LabBlockPayload) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, saveStatus: "saving" } : e)),
    );
    const supabase = createClient();
    await supabase
      .from("report_blocks")
      .update({ content: JSON.stringify(payload) })
      .eq("id", entryId);
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, saveStatus: "saved" } : e)),
    );
    setTimeout(() => {
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId && e.saveStatus === "saved" ? { ...e, saveStatus: "idle" } : e)),
      );
    }, 2000);
  }, []);

  const scheduleSave = useCallback(
    (entryId: string, payload: LabBlockPayload) => {
      const existing = saveTimers.current.get(entryId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        saveTimers.current.delete(entryId);
        const p = saveEntry(entryId, payload);
        inFlight.current.set(entryId, p);
        p.finally(() => inFlight.current.delete(entryId));
      }, 1500);
      saveTimers.current.set(entryId, timer);
    },
    [saveEntry],
  );

  const handleTextChange = useCallback(
    (tempId: string, text: string) => {
      setEntries((prev) =>
        prev.map((e) => {
          if (e.tempId !== tempId) return e;
          const newPayload: LabTextBlockPayload = { __blockKind: "lab_text", text };
          if (e.id) scheduleSave(e.id, newPayload);
          return { ...e, payload: newPayload };
        }),
      );
    },
    [scheduleSave],
  );

  const handleOcrTextChange = useCallback(
    (tempId: string, blockIndex: number, text: string) => {
      setEntries((prev) =>
        prev.map((e) => {
          if (e.tempId !== tempId || e.payload.__blockKind !== "lab_image_ocr") return e;
          const dateBlocks: OcrDateBlock[] = e.payload.dateBlocks.map((db, i) =>
            i === blockIndex ? { ...db, text } : db,
          );
          const newPayload: LabImageOcrBlockPayload = { ...e.payload, dateBlocks };
          if (e.id) scheduleSave(e.id, newPayload);
          return { ...e, payload: newPayload };
        }),
      );
    },
    [scheduleSave],
  );

  const ensureLabNotebookHeading = useCallback(
    async (currentOrder: number): Promise<string | null> => {
      if (labNotebookHeadingId) return labNotebookHeadingId;
      if (!reportId) return null;
      const supabase = createClient();
      const { data: created } = await supabase
        .from("report_blocks")
        .insert({
          report_id: reportId,
          template_block_id: null,
          type: "heading",
          order: currentOrder,
          content: "Lab Notebook",
        })
        .select()
        .single();
      const id = created?.id ?? null;
      setLabNotebookHeadingId(id);
      return id;
    },
    [reportId, labNotebookHeadingId],
  );

  const addTextEntry = useCallback(async () => {
    if (!reportId) return;
    const supabase = createClient();
    const order = await getNextOrder();
    await ensureLabNotebookHeading(order);
    const insertOrder = await getNextOrder();

    const payload: LabTextBlockPayload = { __blockKind: "lab_text", text: "" };
    const { data: newBlock } = await supabase
      .from("report_blocks")
      .insert({
        report_id: reportId,
        template_block_id: null,
        type: "text",
        order: insertOrder,
        content: JSON.stringify(payload),
      })
      .select()
      .single();

    if (!newBlock) return;

    setEntries((prev) => [
      ...prev,
      {
        id: newBlock.id,
        tempId: newTempId(),
        order: insertOrder,
        payload,
        storageUrl: null,
        saveStatus: "idle",
      },
    ]);
  }, [reportId, getNextOrder, ensureLabNotebookHeading]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!reportId) return;

      const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
      if (!ALLOWED.has(file.type)) {
        alert("Only JPEG, PNG, and WebP images are supported.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert("Image must be smaller than 20 MB.");
        return;
      }

      const tempId = newTempId();
      const objectUrl = URL.createObjectURL(file);

      setEntries((prev) => [
        ...prev,
        {
          id: null,
          tempId,
          order: 0,
          payload: { __blockKind: "lab_image_ocr", dateBlocks: [], rawOcrMarkdown: "" },
          storageUrl: objectUrl,
          saveStatus: "uploading",
        },
      ]);

      try {
        const supabase = createClient();

        const order = await getNextOrder();
        await ensureLabNotebookHeading(order);

        // Upload image to Supabase storage
        const path = `${orgId}/${experimentId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("experiment-files")
          .upload(path, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("experiment-files").getPublicUrl(path);

        // Switch status to OCR processing
        setEntries((prev) =>
          prev.map((e) => (e.tempId === tempId ? { ...e, saveStatus: "processing" } : e)),
        );

        // Convert file to base64 for OCR
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Call Mistral OCR
        const ocrRes = await fetch("/api/notebook/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, mimeType: file.type }),
        });

        if (!ocrRes.ok) throw new Error("OCR failed");
        const { markdown } = (await ocrRes.json()) as { markdown: string };

        const dateBlocks = parseOcrIntoDateBlocks(markdown);
        const insertOrder = await getNextOrder();
        const payload: LabImageOcrBlockPayload = {
          __blockKind: "lab_image_ocr",
          dateBlocks,
          rawOcrMarkdown: markdown,
        };

        const { data: newBlock } = await supabase
          .from("report_blocks")
          .insert({
            report_id: reportId,
            template_block_id: null,
            type: "text",
            order: insertOrder,
            content: JSON.stringify(payload),
            storage_url: publicUrl,
          })
          .select()
          .single();

        if (!newBlock) throw new Error("Failed to save block");

        setEntries((prev) =>
          prev.map((e) =>
            e.tempId === tempId
              ? {
                  ...e,
                  id: newBlock.id,
                  order: insertOrder,
                  payload,
                  storageUrl: publicUrl,
                  saveStatus: "idle",
                }
              : e,
          ),
        );

        // Clean up object URL
        URL.revokeObjectURL(objectUrl);
      } catch {
        setEntries((prev) =>
          prev.map((e) => (e.tempId === tempId ? { ...e, saveStatus: "error" } : e)),
        );
      }
    },
    [reportId, orgId, experimentId, getNextOrder, ensureLabNotebookHeading],
  );

  const deleteEntry = useCallback(async (tempId: string, id: string | null) => {
    if (id) {
      const supabase = createClient();
      await supabase.from("report_blocks").delete().eq("id", id);
    }
    setEntries((prev) => prev.filter((e) => e.tempId !== tempId));
  }, []);

  // Flush pending saves before PDF export
  const flushPendingSaves = useCallback(async () => {
    const tasks: Array<Promise<void>> = [];

    for (const [id, timer] of saveTimers.current.entries()) {
      clearTimeout(timer);
      saveTimers.current.delete(id);
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        const p = saveEntry(id, entry.payload);
        inFlight.current.set(id, p);
        p.finally(() => inFlight.current.delete(id));
        tasks.push(p);
      }
    }

    for (const p of inFlight.current.values()) {
      tasks.push(p);
    }

    if (tasks.length > 0) await Promise.allSettled(tasks);
  }, [entries, saveEntry]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { experimentId?: string; add?: (p: Promise<void>) => void }
        | undefined;
      if (!detail?.add) return;
      if (detail.experimentId && detail.experimentId !== experimentId) return;
      detail.add(flushPendingSaves());
    };

    window.addEventListener("sylvy:reportBlocksFlush", handler as EventListener);
    return () => window.removeEventListener("sylvy:reportBlocksFlush", handler as EventListener);
  }, [experimentId, flushPendingSaves]);

  useEffect(() => {
    return () => {
      for (const timer of saveTimers.current.values()) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) =>
        entry.payload.__blockKind === "lab_text" ? (
          <LabTextEntry
            key={entry.tempId}
            tempId={entry.tempId}
            text={entry.payload.text}
            saveStatus={entry.saveStatus}
            onTextChange={handleTextChange}
            onDelete={() => deleteEntry(entry.tempId, entry.id)}
          />
        ) : (
          <LabImageEntry
            key={entry.tempId}
            tempId={entry.tempId}
            storageUrl={entry.storageUrl}
            dateBlocks={entry.payload.dateBlocks}
            saveStatus={entry.saveStatus}
            onOcrTextChange={handleOcrTextChange}
            onDelete={() => deleteEntry(entry.tempId, entry.id)}
          />
        ),
      )}

      {!ready && <p className="text-[12px] text-nb-muted italic">Loading...</p>}

      {ready && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={addTextEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-[600] border border-nb-cream-border rounded-[6px] text-nb-muted hover:text-nb-charcoal hover:border-nb-charcoal transition-colors font-nb-mono"
          >
            + Add text note
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-[600] border border-nb-cream-border rounded-[6px] text-nb-muted hover:text-nb-charcoal hover:border-nb-charcoal transition-colors font-nb-mono"
          >
            + Upload photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface LabTextEntryProps {
  tempId: string;
  text: string;
  saveStatus: SaveStatus;
  onTextChange: (tempId: string, text: string) => void;
  onDelete: () => void;
}

function LabTextEntry({ tempId, text, saveStatus, onTextChange, onDelete }: LabTextEntryProps) {
  return (
    <div className="relative group border border-nb-cream-border rounded-[6px] p-3">
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-nb-muted hover:text-red-400 transition-opacity text-[11px] leading-none"
        title="Delete entry"
      >
        ✕
      </button>
      <textarea
        value={text}
        onChange={(e) => onTextChange(tempId, e.target.value)}
        placeholder="Write your lab notes..."
        rows={4}
        className="w-full text-[13px] font-nb-mono resize-none focus:outline-none pr-5"
      />
      {saveStatus !== "idle" && (
        <p className="text-[10px] text-nb-muted mt-1">
          {saveStatus === "saving" ? "Saving..." : "Saved"}
        </p>
      )}
    </div>
  );
}

interface LabImageEntryProps {
  tempId: string;
  storageUrl: string | null;
  dateBlocks: OcrDateBlock[];
  saveStatus: SaveStatus;
  onOcrTextChange: (tempId: string, blockIndex: number, text: string) => void;
  onDelete: () => void;
}

function LabImageEntry({
  tempId,
  storageUrl,
  dateBlocks,
  saveStatus,
  onOcrTextChange,
  onDelete,
}: LabImageEntryProps) {
  const isLoading = saveStatus === "uploading" || saveStatus === "processing";

  return (
    <div className="border border-nb-cream-border rounded-[6px] p-3">
      {/* Header row: thumbnail + status + delete */}
      <div className="flex items-start gap-3 mb-3">
        {storageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storageUrl}
            alt="Lab notebook page"
            className="w-20 h-20 object-cover rounded-[4px] flex-shrink-0 border border-nb-cream-border"
          />
        )}
        <div className="flex-1 min-w-0 pt-1">
          {isLoading && (
            <p className="text-[12px] text-nb-muted font-nb-mono italic">
              {saveStatus === "uploading" ? "Uploading..." : "Processing OCR..."}
            </p>
          )}
          {saveStatus === "error" && (
            <p className="text-[12px] text-red-500 font-nb-mono">
              OCR failed. You can type the content manually below.
            </p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-nb-muted hover:text-red-400 text-[11px] leading-none flex-shrink-0 mt-1"
          title="Delete entry"
        >
          ✕
        </button>
      </div>

      {/* Date blocks */}
      {dateBlocks.length > 0 && (
        <div className="flex flex-col gap-3">
          {dateBlocks.map((db, i) => (
            <div key={i}>
              {db.date && (
                <span className="inline-block mb-1.5 px-2 py-0.5 bg-[#e8f5f0] text-nb-green text-[11px] font-[700] rounded-[4px] font-nb-mono tracking-wide">
                  {db.date}
                </span>
              )}
              {!db.date && dateBlocks.length > 1 && (
                <span className="inline-block mb-1.5 px-2 py-0.5 bg-nb-cream-border text-nb-muted text-[11px] font-[600] rounded-[4px] font-nb-mono">
                  No date
                </span>
              )}
              <textarea
                value={db.text}
                onChange={(e) => onOcrTextChange(tempId, i, e.target.value)}
                rows={3}
                className="w-full text-[13px] font-nb-mono resize-none focus:outline-none border border-nb-cream-border rounded-[4px] p-2"
                placeholder="OCR text..."
              />
            </div>
          ))}
        </div>
      )}

      {/* Save status */}
      {(saveStatus === "saving" || saveStatus === "saved") && (
        <p className="text-[10px] text-nb-muted mt-1">
          {saveStatus === "saving" ? "Saving..." : "Saved"}
        </p>
      )}
    </div>
  );
}
