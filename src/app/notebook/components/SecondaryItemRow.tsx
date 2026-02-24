"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SecondaryItem } from "./types";

interface SecondaryItemRowProps {
  item: SecondaryItem;
  onToggle: (id: string) => void;
}

export function SecondaryItemRow({ item, onToggle }: SecondaryItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-center rounded-md px-1 py-1 group"
    >
      {/* Row: drag handle + date + tick/cross */}
      <div className="flex items-center gap-1 w-full">
        {/* Secondary drag handle — activator ref isolates this from primary DnD */}
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="flex-shrink-0 cursor-grab touch-none rounded p-0.5 hover:bg-purple-50 active:cursor-grabbing"
          aria-label="Drag to reorder margin entry"
          {...attributes}
          {...(listeners as React.HTMLAttributes<HTMLButtonElement>)}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="#c4b5fd">
            <circle cx="5" cy="3" r="1.8" />
            <circle cx="11" cy="3" r="1.8" />
            <circle cx="5" cy="8" r="1.8" />
            <circle cx="11" cy="8" r="1.8" />
            <circle cx="5" cy="13" r="1.8" />
            <circle cx="11" cy="13" r="1.8" />
          </svg>
        </button>

        {/* Date label (if present) */}
        {item.dueDateLabel && (
          <span
            className="text-[11px] font-medium whitespace-nowrap"
            style={{ color: "#6b7280" }}
          >
            {item.dueDateLabel}
          </span>
        )}

        {/* Status toggle: tick or cross */}
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          className="ml-auto flex-shrink-0 p-0.5 rounded hover:bg-gray-50"
          aria-label={item.status === "done" ? "Mark not done" : "Mark done"}
        >
          {item.status === "done" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ac73" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
