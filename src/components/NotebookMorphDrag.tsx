"use client";

import Image from "next/image";
import {
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import type { StaticImageData } from "next/image";

interface Props {
  beforeSrc: string | StaticImageData;
  afterSrc: string | StaticImageData;
  beforeAlt?: string;
  afterAlt?: string;
  /** Starting position between 0 (full before) and 1 (full after). Default: 0.5 */
  initial?: number;
  /** CSS aspect-ratio value, e.g. "16/9" or "4/3". Default: "16/9" */
  aspectRatio?: string;
}

export default function NotebookMorphDrag({
  beforeSrc,
  afterSrc,
  beforeAlt = "Before",
  afterAlt = "After",
  initial = 0.5,
  aspectRatio = "16/9",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(initial);
  const isDragging = useRef(false);
  const rafRef = useRef<number | null>(null);
  const afterClipRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const softEdgeRef = useRef<HTMLDivElement>(null);
  const initialRef = useRef(initial);
  const hintPlayed = useRef(false);

  /** Mutates DOM directly — no setState, no re-render */
  const applyPosition = useCallback((pos: number) => {
    const clamped = Math.max(0, Math.min(1, pos));
    posRef.current = clamped;

    const pct = clamped * 100;
    const right = (100 - pct).toFixed(3);

    if (afterClipRef.current) {
      afterClipRef.current.style.clipPath = `inset(0 ${right}% 0 0)`;
    }
    if (handleRef.current) {
      handleRef.current.style.left = `${pct.toFixed(3)}%`;
    }
    if (softEdgeRef.current) {
      softEdgeRef.current.style.left = `${pct.toFixed(3)}%`;
    }
    // Update ARIA
    containerRef.current?.setAttribute(
      "aria-valuenow",
      String(Math.round(clamped * 100)),
    );
  }, []);

  // Apply initial position once on mount
  useEffect(() => {
    applyPosition(initialRef.current);
  }, [applyPosition]);

  const getPos = useCallback((clientX: number): number => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return posRef.current;
    return (clientX - rect.left) / rect.width;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let latestX = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      container.setPointerCapture(e.pointerId);
      container.style.cursor = "grabbing";
      latestX = e.clientX;
      applyPosition(getPos(e.clientX));
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      latestX = e.clientX;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        applyPosition(getPos(latestX));
      });
    };

    const onPointerUp = () => {
      isDragging.current = false;
      container.style.cursor = "";
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [applyPosition, getPos]);

  // Hint animation: smooth wiggle when component first scrolls into view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const easeInOut = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const animateTo = (from: number, to: number, duration: number, onDone?: () => void) => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        applyPosition(from + (to - from) * easeInOut(t));
        if (t < 1) requestAnimationFrame(step);
        else onDone?.();
      };
      requestAnimationFrame(step);
    };

    const runHint = () => {
      setTimeout(() => {
        animateTo(0.5, 0.32, 500, () =>
          animateTo(0.32, 0.68, 800, () =>
            animateTo(0.68, 0.5, 500),
          ),
        );
      }, 500);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hintPlayed.current && !isDragging.current) {
          hintPlayed.current = true;
          runHint();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [applyPosition]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      applyPosition(posRef.current - step);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      applyPosition(posRef.current + step);
    }
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label="Before/after comparison — use arrow keys to reveal"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(initial * 100)}
      onKeyDown={handleKeyDown}
      className="relative w-full select-none overflow-hidden rounded-2xl cursor-grab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
      style={{ aspectRatio }}
    >
      {/* ── Before layer (base) ── */}
      <div className="absolute inset-0">
        <Image
          src={beforeSrc}
          alt={beforeAlt}
          fill
          className="object-cover pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ── After layer (clipped from right) ── */}
      <div
        ref={afterClipRef}
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${((1 - initial) * 100).toFixed(3)}% 0 0)` }}
      >
        <Image
          src={afterSrc}
          alt={afterAlt}
          fill
          className="object-cover pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ── Soft feather at the seam ── */}
      <div
        ref={softEdgeRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0"
        style={{
          left: `${initial * 100}%`,
          transform: "translateX(-50%)",
          width: "64px",
          background:
            "linear-gradient(to right, rgba(0,172,115,0) 0%, rgba(0,172,115,0.18) 50%, rgba(0,172,115,0) 100%)",
          filter: "blur(8px)",
        }}
      />

      {/* ── Handle ── */}
      <div
        ref={handleRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0"
        style={{
          left: `${initial * 100}%`,
          transform: "translateX(-50%)",
          width: "2px",
        }}
      >
        {/* Glowing vertical line */}
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(0,210,140,0.95)",
            boxShadow:
              "0 0 4px 2px rgba(0,210,140,0.9), 0 0 18px 8px rgba(0,172,115,0.55), 0 0 52px 18px rgba(0,172,115,0.22)",
          }}
        />
      </div>
    </div>
  );
}
