"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  Fragment,
  type ChangeEvent,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  ImageIcon,
  Trash2,
  ArrowRight,
  Loader2,
  Download,
  X,
  Plus,
} from "lucide-react";
import Button from "@/components/ui/nb/Button";
import logo from "../../../logo/Logo Noir sans Fond.webp";
import sylvyNoteSrc from "../../../logo/Sylvy note.webp";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  ImageRun,
} from "docx";

/* ─── Types ───────────────────────────────────────────────────────── */

interface LocalFile {
  id: string;
  name: string;
  type: string;
  data: ArrayBuffer;
}

type SectionType =
  | "tags"
  | "abstract"
  | "summary"
  | "analysis"
  | "rawNotebook"
  | "rawTranscription"
  | "custom";

interface Section {
  id: string;
  type: SectionType;
  customTitle?: string;
  content: string;
}

type Step = "upload" | "analyzing" | "document";

const SECTION_LABELS: Record<SectionType, string> = {
  tags: "Tags",
  abstract: "Abstract",
  summary: "Notes",
  analysis: "Analysis",
  rawNotebook: "Raw Notebook",
  rawTranscription: "Raw Transcription",
  custom: "Section",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ─── Auto-resize textarea ────────────────────────────────────────── */

function AutoTxt({
  value,
  onChange,
  placeholder,
  className,
  readOnly,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    
    // Store the current scroll position of the page
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
    
    // Restore the scroll position to prevent auto-scrolling
    window.scrollTo(scrollX, scrollY);
  }, []);

  useEffect(() => { resize(); }, [value, resize]);

  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={readOnly ? undefined : (e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      style={{ overflow: "hidden", minHeight: 0 }}
      className={`w-full resize-none outline-none border-none bg-transparent font-nb-mono text-[12px] sm:text-[13.5px] leading-[1.85] text-nb-charcoal placeholder:text-nb-muted-light/60 ${readOnly ? "cursor-default select-text" : ""} ${className ?? ""}`}
    />
  );
}

/* ─── Section Divider (hover to add section) ──────────────────────── */

function SectionDivider({ onAdd }: { onAdd: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative py-1.5 sm:py-4 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onAdd}
      title="Add a section here"
    >
      <div
        className={`border-t transition-all duration-200 ${
          hovered ? "border-nb-green/50" : "border-nb-cream-border/50"
        }`}
      />
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-1.5 bg-white border rounded-full px-2 sm:px-3 py-1 shadow-sm transition-all duration-200 pointer-events-none text-[9px] sm:text-[10px] ${
          hovered
            ? "opacity-100 border-nb-green/30"
            : "opacity-0 border-transparent"
        }`}
      >
        <Plus size={10} className="sm:size-[11px] text-nb-green" />
        <span className="text-nb-muted font-nb-mono whitespace-nowrap">
          Add
        </span>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default function LabSnapshotPage() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadedFiles, setUploadedFiles] = useState<LocalFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [experimentName, setExperimentName] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [ocrProgress, setOcrProgress] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pendingExport, setPendingExport] = useState<"pdf" | "docx" | null>(null);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [exporting, setExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const clear = () => setUploadedFiles([]);
    window.addEventListener("beforeunload", clear);
    return () => window.removeEventListener("beforeunload", clear);
  }, []);

  // Build object URLs for uploaded images
  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const f of uploadedFiles) {
      if (f.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(f.name)) {
        urls[f.id] = URL.createObjectURL(new Blob([f.data], { type: f.type }));
      }
    }
    setImageUrls(urls);
    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [uploadedFiles]);

  /* ── File handling ──────────────────────────────────────────────── */

  const readFiles = useCallback(async (list: FileList): Promise<LocalFile[]> => {
    const out: LocalFile[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      out.push({ id: uid(), name: f.name, type: f.type, data: await f.arrayBuffer() });
    }
    return out;
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = await readFiles(e.dataTransfer.files);
      setUploadedFiles((p) => [...p, ...files]);
    },
    [readFiles]
  );

  const onFileInput = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      const files = await readFiles(e.target.files);
      setUploadedFiles((p) => [...p, ...files]);
      e.target.value = "";
    },
    [readFiles]
  );

  const removeFile = useCallback((id: string) => {
    setUploadedFiles((p) => p.filter((f) => f.id !== id));
  }, []);

  /* ── Section management ─────────────────────────────────────────── */

  const addSectionAt = useCallback((index: number) => {
    const newSection: Section = {
      id: uid(),
      type: "custom",
      customTitle: "New Section",
      content: "",
    };
    setSections((prev) => {
      const next = [...prev];
      next.splice(index, 0, newSection);
      return next;
    });
  }, []);

  const deleteSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSectionContent = useCallback((id: string, content: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content } : s))
    );
  }, []);

  const updateSectionTitle = useCallback((id: string, customTitle: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, customTitle } : s))
    );
  }, []);

  /* ── OCR ────────────────────────────────────────────────────────── */

  const handleAnalyze = useCallback(async () => {
    if (!uploadedFiles.length) {
      toast.error("Add at least one file first");
      return;
    }
    setStep("analyzing");
    setOcrProgress(0);
    
    // Asymptotic progress that naturally slows down and approaches 100%
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      setOcrProgress(prev => {
        const elapsed = (Date.now() - startTime) / 1000; // seconds
        // Exponential approach: quickly reaches 50%, then slows to asymptotically approach 100%
        // Formula: 100 * (1 - e^(-elapsed/15))
        // This takes ~15 seconds to reach 63%, ~30 seconds to reach 87%, ~45 seconds to reach 95%
        const naturalProgress = 100 * (1 - Math.exp(-elapsed / 20));
        
        // Smooth transition to natural progress
        const diff = naturalProgress - prev;
        return prev + diff * 0.15; // Smooth interpolation
      });
    }, 150);
    
    try {
      const fd = new FormData();
      for (const f of uploadedFiles) {
        fd.append("files", new Blob([f.data], { type: f.type }), f.name);
      }
      const res = await fetch("/api/lab-snapshot/ocr", { method: "POST", body: fd });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();

      // Complete the progress
      clearInterval(progressInterval);
      setOcrProgress(100);

      // Ensure content is always a plain string, strip ** bold markers and --- date wrappers
      const cleanContent = (text: unknown): string => {
        let str: string;
        if (typeof text === "string") {
          str = text;
        } else if (typeof text === "object" && text !== null) {
          str = Object.entries(text as Record<string, unknown>)
            .map(([key, val]) => {
              if (Array.isArray(val)) {
                return `${key}:\n${val.map((v) => `• ${v}`).join("\n")}`;
              }
              return `${key}:\n${String(val)}`;
            })
            .join("\n\n");
        } else {
          str = String(text ?? "");
        }
        return str
          .replace(/\*\*([^*]+)\*\*/g, "$1")
          .replace(/^-{3,}\s*(.+?)\s*-{3,}$/gm, "$1")
          .trim();
      };

      setExperimentName(data.experimentName ?? "");
      setSections([
        { id: uid(), type: "tags", content: cleanContent(data.tags) },
        { id: uid(), type: "abstract", content: cleanContent(data.abstract) },
        { id: uid(), type: "summary", content: cleanContent(data.summary) },
        { id: uid(), type: "analysis", content: cleanContent(data.analysis) },
        { id: uid(), type: "rawNotebook", content: "" },
        { id: uid(), type: "rawTranscription", content: cleanContent(data.rawOcrText) },
      ]);
      
      // Small delay to show 100% before transitioning
      await new Promise(resolve => setTimeout(resolve, 400));
      setStep("document");
    } catch (err) {
      clearInterval(progressInterval);
      toast.error(err instanceof Error ? err.message : "Analysis failed");
      setStep("upload");
    } finally {
      setOcrProgress(0);
    }
  }, [uploadedFiles]);

  /* ── PDF generation ─────────────────────────────────────────────── */

  const generatePdf = useCallback(async (): Promise<Blob> => {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let logoEmbed: any = null;
    try {
      const logoUrl = (sylvyNoteSrc as { src: string }).src;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej();
        img.src = logoUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const b = await new Promise<ArrayBuffer>((r) =>
          canvas.toBlob((bl) => bl!.arrayBuffer().then(r), "image/png")
        );
        logoEmbed = await pdfDoc.embedPng(new Uint8Array(b));
      }
    } catch { /* fallback */ }

    const margin = 60, A4W = 595.28, A4H = 841.89, baseLineHeight = 15;
    const green = rgb(0, 0.675, 0.451), lightGray = rgb(0.6, 0.6, 0.6), darkGray = rgb(0.42, 0.42, 0.42);
    let pageNum = 0;
    let page = pdfDoc.addPage([A4W, A4H]);
    let { width, height } = page.getSize();
    let y = height - margin;

    const newPage = () => {
      pageNum++;
      if (pageNum === 1) { page = pdfDoc.getPages()[0]; page.setSize(A4W, A4H); }
      else page = pdfDoc.addPage([A4W, A4H]);
      ({ width, height } = page.getSize());
      y = height - margin;
    };

    // Replace characters that WinAnsi (Windows-1252) cannot encode
    const sanitizeForPdf = (text: string) =>
      text
        .replace(/μ|µ/g, "u")
        .replace(/α/g, "a").replace(/β/g, "b").replace(/γ/g, "g")
        .replace(/δ/g, "d").replace(/ε/g, "e").replace(/ζ/g, "z")
        .replace(/η/g, "n").replace(/θ/g, "th").replace(/ι/g, "i")
        .replace(/κ/g, "k").replace(/λ/g, "l").replace(/ν/g, "v")
        .replace(/ξ/g, "x").replace(/π/g, "pi").replace(/ρ/g, "r")
        .replace(/σ|ς/g, "s").replace(/τ/g, "t").replace(/υ/g, "u")
        .replace(/φ/g, "ph").replace(/χ/g, "ch").replace(/ψ/g, "ps")
        .replace(/ω/g, "w")
        .replace(/Α/g, "A").replace(/Β/g, "B").replace(/Γ/g, "G")
        .replace(/Δ/g, "D").replace(/Ε/g, "E").replace(/Ζ/g, "Z")
        .replace(/Η/g, "N").replace(/Θ/g, "Th").replace(/Ι/g, "I")
        .replace(/Κ/g, "K").replace(/Λ/g, "L").replace(/Μ/g, "M")
        .replace(/Ν/g, "N").replace(/Ξ/g, "X").replace(/Ο/g, "O")
        .replace(/Π/g, "Pi").replace(/Ρ/g, "R").replace(/Σ/g, "S")
        .replace(/Τ/g, "T").replace(/Υ/g, "Y").replace(/Φ/g, "Ph")
        .replace(/Χ/g, "Ch").replace(/Ψ/g, "Ps").replace(/Ω/g, "Ohm")
        .replace(/×/g, "x").replace(/÷/g, "/").replace(/±/g, "+/-")
        .replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/≠/g, "!=")
        .replace(/→/g, "->").replace(/←/g, "<-").replace(/↑/g, "^").replace(/↓/g, "v")
        .replace(/∞/g, "inf").replace(/∑/g, "sum").replace(/∏/g, "prod")
        .replace(/√/g, "sqrt").replace(/∂/g, "d").replace(/∫/g, "int")
        .replace(/[^\x00-\xFF]/g, "?");

    // Parse text with **bold** markers into mixed text runs
    const parseAndDrawText = (text: string, xPos: number, yPos: number, size: number, color: ReturnType<typeof rgb>, maxWidth: number) => {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      let currentX = xPos;
      
      for (const part of parts) {
        if (!part) continue;
        
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldText = sanitizeForPdf(part.slice(2, -2));
          const textWidth = boldFont.widthOfTextAtSize(boldText, size);
          if (currentX + textWidth > xPos + maxWidth) break;
          page.drawText(boldText, { x: currentX, y: yPos, size, font: boldFont, color });
          currentX += textWidth;
        } else {
          const normalText = sanitizeForPdf(part);
          const textWidth = font.widthOfTextAtSize(normalText, size);
          if (currentX + textWidth > xPos + maxWidth) break;
          page.drawText(normalText, { x: currentX, y: yPos, size, font, color });
          currentX += textWidth;
        }
      }
      
      return currentX - xPos;
    };

    // Wrap and draw paragraph with **bold** support
    const wrapWithBold = (text: unknown, size: number, color: ReturnType<typeof rgb>, lineSpacing = 1.85) => {
      const safeText = typeof text === "string" ? text : String(text ?? "");
      const maxWidth = width - margin * 2;
      const lineHeight = size * lineSpacing;
      
      for (const para of safeText.split("\n")) {
        if (/^[=\-_]{3,}$/.test(para.trim())) continue;
        if (!para.trim()) {
          y -= lineHeight * 0.5;
          continue;
        }
        
        // Split by **bold** boundaries to process mixed content
        const parts = para.split(/(\*\*[^*]+\*\*)/g);
        let currentLine = "";
        let lineSegments: Array<{ text: string; bold: boolean }> = [];
        
        for (const part of parts) {
          if (!part) continue;
          
          const isBold = part.startsWith("**") && part.endsWith("**");
          const content = isBold ? part.slice(2, -2) : part;
          const words = content.split(/\s+/);
          
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = (isBold ? boldFont : font).widthOfTextAtSize(sanitizeForPdf(testLine), size);
            
            if (testWidth > maxWidth && currentLine) {
              // Draw the current line
              if (y - lineHeight < margin) newPage();
              
              let currentX = margin;
              for (const seg of lineSegments) {
                const cleanText = sanitizeForPdf(seg.text);
                const segFont = seg.bold ? boldFont : font;
                page.drawText(cleanText, { x: currentX, y, size, font: segFont, color });
                currentX += segFont.widthOfTextAtSize(cleanText, size);
              }
              
              y -= lineHeight;
              currentLine = word;
              lineSegments = [{ text: word, bold: isBold }];
            } else {
              currentLine = testLine;
              if (lineSegments.length > 0 && lineSegments[lineSegments.length - 1].bold === isBold) {
                lineSegments[lineSegments.length - 1].text += (currentLine === word ? "" : " ") + word;
              } else {
                lineSegments.push({ text: (currentLine === word ? "" : " ") + word, bold: isBold });
              }
            }
          }
        }
        
        // Draw remaining line
        if (currentLine) {
          if (y - lineHeight < margin) newPage();
          
          let currentX = margin;
          for (const seg of lineSegments) {
            const cleanText = sanitizeForPdf(seg.text);
            const segFont = seg.bold ? boldFont : font;
            page.drawText(cleanText, { x: currentX, y, size, font: segFont, color });
            currentX += segFont.widthOfTextAtSize(cleanText, size);
          }
          
          y -= lineHeight;
        }
      }
    };

    const drawCentered = (text: string, size: number, useBold: boolean, color: ReturnType<typeof rgb>) => {
      const cleanText = sanitizeForPdf(text);
      const usedFont = useBold ? boldFont : font;
      const tw = usedFont.widthOfTextAtSize(cleanText, size);
      if (y - size - 10 < margin) newPage();
      page.drawText(cleanText, { x: (width - tw) / 2, y, size, font: usedFont, color });
      y -= size + 10;
    };

    const sectionHeading = (num: number, title: string, color: ReturnType<typeof rgb> = green) => {
      if (y - 35 < margin) newPage();
      y -= 25;
      const headingText = sanitizeForPdf(`${num}. ${title.toUpperCase()}`);
      page.drawText(headingText, { x: margin, y, size: 13, font: boldFont, color });
      y -= 20;
    };

    // Cover page
    newPage();
    y -= 80;
    drawCentered("EXPERIMENT REPORT", 20, true, green);
    y += 5;
    drawCentered(experimentName || "Untitled Experiment", 16, true, rgb(0, 0, 0));
    y -= 10;
    
    // Decorative line
    page.drawLine({ 
      start: { x: width / 2 - 100, y }, 
      end: { x: width / 2 + 100, y }, 
      thickness: 0.5, 
      color: lightGray 
    });
    y -= 20;
    
    drawCentered(`Generated: ${new Date().toLocaleDateString()}`, 10, false, lightGray);

    // Sections
    const imageFiles = uploadedFiles.filter(
      (f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(f.name)
    );
    const pdfFiles = uploadedFiles.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    let sectionNum = 0;
    for (const section of sections) {
      if (section.type === "rawNotebook") {
        if (imageFiles.length > 0 || pdfFiles.length > 0) {
          sectionNum++;
          newPage();
          sectionHeading(sectionNum, "Raw Notebook");
          
          for (const f of imageFiles) {
            try {
              const isPng = f.type === "image/png" || f.name.toLowerCase().endsWith(".png");
              const img = isPng
                ? await pdfDoc.embedPng(new Uint8Array(f.data))
                : await pdfDoc.embedJpg(new Uint8Array(f.data));
              const maxImgWidth = width - margin * 2;
              const maxImgHeight = height - margin * 2 - 100;
              const scale = Math.min(maxImgWidth / img.width, maxImgHeight / img.height, 1);
              const imgWidth = img.width * scale;
              const imgHeight = img.height * scale;
              
              if (y - imgHeight - 30 < margin) newPage();
              
              const imgX = (width - imgWidth) / 2;
              const imgY = y - imgHeight;
              page.drawImage(img, { x: imgX, y: imgY, width: imgWidth, height: imgHeight });
              
              y = imgY - 15;
              const captionText = sanitizeForPdf(f.name);
              const captionWidth = font.widthOfTextAtSize(captionText, 9);
              page.drawText(captionText, { 
                x: (width - captionWidth) / 2, 
                y, 
                size: 9, 
                font, 
                color: darkGray 
              });
              y -= 25;
            } catch { /* skip */ }
          }
          
          for (const f of pdfFiles) {
            try {
              const src = await PDFDocument.load(f.data);
              for (const pg of src.getPages()) {
                const [emb] = await pdfDoc.embedPages([pg]);
                newPage();
                const availWidth = width - margin * 2;
                const availHeight = height - margin * 2;
                const scale = Math.min(availWidth / emb.width, availHeight / emb.height);
                page.drawPage(emb, {
                  x: (width - emb.width * scale) / 2,
                  y: margin + (availHeight - emb.height * scale) / 2,
                  width: emb.width * scale,
                  height: emb.height * scale,
                });
              }
            } catch { /* skip */ }
          }
        }
      } else if (section.type === "rawTranscription") {
        sectionNum++;
        newPage();
        sectionHeading(sectionNum, "Raw Transcription", lightGray);
        if (section.content) {
          wrapWithBold(section.content, 9, darkGray, 1.7);
        } else {
          wrapWithBold("—", 9, darkGray, 1.7);
        }
      } else {
        sectionNum++;
        newPage();
        const title =
          section.type === "custom"
            ? section.customTitle || "Section"
            : SECTION_LABELS[section.type];
        sectionHeading(sectionNum, title);
        if (section.content) {
          wrapWithBold(section.content, 11, rgb(0, 0, 0), 1.85);
        } else {
          wrapWithBold("—", 11, rgb(0, 0, 0), 1.85);
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  }, [sections, experimentName, uploadedFiles]);

  /* ── DOCX generation ─────────────────────────────────────────────── */

  const generateDocx = useCallback(async (): Promise<Blob> => {
    // Parse **bold** markers into TextRun array
    const parseRuns = (text: string, size = 22, color?: string): TextRun[] => {
      const textStr = typeof text === 'string' ? text : String(text || '');
      const parts = textStr.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return new TextRun({ text: part.slice(2, -2), bold: true, size, font: "Courier New", ...(color ? { color } : {}) });
        }
        return new TextRun({ text: part, size, font: "Courier New", ...(color ? { color } : {}) });
      });
    };

    const titlePara = (text: string) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text, bold: true, size: 40, font: "Courier New" })],
      });

    const heading = (num: number, text: string, color = "00AC73") =>
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 500, after: 160 },
        children: [
          new TextRun({ text: `${num}. ${text.toUpperCase()}`, bold: true, size: 26, color, font: "Courier New" }),
        ],
      });

    const body = (text: string, color?: string) => {
      const textStr = typeof text === 'string' ? text : String(text || '—');
      return textStr.split("\n").map(
        (line) =>
          new Paragraph({
            spacing: { after: 80 },
            children: parseRuns(line, 22, color),
          })
      );
    };

    // Build image paragraphs
    const imgParas: Paragraph[] = [];
    const imageFiles = uploadedFiles.filter(
      (f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(f.name)
    );
    for (const f of imageFiles) {
      try {
        const dims = await new Promise<{ w: number; h: number }>((res) => {
          const blob = new Blob([f.data], { type: f.type });
          const url = URL.createObjectURL(blob);
          const img = new window.Image();
          img.onload = () => {
            const ratio = img.naturalHeight / img.naturalWidth;
            res({ w: 480, h: Math.round(480 * ratio) });
            URL.revokeObjectURL(url);
          };
          img.onerror = () => res({ w: 480, h: 360 });
          img.src = url;
        });
        imgParas.push(
          new Paragraph({
            spacing: { before: 200, after: 200 },
            children: [
              new ImageRun({
                data: new Uint8Array(f.data),
                transformation: { width: dims.w, height: dims.h },
                type: f.name.toLowerCase().endsWith(".png") ? "png" : "jpg",
              }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: f.name, size: 18, italics: true, color: "6B6B6B", font: "Courier New" })],
          })
        );
      } catch { /* skip */ }
    }

    const docChildren: Paragraph[] = [
      titlePara("EXPERIMENT REPORT"),
      titlePara(experimentName || "Untitled Experiment"),
      new Paragraph({
        children: [
          new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 18, color: "9A9A9A", font: "Courier New" }),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] }),
    ];

    let sectionNum = 0;
    for (const section of sections) {
      if (section.type === "rawNotebook") {
        if (imgParas.length > 0) {
          sectionNum++;
          docChildren.push(new Paragraph({ children: [new PageBreak()] }));
          docChildren.push(heading(sectionNum, "Raw Notebook"));
          docChildren.push(...imgParas);
        }
      } else if (section.type === "rawTranscription") {
        sectionNum++;
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
        docChildren.push(heading(sectionNum, "Raw Transcription", "9A9A9A"));
        docChildren.push(...body(section.content || "—", "6B6B6B"));
      } else {
        sectionNum++;
        const title =
          section.type === "custom"
            ? section.customTitle || "Section"
            : SECTION_LABELS[section.type];
        docChildren.push(heading(sectionNum, title));
        docChildren.push(...body(section.content || "—"));
      }
    }

    const docxDoc = new Document({ sections: [{ children: docChildren }] });
    return await Packer.toBlob(docxDoc);
  }, [sections, experimentName, uploadedFiles]);

  /* ── Export flow ─────────────────────────────────────────────────── */

  const triggerExport = useCallback((type: "pdf" | "docx") => {
    setPendingExport(type);
    setShowFeedback(true);
  }, []);

  const handleExportSubmit = useCallback(async () => {
    if (pendingExport === null) return;
    setExporting(true);
    setShowFeedback(false);

    try {
      let blob: Blob;
      let filename: string;
      if (pendingExport === "pdf") {
        blob = await generatePdf();
        filename = `${(experimentName || "report").replace(/[^a-zA-Z0-9]/g, "_")}_report.pdf`;
      } else {
        blob = await generateDocx();
        filename = `${(experimentName || "report").replace(/[^a-zA-Z0-9]/g, "_")}_report.docx`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`${pendingExport.toUpperCase()} downloaded`);

      // Fire-and-forget: save feedback + second email
      fetch("/api/lab-snapshot/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: feedbackComment,
          experimentName,
          format: pendingExport,
          sections: sections.map((s, i) => ({
            num: i + 1,
            type: s.type,
            title: s.type === "custom" ? s.customTitle || "Section" : SECTION_LABELS[s.type],
            content: s.content,
          })),
        }),
      }).catch(() => { /* silent */ });

    } catch (err) {
      toast.error("Export failed");
      console.error(err);
    } finally {
      setExporting(false);
      setPendingExport(null);
    }
  }, [pendingExport, generatePdf, generateDocx, experimentName, rating, feedbackComment, sections]);

  /* ── Step 1 — Upload ─────────────────────────────────────────────── */

  if (step === "upload" || step === "analyzing") {
    return (
      <div className="min-h-screen bg-nb-cream flex flex-col">
        <header className="border-b border-nb-cream-border">
          <div className="max-w-[700px] mx-auto px-6 py-4 flex items-center gap-2.5">
            <Image src={logo} alt="Sylvy" width={20} height={20} className="h-5 w-5 object-contain" priority />
            <span className="text-[12px] font-[600] tracking-[0.18em] uppercase text-nb-charcoal font-nb-mono">Lab Snapshot</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
          <div className="w-full max-w-[560px]">
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-[22px] sm:text-[30px] font-[700] text-nb-charcoal font-nb-mono leading-tight">
                Photograph your lab notebook.<br />
                <span className="text-[18px] sm:text-[25px] text-nb-green">Get a structured report.</span>
              </h1>

            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => step !== "analyzing" && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[10px] p-6 sm:p-12 flex flex-col items-center gap-3 sm:gap-4 transition-all duration-200 cursor-pointer ${
                isDragging ? "border-nb-green bg-nb-green-light" : "border-nb-cream-border bg-white hover:border-nb-green/40 hover:bg-nb-cream/30"
              } ${step === "analyzing" ? "pointer-events-none opacity-60" : ""}`}
            >
              <div className={`w-9 sm:w-11 h-9 sm:h-11 rounded-full flex items-center justify-center ${isDragging ? "bg-nb-green" : "bg-nb-cream"}`}>
                <Upload size={18} className={`sm:size-[20px] ${isDragging ? "text-white" : "text-nb-muted"}`} strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-[13px] sm:text-[14px] font-[600] text-nb-charcoal font-nb-mono">Drop lab notebook photos</p>
                <p className="text-[11px] sm:text-[12px] text-nb-muted font-nb-mono mt-0.5 sm:mt-1">Images or PDF</p>
              </div>

            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" onChange={onFileInput} className="hidden" />

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-[6px] border border-nb-cream-border">
                    {f.type.startsWith("image/") ? <ImageIcon size={13} className="text-nb-muted shrink-0" /> : <FileText size={13} className="text-nb-muted shrink-0" />}
                    <span className="text-[12px] text-nb-charcoal font-nb-mono truncate flex-1">{f.name}</span>
                    {step !== "analyzing" && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} className="text-nb-muted hover:text-nb-error transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-center">
              {step === "analyzing" ? (
                <div className="flex flex-col items-center gap-4">
                  {/* Circular Progress Wheel */}
                  <div className="relative w-24 h-24">
                    {/* Background circle */}
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#E8E6E1"
                        strokeWidth="6"
                        fill="none"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#00AC73"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - ocrProgress / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-300 ease-out"
                      />
                    </svg>
                    {/* Percentage text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-[700] text-nb-charcoal font-nb-mono">
                        {Math.round(ocrProgress)}%
                      </span>
                    </div>
                  </div>
                  {/* Loading text */}
                  <p className="text-[13px] text-nb-muted font-nb-mono">
                    Reading your notebook…
                  </p>
                </div>
              ) : (
                <Button variant="primary" onClick={handleAnalyze} disabled={!uploadedFiles.length} className="px-8 py-2.5 gap-2">
                  Analyze <ArrowRight size={14} />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="pb-6 sm:pb-8 text-center px-4">
          <p className="text-[10px] sm:text-[11px] text-nb-muted font-nb-mono">
            Want more?{" "}
            <Link href="https://sylvy.co" className="text-nb-green font-[600] hover:underline">Try Sylvy</Link>
          </p>
        </div>
      </div>
    );
  }

  /* ── Step 2 — Document editor ─────────────────────────────────────── */

  const imageFiles = uploadedFiles.filter(
    (f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(f.name)
  );

  return (
    <div className="min-h-screen bg-[#EEECE7]">
      {/* Sticky toolbar */}
      <header className="sticky top-0 z-30 bg-[#EEECE7]/90 backdrop-blur-sm border-b border-nb-cream-border">
        <div className="max-w-[760px] mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-5 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <Image src={logo} alt="Sylvy" width={16} height={16} className="h-4 sm:h-[18px] w-4 sm:w-[18px] object-contain" priority />
              <span className="text-[9px] sm:text-[11px] font-[600] tracking-[0.18em] uppercase text-nb-charcoal font-nb-mono hidden sm:inline">Lab Snapshot</span>
            </div>
            <button type="button" onClick={() => setStep("upload")} className="text-[9px] sm:text-[11px] text-nb-muted font-nb-mono hover:text-nb-charcoal transition-colors whitespace-nowrap">
              ← Back
            </button>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => triggerExport("docx")} disabled={exporting} className="gap-0.5 sm:gap-1.5 text-[10px] sm:text-sm px-2 sm:px-3">
              <Download size={11} className="sm:size-[13px]" /> DOCX
            </Button>
            <Button variant="primary" size="sm" onClick={() => triggerExport("pdf")} disabled={exporting} className="gap-0.5 sm:gap-1.5 text-[10px] sm:text-sm px-2 sm:px-3">
              <Download size={11} className="sm:size-[13px]" /> PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Document paper */}
      <div className="max-w-[720px] mx-auto px-3 sm:px-4 py-6 sm:py-10 pb-20">
        <div className="bg-white shadow-[0_2px_20px_rgba(0,0,0,0.07)] rounded-[4px] px-5 sm:px-6 md:px-8 py-8 sm:py-10 md:py-16">

          {/* Title */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="text-[8px] sm:text-[9px] font-[600] tracking-[0.25em] uppercase text-nb-muted-light font-nb-mono mb-2 sm:mb-3">
              Experiment Report
            </div>
            <AutoTxt
              value={experimentName}
              onChange={setExperimentName}
              placeholder="Experiment title"
              className="text-[18px] sm:text-[22px] font-[700] leading-[1.3] text-center placeholder:text-center"
            />
            <div className="mt-1.5 sm:mt-2 text-[9px] sm:text-[11px] text-nb-muted-light font-nb-mono">
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* Sections */}
          <SectionDivider onAdd={() => addSectionAt(0)} />

          {sections.map((section, index) => {
            const displayNum = index + 1;
            const isReadOnly = section.type === "rawTranscription";
            const isImages = section.type === "rawNotebook";
            const isCustom = section.type === "custom";
            const labelColor = isReadOnly ? "text-nb-muted-light" : "text-nb-green";

            return (
              <Fragment key={section.id}>
                <section className="relative group/section pb-1 sm:pb-2">
                  {/* Delete button — top-right, visible on hover */}
                  <button
                    type="button"
                    onClick={() => deleteSection(section.id)}
                    className="absolute -top-1 -right-2 sm:-right-4 sm:opacity-0 sm:group-hover/section:opacity-100 w-4 sm:w-[18px] h-4 sm:h-[18px] rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-all duration-150 border border-red-200/60"
                    title="Delete this section"
                  >
                    <X size={8} className="sm:size-[9px]" />
                  </button>

                  {/* Section label */}
                  <div className="mb-3 sm:mb-4">
                    {isCustom ? (
                      <div className="flex items-center gap-1">
                        <span className={`text-[8px] sm:text-[9px] font-[500] tracking-[0.2em] uppercase ${labelColor} font-nb-mono`}>
                          {displayNum} —
                        </span>
                        <input
                          type="text"
                          value={section.customTitle || ""}
                          onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                          placeholder="Title"
                          className="text-[8px] sm:text-[9px] font-[500] tracking-[0.2em] uppercase text-nb-green font-nb-mono bg-transparent outline-none border-none border-b border-dashed border-nb-green/40 focus:border-nb-green/70 transition-colors min-w-[60px] sm:min-w-[80px] placeholder:text-nb-green/30"
                        />
                      </div>
                    ) : (
                      <div className={`text-[8px] sm:text-[9px] font-[500] tracking-[0.2em] uppercase ${labelColor} font-nb-mono`}>
                        {displayNum} — {SECTION_LABELS[section.type]}
                      </div>
                    )}
                  </div>

                  {/* Section content */}
                  {isImages ? (
                    <div className="space-y-3 sm:space-y-6">
                      {imageFiles.length === 0 ? (
                        <p className="text-[11px] sm:text-[12px] text-nb-muted-light font-nb-mono italic">No images uploaded.</p>
                      ) : (
                        imageFiles.map((f) =>
                          imageUrls[f.id] ? (
                            <div key={f.id}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrls[f.id]}
                                alt={f.name}
                                className="max-w-full rounded-[4px] border border-nb-cream-border"
                              />
                              <p className="mt-1 sm:mt-1.5 text-[8px] sm:text-[10px] text-nb-muted font-nb-mono truncate">{f.name}</p>
                            </div>
                          ) : null
                        )
                      )}
                    </div>
                  ) : (
                    <AutoTxt
                      value={section.content}
                      onChange={isReadOnly ? undefined : (v) => updateSectionContent(section.id, v)}
                      placeholder={isReadOnly ? "" : `${SECTION_LABELS[section.type]} will appear here after analysis…`}
                      readOnly={isReadOnly}
                      className={isReadOnly ? "text-[12px] text-nb-muted leading-[1.7] cursor-default" : ""}
                    />
                  )}
                </section>

                <SectionDivider onAdd={() => addSectionAt(index + 1)} />
              </Fragment>
            );
          })}
        </div>

        {/* Bottom export strip */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" onClick={() => triggerExport("docx")} disabled={exporting} className="gap-1.5 bg-white border border-nb-cream-border hover:bg-nb-cream text-sm sm:text-base">
            <Download size={13} /> <span className="hidden sm:inline">Export as</span> DOCX
          </Button>
          <Button variant="primary" onClick={() => triggerExport("pdf")} disabled={exporting} className="gap-1.5 text-sm sm:text-base">
            <Download size={14} /> <span className="hidden sm:inline">Export as</span> PDF
          </Button>
        </div>

        <div className="mt-6 sm:mt-8 text-center px-2">
          <p className="text-[10px] sm:text-[11px] text-nb-muted font-nb-mono">
            Want more?{" "}
            <Link href="https://sylvy.co" className="text-nb-green font-[600] hover:underline">Try Sylvy</Link>
          </p>
        </div>
      </div>

      {/* ── Feedback modal ─────────────────────────────────────────── */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nb-charcoal/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[12px] border border-nb-cream-border shadow-xl w-full max-w-[440px] p-5 sm:p-8">
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="flex-1">
                <h2 className="text-[13px] sm:text-[15px] font-[700] text-nb-charcoal font-nb-mono">Before export…</h2>
                <p className="text-[10px] sm:text-[11px] text-nb-muted font-nb-mono mt-0.5">Helps us improve.</p>
              </div>
              <button type="button" onClick={() => setShowFeedback(false)} className="text-nb-muted hover:text-nb-charcoal ml-2 flex-shrink-0">
                <X size={14} className="sm:size-[16px]" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-[10px] sm:text-[11px] font-[600] text-nb-charcoal font-nb-mono uppercase tracking-[0.06em] mb-3 sm:mb-4">
                Rate this
              </p>
              <div className="flex justify-between text-[9px] sm:text-[10px] text-nb-muted font-nb-mono mb-2">
                <span>Hate it</span>
                <span className="text-[13px] sm:text-[15px] font-[700] text-nb-charcoal">{rating}</span>
                <span>Love it</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="nb-slider w-full"
              />
              <div className="flex justify-between mt-1 gap-0.5">
                {Array.from({ length: 11 }, (_, i) => (
                  <span key={i} className="text-[7px] sm:text-[9px] text-nb-muted-light font-nb-mono">{i}</span>
                ))}
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-[10px] sm:text-[11px] font-[600] text-nb-charcoal font-nb-mono uppercase tracking-[0.06em] mb-2">
                Feedback
              </p>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Optional feedback"
                rows={2}
                className="w-full bg-nb-cream border border-nb-cream-border rounded-[6px] px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-[12px] text-nb-charcoal font-nb-mono placeholder:text-nb-muted-light resize-none outline-none focus:border-nb-green transition-colors"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleExportSubmit}
              loading={exporting}
              className="w-full justify-center gap-2 text-sm sm:text-base"
            >
              <Download size={13} className="sm:size-[14px]" />
              Export {pendingExport?.toUpperCase()}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
