"use client";

import React, { useCallback, useId } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { SecondaryItem } from "./types";
import { SecondaryItemRow } from "./SecondaryItemRow";

interface SecondaryMarginListProps {
  taskId: string;
  items: SecondaryItem[];
  onReorder: (taskId: string, reordered: SecondaryItem[]) => void;
  onToggle: (taskId: string, itemId: string) => void;
  onAdd: (taskId: string) => void;
}

/**
 * Independent DndContext for the secondary (right-margin) items of one task.
 * Completely isolated from the primary day-level DndContext — no event leakage.
 */
export function SecondaryMarginList({
  taskId,
  items,
  onReorder,
  onToggle,
  onAdd,
}: SecondaryMarginListProps) {
  // Stable unique ID for this DndContext instance
  const dndId = useId();

  // Activation constraint: 5px distance — prevents accidental drag on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIdx = items.findIndex((i) => i.id === active.id);
      const newIdx = items.findIndex((i) => i.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;

      onReorder(taskId, arrayMove(items, oldIdx, newIdx));
    },
    [items, taskId, onReorder]
  );

  const handleToggle = useCallback(
    (itemId: string) => onToggle(taskId, itemId),
    [taskId, onToggle]
  );

  // No secondary items → show nothing (subtle add on hover only)
  if (items.length === 0) {
    return (
      <button
        type="button"
        onClick={() => onAdd(taskId)}
        className="opacity-0 group-hover/task:opacity-100 text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-dashed hover:bg-gray-50 transition-all"
        style={{ color: "#9ca3af", borderColor: "#d1d5db" }}
      >
        +
      </button>
    );
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-0.5">
          {items.map((item) => (
            <SecondaryItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
