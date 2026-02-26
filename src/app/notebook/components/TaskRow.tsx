"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, SecondaryItem } from "./types";
import { SecondaryMarginList } from "./SecondaryMarginList";
import { taskSortableId } from "./DayList";

interface TaskRowProps {
  task: Task;
  dayId: string;
  onSecondaryReorder: (taskId: string, reordered: SecondaryItem[]) => void;
  onSecondaryToggle: (taskId: string, itemId: string) => void;
  onSecondaryAdd: (taskId: string) => void;
}

export function TaskRow({
  task,
  dayId,
  onSecondaryReorder,
  onSecondaryToggle,
  onSecondaryAdd,
}: TaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: taskSortableId(dayId, task.id),
    data: { type: "task", dayId, taskId: task.id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className="group/task flex items-start gap-2 py-2.5 border-b last:border-b-0"
      style={{ ...style, borderColor: "#f3f4f6" }}
    >
      {/* Task drag handle — left side, subtle */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="mt-1 flex-shrink-0 cursor-grab touch-none rounded p-0.5 opacity-30 hover:opacity-100 hover:bg-gray-100 active:cursor-grabbing transition-opacity"
        aria-label="Drag to reorder task"
        {...attributes}
        {...(listeners as React.HTMLAttributes<HTMLButtonElement>)}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="#9ca3af">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Bullet */}
      <span
        className="mt-2 flex-shrink-0 h-1.5 w-1.5 rounded-full"
        style={{ background: "#374151" }}
      />

      {/* Task text */}
      <p className="flex-1 text-sm leading-relaxed min-w-0" style={{ color: "#374151" }}>
        {task.text}
      </p>

      {/* Right margin — secondary items */}
      <div className="flex-shrink-0 w-[100px] flex justify-end items-start">
        <SecondaryMarginList
          taskId={task.id}
          items={task.secondary}
          onReorder={onSecondaryReorder}
          onToggle={onSecondaryToggle}
          onAdd={onSecondaryAdd}
        />
      </div>
    </div>
  );
}
