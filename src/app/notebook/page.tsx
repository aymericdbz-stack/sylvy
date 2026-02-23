"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockType = "text" | "h1" | "h2" | "h3" | "bullet" | "numbered" | "todo" | "callout" | "divider" | "subpage";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  linkedPageId?: string;
}

interface Page {
  id: string;
  emoji: string;
  title: string;
  parentId: string | null;
  childIds: string[];
  blocks: Block[];
}

type PageMap = Record<string, Page>;
type SlashItem = { label: string; desc: string; type: BlockType; icon: string };

// ─── Utils ────────────────────────────────────────────────────────────────────

let _c = 0;
const uid = () => `b${Date.now()}${++_c}`;
const mkBlock = (type: BlockType = "text", content = "", extra?: Partial<Block>): Block => ({
  id: uid(), type, content, ...extra,
});

const SLASH_ITEMS: SlashItem[] = [
  { label: "Text", desc: "Plain paragraph", type: "text", icon: "¶" },
  { label: "Heading 1", desc: "Big section heading", type: "h1", icon: "H1" },
  { label: "Heading 2", desc: "Medium heading", type: "h2", icon: "H2" },
  { label: "Heading 3", desc: "Small heading", type: "h3", icon: "H3" },
  { label: "Bulleted list", desc: "Simple list", type: "bullet", icon: "•" },
  { label: "Numbered list", desc: "Ordered list", type: "numbered", icon: "1." },
  { label: "To-do", desc: "Task with checkbox", type: "todo", icon: "☐" },
  { label: "Callout", desc: "Highlighted block", type: "callout", icon: "💡" },
  { label: "Divider", desc: "Horizontal separator", type: "divider", icon: "—" },
  { label: "Page", desc: "New sub-page inside", type: "subpage", icon: "📄" },
];

const EMOJIS = ["📋","🧪","🔬","📊","🦠","🧬","🔢","⚗️","🧫","💉","🩺","📌","📍","🗂️","📁","✅","🔵","🟢","🟡","🔴"];

// ─── Initial mock data ────────────────────────────────────────────────────────

const mkWbBlocks = (): Block[] => [
  mkBlock("h1", "Western Blot — PLP1 Expression in HEK293T"),
  mkBlock("text", "February 20, 2026 · Expression Validation"),
  mkBlock("divider"),
  mkBlock("h2", "Objective"),
  mkBlock("text", "Assess PLP1 overexpression in HEK293T cells transfected with pCMV-PLP1 vs. empty-vector control via SDS-PAGE and immunoblotting."),
  mkBlock("h2", "Protocol"),
  mkBlock("numbered", "Harvest HEK293T cells 48 h post-transfection with 200 µL ice-cold RIPA buffer per well."),
  mkBlock("numbered", "Incubate 15 min on ice, centrifuge 14 000 × g / 10 min / 4 °C."),
  mkBlock("numbered", "BCA protein assay — normalize all samples to 30 µg total protein per lane."),
  mkBlock("numbered", "Add 4× Laemmli buffer, boil 95 °C / 5 min. Load onto 12 % SDS-PAGE gel — run 120 V / 90 min."),
  mkBlock("numbered", "Transfer to 0.45 µm PVDF membrane — 100 V / 60 min / 4 °C."),
  mkBlock("numbered", "Block with 5 % skimmed milk in TBST / 1 h RT. Incubate anti-PLP1 1:1 000 overnight 4 °C."),
  mkBlock("numbered", "Wash 3× TBST. HRP secondary 1:5 000 / 1 h RT. Develop with ECL, image on ChemiDoc."),
  mkBlock("callout", "⚗️  Gel 12 %  ·  Transfer 100 V / 60 min  ·  Primary Ab 1:1 000  ·  Secondary Ab 1:5 000  ·  5 % skimmed milk  ·  30 µg / lane"),
  mkBlock("h2", "Results"),
  mkBlock("text", "Prominent band at ~30 kDa in PLP1-transfected lane. No band in empty-vector control. β-actin (~42 kDa) uniform across all lanes. High signal-to-noise ratio, minimal background."),
  mkBlock("h2", "Observations"),
  mkBlock("bullet", "Transfection efficiency ~70 % based on GFP co-reporter fluorescence."),
  mkBlock("bullet", "Faint secondary band at ~60 kDa — possible dimer or PTM. Worth a non-denaturing gel comparison."),
  mkBlock("bullet", "Exposure 30 s. Shorter exposures may be needed if overexpression is confirmed quantitatively."),
  mkBlock("h2", "Conclusion"),
  mkBlock("text", "PLP1 successfully overexpressed under CMV promoter. Construct validated, antibody specificity confirmed. Next: ImageJ densitometry + plasmid dose-response to identify saturation point."),
];

