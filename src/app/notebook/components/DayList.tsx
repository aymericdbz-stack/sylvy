"use client";

import React, { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { Day, Task, SecondaryItem } from "./types";
import { DayCard } from "./DayCard";

/* ─── ID helpers ─── */
// Day sortable IDs use the day id directly (e.g. "day-1")
// Task sortable IDs are prefixed to avoid collisions: "task:<dayId>:<taskId>"
export function taskSortableId(dayId: string, taskId: string) {
  return `task:${dayId}:${taskId}`;
}

function parseTaskSortableId(id: string): { dayId: string; taskId: string } | null {
  if (!String(id).startsWith("task:")) return null;
  const parts = String(id).split(":");
  // task:<dayId>:<taskId>
  return { dayId: parts[1], taskId: parts.slice(2).join(":") };
}

/* ─── Overlay content ─── */
function OverlayContent({ activeId, days }: { activeId: UniqueIdentifier; days: Day[] }) {
  const idStr = String(activeId);

  // Task overlay
  const parsed = parseTaskSortableId(idStr);
  if (parsed) {
    const day = days.find((d) => d.id === parsed.dayId);
    const task = day?.tasks.find((t) => t.id === parsed.taskId);
    if (task) {
      return (
        <div
          className="rounded-xl border px-4 py-2 text-sm shadow-lg max-w-md truncate"
          style={{ background: "#fff", borderColor: "#a7f3d0", color: "#374151" }}
        >
          {task.text}
        </div>
      );
    }
  }

  // Day overlay
  const day = days.find((d) => d.id === idStr);
  if (day) {
    return (
      <div
        className="rounded-xl border px-4 py-2 text-sm font-semibold uppercase shadow-lg"
        style={{ background: "#ecfdf5", borderColor: "#00ac73", color: "#00ac73" }}
      >
        {day.dateLabel} — {day.tasks.length} tasks
      </div>
    );
  }

  return null;
}

/* ─── Component ─── */
interface DayListProps {
  days: Day[];
  onDaysChange: (days: Day[]) => void;
}

export function DayList({ days, onDaysChange }: DayListProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // 8px distance prevents accidental activation when clicking buttons/text
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  /* ─── Drag start: track active for overlay ─── */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  /* ─── Drag end: route by type ─── */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeType = active.data.current?.type as string | undefined;
      const overType = over.data.current?.type as string | undefined;

      // Day reorder
      if (activeType === "day" && overType === "day") {
        const oldIdx = days.findIndex((d) => d.id === active.id);
        const newIdx = days.findIndex((d) => d.id === over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
          onDaysChange(arrayMove(days, oldIdx, newIdx));
        }
        return;
      }

      // Task reorder (within same day only)
      if (activeType === "task" && overType === "task") {
        const activeDayId = active.data.current?.dayId as string;
        const overDayId = over.data.current?.dayId as string;
        if (activeDayId !== overDayId) return; // no cross-day moves

        onDaysChange(
          days.map((d) => {
            if (d.id !== activeDayId) return d;
            const activeTaskId = active.data.current?.taskId as string;
            const overTaskId = over.data.current?.taskId as string;
            const oldIdx = d.tasks.findIndex((t) => t.id === activeTaskId);
            const newIdx = d.tasks.findIndex((t) => t.id === overTaskId);
            if (oldIdx === -1 || newIdx === -1) return d;
            return { ...d, tasks: arrayMove(d.tasks, oldIdx, newIdx) };
          })
        );
        return;
      }
    },
    [days, onDaysChange]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  /* ─── Secondary callbacks (passed through to DayCard → TaskRow → SecondaryMarginList) ─── */
  const handleSecondaryReorder = useCallback(
    (dayId: string, taskId: string, reordered: SecondaryItem[]) => {
      onDaysChange(
        days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                tasks: d.tasks.map((t) =>
                  t.id === taskId ? { ...t, secondary: reordered } : t
                ),
              }
            : d
        )
      );
    },
    [days, onDaysChange]
  );

  const handleSecondaryToggle = useCallback(
    (dayId: string, taskId: string, itemId: string) => {
      onDaysChange(
        days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                tasks: d.tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        secondary: t.secondary.map((s) =>
                          s.id === itemId
                            ? {
                                ...s,
                                status:
                                  s.status === "done"
                                    ? ("not_done" as const)
                                    : ("done" as const),
                              }
                            : s
                        ),
                      }
                    : t
                ),
              }
            : d
        )
      );
    },
    [days, onDaysChange]
  );

  const handleSecondaryAdd = useCallback(
    (dayId: string, taskId: string) => {
      const newItem: SecondaryItem = {
        id: `s-${Date.now()}`,
        status: "not_done",
      };
      onDaysChange(
        days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                tasks: d.tasks.map((t) =>
                  t.id === taskId
                    ? { ...t, secondary: [...t.secondary, newItem] }
                    : t
                ),
              }
            : d
        )
      );
    },
    [days, onDaysChange]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Day-level sortable context */}
      <SortableContext
        items={days.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-5">
          {days.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              onSecondaryReorder={handleSecondaryReorder}
              onSecondaryToggle={handleSecondaryToggle}
              onSecondaryAdd={handleSecondaryAdd}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay — shows a lightweight preview while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeId ? <OverlayContent activeId={activeId} days={days} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
