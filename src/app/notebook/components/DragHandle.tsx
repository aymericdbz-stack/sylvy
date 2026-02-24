"use client";

import React from "react";

interface DragHandleProps {
  listeners: Record<string, Function> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: Record<string, any>;
}

/** Six-dot drag handle for day-level reordering. Gray, 18px. */
export function DragHandle({ listeners, attributes }: DragHandleProps) {
  return (
    <button
      type="button"
      className="flex-shrink-0 cursor-grab touch-none rounded p-1 hover:bg-gray-100 active:cursor-grabbing"
      aria-label="Drag to reorder day"
      {...attributes}
      {...(listeners as React.HTMLAttributes<HTMLButtonElement>)}
    >
      <svg width="18" height="18" viewBox="0 0 16 16" fill="#9ca3af">
        <circle cx="5" cy="2.5" r="1.5" />
        <circle cx="11" cy="2.5" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="13.5" r="1.5" />
        <circle cx="11" cy="13.5" r="1.5" />
      </svg>
    </button>
  );
}