const buildPages = (): PageMap => {
  const ids = { wb: "m-wb", elisa: "m-elisa", tit: "m-tit", ev: "e-ev", dr: "e-dr", p1: "p-1", p2: "p-2", pr: "e-pr" };
  return {
    [ids.p1]: { id: ids.p1, emoji: "🔬", title: "PLP1 Overexpression Study", parentId: null, childIds: [ids.ev, ids.dr], blocks: [mkBlock("text", "Study of PLP1 overexpression in HEK293T cells using transient transfection.")] },
    [ids.ev]: { id: ids.ev, emoji: "🧪", title: "Expression Validation", parentId: ids.p1, childIds: [ids.wb, ids.elisa], blocks: [mkBlock("text", "Protein-level validation of PLP1 expression.")] },
    [ids.wb]: { id: ids.wb, emoji: "📋", title: "Western Blot — Feb 20", parentId: ids.ev, childIds: [], blocks: mkWbBlocks() },
    [ids.elisa]: { id: ids.elisa, emoji: "📊", title: "ELISA Quantification", parentId: ids.ev, childIds: [], blocks: [mkBlock("text", "")] },
    [ids.dr]: { id: ids.dr, emoji: "🔢", title: "Dose-Response Curve", parentId: ids.p1, childIds: [ids.tit], blocks: [mkBlock("text", "Titrate plasmid concentration to identify saturation point.")] },
    [ids.tit]: { id: ids.tit, emoji: "📋", title: "Plasmid Titration WB", parentId: ids.dr, childIds: [], blocks: [mkBlock("text", "")] },
    [ids.p2]: { id: ids.p2, emoji: "🦠", title: "HEK293T Baseline", parentId: null, childIds: [ids.pr], blocks: [mkBlock("text", "Baseline characterisation of the HEK293T cell line.")] },
    [ids.pr]: { id: ids.pr, emoji: "🧬", title: "Proteome Profiling", parentId: ids.p2, childIds: [], blocks: [mkBlock("text", "")] },
  };
};

// ─── Slash menu ───────────────────────────────────────────────────────────────

