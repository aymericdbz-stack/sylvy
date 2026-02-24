"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Day, SecondaryItem } from "./types";
import { DragHandle } from "./DragHandle";
import { TaskRow } from "./TaskRow";
import { taskSortableId } from "./DayList";

interface DayCardProps {
  day: Day;
  onSecondaryReorder: (dayId: string, taskId: string, reordered: SecondaryItem[]) => void;
  onSecondaryToggle: (dayId: string, taskId: string, itemId: string) => void;
  onSecondaryAdd: (dayId: string, taskId: string) => void;
}

export function DayCard({
  day,
  onSecondaryReorder,
  onSecondaryToggle,
  onSecondaryAdd,
}: DayCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: day.id,
    data: { type: "day", dayId: day.id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 50 : "auto",
    background: "#ffffff",
    borderColor: isDragging ? "#00ac73" : "#e5e7eb",
    boxShadow: isDragging
      ? "0 8px 25px rgba(0,0,0,0.12)"
      : "0 1px 3px rgba(0,0,0,0.04)",
  };

  // Build sortable IDs for tasks in this day
  const taskSortableIds = day.tasks.map((t) => taskSortableId(day.id, t.id));

  return (
    <div
      ref={setNodeRef}
      className="rounded-2xl border transition-shadow"
      style={style}
    >
      {/* Day header — primary DnD activator */}
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-2">
        <span ref={setActivatorNodeRef}>
          <DragHandle listeners={listeners} attributes={attributes} />
        </span>
        <h3
          className="text-sm font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg"
          style={{ background: "#ecfdf5", color: "#00ac73" }}
        >
          {day.dateLabel}
        </h3>
      </div>

      {/* Tasks — each is sortable within this SortableContext */}
      <SortableContext
        items={taskSortableIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="px-5 pb-4">
          {day.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              dayId={day.id}
              onSecondaryReorder={(taskId, reordered) =>
                onSecondaryReorder(day.id, taskId, reordered)
              }
              onSecondaryToggle={(taskId, itemId) =>
                onSecondaryToggle(day.id, taskId, itemId)
              }
              onSecondaryAdd={(taskId) => onSecondaryAdd(day.id, taskId)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