function SlashMenu({ query, onSelect, onClose }: { query: string; onSelect: (item: SlashItem) => void; onClose: () => void }) {
  const [active, setActive] = useState(0);
  const filtered = SLASH_ITEMS.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); if (filtered[active]) onSelect(filtered[active]); }
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, filtered, onSelect, onClose]);

  if (!filtered.length) return null;

  return (
    <div className="absolute z-50 mt-1 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
      <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Blocks</p>
      {filtered.map((item, i) => (
        <button
          key={item.type}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
          className={`flex w-full items-center gap-3 px-3 py-1.5 text-left transition ${i === active ? "bg-neutral-100" : "hover:bg-neutral-50"}`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-xs font-bold text-neutral-600">
            {item.icon}
          </span>
          <div>
            <p className="text-sm font-medium text-neutral-800">{item.label}</p>
            <p className="text-[11px] text-neutral-400">{item.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Block row ────────────────────────────────────────────────────────────────

function BlockRow({
  block,
  index,
  isFirst,
  listNum,
  onUpdate,
  onNew,
  onDelete,
  onTypeChange,
  onNavigate,
  focusMe,
}: {
  block: Block;
  index: number;
  isFirst: boolean;
  listNum: number;
  onUpdate: (content: string) => void;
  onNew: () => void;
  onDelete: () => void;
  onTypeChange: (type: BlockType) => void;
  onNavigate: (pageId: string) => void;
  focusMe: boolean;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [checked, setChecked] = useState(block.checked ?? false);

  // auto-focus
  useEffect(() => {
    if (focusMe && taRef.current) {
      taRef.current.focus();
      const len = taRef.current.value.length;
      taRef.current.setSelectionRange(len, len);
    }
  }, [focusMe]);

  // auto-resize textarea
  const resize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };
  useEffect(resize, [block.content]);

  const handleChange = (val: string) => {
    onUpdate(val);
    if (val.startsWith("/")) setSlashQuery(val.slice(1));
    else setSlashQuery(null);
    resize();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && slashQuery === null) {
      e.preventDefault();
      onNew();
    } else if (e.key === "Backspace" && block.content === "" && !isFirst) {
      e.preventDefault();
      onDelete();
    }
  };

  const handleSlashSelect = (item: SlashItem) => {
    setSlashQuery(null);
    if (item.type === "subpage") {
      onTypeChange("subpage");
      onUpdate("");
    } else {
      onTypeChange(item.type);
      onUpdate("");
    }
    setTimeout(() => taRef.current?.focus(), 0);
  };

  // ── Divider ──
  if (block.type === "divider") {
    return (
      <div className="group relative flex items-center py-2">
        <hr className="w-full border-neutral-200" />
        <button
          type="button"
          onClick={onDelete}
          className="absolute right-0 hidden rounded p-0.5 text-neutral-300 hover:bg-neutral-100 hover:text-neutral-500 group-hover:flex"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
          </svg>
        </button>
      </div>
    );
  }

  // ── Sub-page block ──
  if (block.type === "subpage" && block.linkedPageId) {
    return (
      <button
        type="button"
        onClick={() => block.linkedPageId && onNavigate(block.linkedPageId)}
        className="group flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-left transition hover:border-neutral-300 hover:bg-neutral-100"
      >
        <span className="text-xl">📄</span>
        <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
          {block.content || "Untitled"}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="ml-auto h-4 w-4 text-neutral-300 group-hover:text-neutral-500">
          <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  // ── Text-based blocks ──
  const taClass = "w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-neutral-300";

  const typeStyles: Record<string, string> = {
    h1: "text-3xl font-bold text-neutral-900 py-1",
    h2: "text-xl font-semibold text-neutral-800 py-0.5 mt-5",
    h3: "text-base font-semibold text-neutral-700 py-0.5 mt-3",
    text: "text-sm leading-relaxed text-neutral-700 py-0.5",
    bullet: "text-sm leading-relaxed text-neutral-700 py-0.5",
    numbered: "text-sm leading-relaxed text-neutral-700 py-0.5",
    todo: "text-sm leading-relaxed py-0.5",
    callout: "text-sm leading-relaxed text-neutral-700",
  };

  const PLACEHOLDERS: Partial<Record<BlockType, string>> = {
    h1: "Heading 1", h2: "Heading 2", h3: "Heading 3",
    text: "Type '/' for commands…", bullet: "List item", numbered: "List item",
    todo: "To-do", callout: "Callout text…",
  };
  const placeholder = isFirst && block.type === "text" ? "Type '/' for commands…" : (PLACEHOLDERS[block.type] ?? "");

  const inner = (
    <div className="relative flex-1">
      <textarea
        ref={taRef}
        value={block.content}
        rows={1}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`${taClass} ${typeStyles[block.type] ?? typeStyles.text}`}
        style={block.checked ? { textDecoration: "line-through", color: "#9ca3af" } : undefined}
      />
      {slashQuery !== null && (
        <SlashMenu query={slashQuery} onSelect={handleSlashSelect} onClose={() => setSlashQuery(null)} />
      )}
    </div>
  );

  return (
    <div className="group relative flex items-start gap-2">
      {/* Drag handle */}
      <button
        type="button"
        className="mt-0.5 hidden h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded text-neutral-300 hover:bg-neutral-100 hover:text-neutral-500 group-hover:flex"
        draggable
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
          <path d="M5.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM5.5 10a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10.5 10a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
        </svg>
      </button>

      <div className="flex-1">
        {block.type === "bullet" && (
          <div className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
            {inner}
          </div>
        )}
        {block.type === "numbered" && (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-5 shrink-0 text-right text-sm text-neutral-400">{listNum}.</span>
            {inner}
          </div>
        )}
        {block.type === "todo" && (
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => setChecked(!checked)}
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${checked ? "border-green-600 bg-green-600" : "border-neutral-300 bg-white hover:border-neutral-400"}`}
            >
              {checked && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="white" className="h-3 w-3">
                  <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              )}
            </button>
            {inner}
          </div>
        )}
        {block.type === "callout" && (
          <div className="flex items-start gap-3 rounded-lg bg-green-50 px-4 py-3 border-l-4 border-green-400">
            {inner}
          </div>
        )}
        {(block.type === "text" || block.type === "h1" || block.type === "h2" || block.type === "h3") && inner}
      </div>
    </div>
  );
}

// ─── Emoji picker ─────────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute z-50 mt-1 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl">
      <div className="grid grid-cols-10 gap-1">
        {EMOJIS.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => { onSelect(e); onClose(); }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-neutral-100"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page editor ──────────────────────────────────────────────────────────────

function PageEditor({
  page,
  pages,
  onUpdatePage,
  onNavigate,
  onAddChildPage,
  breadcrumb,
  onSave,
}: {
  page: Page;
  pages: PageMap;
  onUpdatePage: (p: Page) => void;
  onNavigate: (id: string) => void;
  onAddChildPage: (parentId: string, navigateTo?: boolean) => string;
  breadcrumb: Page[];
  onSave: () => void;
}) {
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateBlocks = (blocks: Block[]) => onUpdatePage({ ...page, blocks });
  const updateTitle = (title: string) => onUpdatePage({ ...page, title });
  const updateEmoji = (emoji: string) => onUpdatePage({ ...page, emoji });

  const addBlock = (afterIndex: number, type: BlockType = "text") => {
    const nb = mkBlock(type);
    const next = [...page.blocks];
    next.splice(afterIndex + 1, 0, nb);
    setFocusBlockId(nb.id);
    updateBlocks(next);
    return nb;
  };

  const deleteBlock = (id: string) => {
    const idx = page.blocks.findIndex(b => b.id === id);
    if (idx <= 0) return;
    const prev = page.blocks[idx - 1];
    setFocusBlockId(prev.id);
    updateBlocks(page.blocks.filter(b => b.id !== id));
  };

  const updateBlock = (id: string, content: string) => {
    updateBlocks(page.blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const changeType = (id: string, type: BlockType) => {
    if (type === "subpage") {
      const childId = onAddChildPage(page.id, false);
      updateBlocks(page.blocks.map(b => b.id === id ? { ...b, type: "subpage", linkedPageId: childId, content: "Untitled" } : b));
      return;
    }
    updateBlocks(page.blocks.map(b => b.id === id ? { ...b, type } : b));
  };

  const handleSave = () => {
    setSaved(true);
    onSave();
    setTimeout(() => setSaved(false), 2000);
  };

  // numbered list counter: track per-block
  let numCounter = 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Top bar */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-neutral-100 px-4">
        {/* Breadcrumb */}
        <div className="flex min-w-0 flex-1 items-center gap-1 text-xs text-neutral-400">
          {breadcrumb.map((p, i) => (
            <span key={p.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-neutral-300">/</span>}
              <button
                type="button"
                onClick={() => onNavigate(p.id)}
                className={`max-w-[120px] truncate rounded px-1 py-0.5 transition hover:bg-neutral-100 hover:text-neutral-700 ${i === breadcrumb.length - 1 ? "font-medium text-neutral-700" : ""}`}
              >
                {p.emoji} {p.title || "Untitled"}
              </button>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${saved ? "bg-green-100 text-green-700" : "bg-green-600 text-white hover:bg-green-700"}`}
        >
          {saved ? "✓ Saved" : "Save"}
        </button>
      </div>

      {/* Scrollable page content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-16 pb-32 pt-16">
          {/* Emoji */}
          <div className="relative mb-2">
            <button
              type="button"
              onClick={() => setShowEmoji(s => !s)}
              className="rounded-lg p-1 text-5xl transition hover:bg-neutral-100"
              title="Change icon"
            >
              {page.emoji}
            </button>
            {showEmoji && (
              <EmojiPicker onSelect={updateEmoji} onClose={() => setShowEmoji(false)} />
            )}
          </div>

          {/* Title */}
          <textarea
            value={page.title}
            onChange={e => updateTitle(e.target.value)}
            placeholder="Untitled"
            rows={1}
            className="mb-8 w-full resize-none overflow-hidden bg-transparent text-4xl font-bold text-neutral-900 outline-none placeholder:text-neutral-200"
            style={{ lineHeight: "1.25" }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }}
          />

          {/* Blocks */}
          <div className="space-y-0.5">
            {page.blocks.map((block, i) => {
              if (block.type === "numbered") numCounter++;
              else numCounter = 0;

              return (
                <BlockRow
                  key={block.id}
                  block={block}
                  index={i}
                  isFirst={i === 0}
                  listNum={numCounter}
                  focusMe={focusBlockId === block.id}
                  onUpdate={(content) => updateBlock(block.id, content)}
                  onNew={() => addBlock(i)}
                  onDelete={() => deleteBlock(block.id)}
                  onTypeChange={(type) => changeType(block.id, type)}
                  onNavigate={onNavigate}
                />
              );
            })}

            {/* Empty state / add block */}
            {page.blocks.length === 0 && (
              <button
                type="button"
                onClick={() => addBlock(-1)}
                className="flex items-center gap-2 text-sm text-neutral-300 hover:text-neutral-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                Click to start writing, or type '/' for blocks
              </button>
            )}
          </div>

          {/* Sub-pages section */}
          {page.childIds.length > 0 && (
            <div className="mt-12">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">Pages inside</p>
              <div className="space-y-1.5">
                {page.childIds.map(cid => pages[cid] ? (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => onNavigate(cid)}
                    className="flex w-full items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-2.5 text-left transition hover:border-neutral-200 hover:bg-neutral-100"
                  >
                    <span className="text-base">{pages[cid].emoji}</span>
                    <span className="text-sm font-medium text-neutral-700">{pages[cid].title || "Untitled"}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="ml-auto h-4 w-4 text-neutral-300">
                      <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : null)}
              </div>
            </div>
          )}

          {/* Add sub-page button */}
          <button
            type="button"
            onClick={() => onAddChildPage(page.id, true)}
            className="mt-4 flex items-center gap-2 text-sm text-neutral-300 transition hover:text-green-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add a page inside
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar page tree item ───────────────────────────────────────────────────

function PageTreeItem({
  pageId, pages, currentPageId, depth, onNavigate, onAddChild,
}: {
  pageId: string; pages: PageMap; currentPageId: string; depth: number;
  onNavigate: (id: string) => void; onAddChild: (parentId: string) => void;
}) {
  const page = pages[pageId];
  const [expanded, setExpanded] = useState(depth < 2);
  if (!page) return null;

  const hasChildren = page.childIds.filter(c => pages[c]).length > 0;
  const isActive = currentPageId === pageId;

  return (
    <div>
      <div
        className={`group flex items-center gap-0.5 rounded-md py-0.5 pr-1 transition select-none ${isActive ? "bg-neutral-200 text-neutral-900" : "text-neutral-600 hover:bg-neutral-100"}`}
        style={{ paddingLeft: `${6 + depth * 14}px` }}
      >
        {/* Expand arrow */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-700 ${!hasChildren ? "opacity-0 pointer-events-none" : ""}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-3 w-3 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}>
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Emoji + title */}
        <button
          type="button"
          onClick={() => onNavigate(pageId)}
          className="flex flex-1 min-w-0 items-center gap-1.5"
        >
          <span className="shrink-0 text-sm">{page.emoji}</span>
          <span className={`truncate text-[13px] ${isActive ? "font-semibold" : "font-normal"}`}>
            {page.title || "Untitled"}
          </span>
        </button>

        {/* Hover actions */}
        <div className="hidden items-center gap-0.5 group-hover:flex">
          <button
            type="button"
            onClick={() => onAddChild(pageId)}
            title="Add sub-page"
            className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-300 hover:text-neutral-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {page.childIds.filter(c => pages[c]).map(childId => (
            <PageTreeItem
              key={childId}
              pageId={childId}
              pages={pages}
              currentPageId={currentPageId}
              depth={depth + 1}
              onNavigate={onNavigate}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  pages, currentPageId, onNavigate, onNewPage, onAddChild,
}: {
  pages: PageMap; currentPageId: string;
  onNavigate: (id: string) => void; onNewPage: () => void; onAddChild: (parentId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const rootIds = Object.values(pages).filter(p => p.parentId === null).map(p => p.id);

  const searchResults = search
    ? Object.values(pages).filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col bg-[#f7f7f5] border-r border-neutral-200">
      {/* Workspace header */}
      <div className="flex h-11 items-center gap-2 px-3 border-b border-neutral-200 shrink-0">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-600 text-white text-[11px] font-bold shrink-0">S</div>
        <span className="text-[13px] font-semibold text-neutral-800 truncate">Sylvy Lab</span>
        <div className="ml-auto h-2 w-2 shrink-0 rounded-full bg-green-500" title="Synced" />
      </div>

      {/* Quick actions */}
      <div className="px-2 pt-2 space-y-0.5 shrink-0">
        {searching ? (
          <div className="flex items-center gap-2 rounded-md bg-white border border-neutral-200 px-2 py-1.5 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-neutral-400">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onBlur={() => { if (!search) setSearching(false); }}
              onKeyDown={e => { if (e.key === "Escape") { setSearch(""); setSearching(false); } }}
              placeholder="Search pages…"
              className="flex-1 bg-transparent text-xs text-neutral-700 outline-none placeholder:text-neutral-400"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearching(true)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-500 transition hover:bg-neutral-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
            Search
            <kbd className="ml-auto rounded border border-neutral-300 px-1 font-mono text-[10px] text-neutral-400">⌘K</kbd>
          </button>
        )}

        <button
          type="button"
          onClick={onNewPage}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-500 transition hover:bg-neutral-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          New page
        </button>
      </div>

      <div className="mx-2 my-2 h-px bg-neutral-200 shrink-0" />

      {/* Search results or page tree */}
      <div className="flex-1 overflow-y-auto px-1 pb-2">
        {search && searchResults.length > 0 ? (
          <div>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Results</p>
            {searchResults.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onNavigate(p.id); setSearch(""); setSearching(false); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-neutral-200"
              >
                <span className="text-sm">{p.emoji}</span>
                <span className="truncate text-[13px] text-neutral-700">{p.title || "Untitled"}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Pages</p>
            {rootIds.map(id => (
              <PageTreeItem
                key={id}
                pageId={id}
                pages={pages}
                currentPageId={currentPageId}
                depth={0}
                onNavigate={onNavigate}
                onAddChild={onAddChild}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-neutral-200 px-2 py-2">
        <a
          href="/"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-500 transition hover:bg-neutral-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
            <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
          </svg>
          Back to website
        </a>
      </div>
    </aside>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function NotebookPage() {
  const [pages, setPages] = useState<PageMap>(buildPages);
  const [currentPageId, setCurrentPageId] = useState("m-wb");

  const getBreadcrumb = useCallback((pageId: string): Page[] => {
    const crumbs: Page[] = [];
    let curr: Page | undefined = pages[pageId];
    while (curr) {
      crumbs.unshift(curr);
      curr = curr.parentId ? pages[curr.parentId] : undefined;
    }
    return crumbs;
  }, [pages]);

  const updatePage = (updated: Page) => {
    setPages(prev => ({ ...prev, [updated.id]: updated }));
  };

  const addChildPage = useCallback((parentId: string, navigate = true): string => {
    const newId = `page-${Date.now()}`;
    const newPage: Page = {
      id: newId,
      emoji: "📋",
      title: "",
      parentId,
      childIds: [],
      blocks: [mkBlock("text", "")],
    };
    setPages(prev => ({
      ...prev,
      [newId]: newPage,
      [parentId]: { ...prev[parentId], childIds: [...(prev[parentId]?.childIds ?? []), newId] },
    }));
    if (navigate) setCurrentPageId(newId);
    return newId;
  }, []);

  const addRootPage = useCallback(() => {
    const newId = `page-${Date.now()}`;
    setPages(prev => ({
      ...prev,
      [newId]: { id: newId, emoji: "📋", title: "", parentId: null, childIds: [], blocks: [mkBlock("text", "")] },
    }));
    setCurrentPageId(newId);
  }, []);

  const currentPage = pages[currentPageId];
  if (!currentPage) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar
        pages={pages}
        currentPageId={currentPageId}
        onNavigate={setCurrentPageId}
        onNewPage={addRootPage}
        onAddChild={(parentId) => addChildPage(parentId, true)}
      />
      <PageEditor
        key={currentPageId}
        page={currentPage}
        pages={pages}
        breadcrumb={getBreadcrumb(currentPageId)}
        onUpdatePage={updatePage}
        onNavigate={setCurrentPageId}
        onAddChildPage={addChildPage}
        onSave={() => console.log("save", currentPage)}
      />
    </div>
  );
}
