"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ──────── Types ──────── */
interface Q1Row {
  task: string;
  time: string; // stored as string for input, parsed to number on submit
}

interface Q2Row {
  software: string;
  satisfaction: number;
}

/* ──────── pixel slider styles (injected once) ──────── */
const pixelSliderCSS = `
/* track */
input[type="range"].pixel-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 12px;
  background: #d1d5db;
  border: 2px solid #374151;
  border-radius: 0;
  outline: none;
  image-rendering: pixelated;
}
/* thumb – webkit */
input[type="range"].pixel-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  background: var(--primary, #00ac73);
  border: 3px solid #111827;
  border-radius: 0;
  cursor: pointer;
  image-rendering: pixelated;
}
/* thumb – moz */
input[type="range"].pixel-slider::-moz-range-thumb {
  width: 22px;
  height: 22px;
  background: var(--primary, #00ac73);
  border: 3px solid #111827;
  border-radius: 0;
  cursor: pointer;
  image-rendering: pixelated;
}
/* tick marks under slider */
.pixel-ticks {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  margin-top: 2px;
}
.pixel-ticks span {
  width: 2px;
  height: 6px;
  background: #6b7280;
}
`;

/* ──────── Questions (DO NOT EDIT question texts) ──────── */
const GREEN = "text-primary";

/* ──────── Component ──────── */
export default function SurveyPage() {
  /* Q1 state: 5 rows of task + time */
  const [q1Rows, setQ1Rows] = useState<Q1Row[]>(
    Array.from({ length: 5 }, () => ({ task: "", time: "" }))
  );

  /* Q2 state: 3 rows of software + satisfaction (0-10) */
  const [q2Rows, setQ2Rows] = useState<Q2Row[]>(
    Array.from({ length: 3 }, () => ({ software: "", satisfaction: 5 }))
  );

  /* Q3 state: single text */
  const [q3Text, setQ3Text] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [formStatus, setFormStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  /* Q1 row change */
  const updateQ1 = (idx: number, field: keyof Q1Row, value: string) => {
    setQ1Rows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  /* Q2 row change */
  const updateQ2 = (idx: number, field: keyof Q2Row, value: string | number) => {
    setQ2Rows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  /* form field change */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  /* open/close modal */
  const openModal = () => {
    setIsModalOpen(true);
    setFormStatus("idle");
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setFormStatus("idle");
  };

  /* parse time string (comma or dot) → number | null */
  const parseTime = (raw: string): number | null => {
    const cleaned = raw.replace(",", ".").trim();
    if (cleaned === "") return null;
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  };

  /* submit modal form → client + survey */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("loading");

    try {
      // Build q1_tasks: exclude rows where both fields are empty
      const q1Tasks = q1Rows
        .filter((r) => r.task.trim() !== "" || r.time.trim() !== "")
        .map((r) => ({
          task: r.task.trim(),
          time: parseTime(r.time),
        }));

      // Build q2_softwares: exclude rows where software is empty
      const q2Softwares = q2Rows
        .filter((r) => r.software.trim() !== "")
        .map((r) => ({
          software: r.software.trim(),
          satisfaction: r.satisfaction,
        }));

      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formState.firstName.trim(),
          lastName: formState.lastName.trim(),
          email: formState.email.trim(),
          phone: formState.phone.trim(),
          q1Tasks,
          q2Softwares,
          q3Text: q3Text.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Submit failed");

      setFormStatus("success");
      setFormState({ firstName: "", lastName: "", email: "", phone: "" });
    } catch {
      setFormStatus("error");
    }
  };

  /* tick marks helper */
  const ticks = (max: number) => {
    const arr = [];
    for (let i = 0; i <= max; i++) arr.push(<span key={i} />);
    return arr;
  };

  return (
    <>
      {/* inject pixel slider styles */}
      <style>{pixelSliderCSS}</style>

      <div className="min-h-screen bg-background text-foreground">
        {/* header bar */}
        <header className="border-b border-border/70 px-6 py-4">
          <a
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity"
          >
            &larr; Back to Sylvy
          </a>
        </header>

        {/* survey body */}
        <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pricing Survey
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Help Sylvy build its products.
          </p>

          <div className="mt-10 space-y-12">
            {/* ──── Q1 ──── */}
            <div>
              <label className="block text-lg font-medium leading-relaxed sm:text-xl">
                On average, what non-valuable tasks do you spend <span className={GREEN}>the most time </span> on (Lab notebook reporting, Planning experiments, Sorting out your data, Writing protocols,…) ?
              </label>

              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                {/* header */}
                <div className="grid grid-cols-[1fr_120px] bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <span>Task</span>
                  <span className="text-center">Time (h)</span>
                </div>
                {/* rows */}
                {q1Rows.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_120px] border-t border-border px-4 py-2 gap-3 items-center"
                  >
                    <input
                      type="text"
                      placeholder="e.g. Write report"
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={row.task}
                      onChange={(e) => updateQ1(i, "task", e.target.value)}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.0"
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-center outline-none focus:ring-1 focus:ring-primary"
                      value={row.time}
                      onChange={(e) => updateQ1(i, "time", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ──── Q2 ──── */}
            <div>
              <label className="block text-lg font-medium leading-relaxed sm:text-xl">
                What <span className={GREEN}>software</span> do you use for those tasks (Excel, Benchling, SnapGene, Google Calendar, Chat GPT,…) and are you satisfied about it ?
              </label>

              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                {/* header */}
                <div className="grid grid-cols-[1fr_180px] bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <span>Software</span>
                  <span className="text-center">Satisfied?</span>
                </div>
                {/* rows */}
                {q2Rows.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_180px] border-t border-border px-4 py-3 gap-3 items-center"
                  >
                    <input
                      type="text"
                      placeholder="e.g. Excel"
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={row.software}
                      onChange={(e) => updateQ2(i, "software", e.target.value)}
                    />
                    <div className="flex flex-col items-center gap-0.5">
                      <input
                        type="range"
                        className="pixel-slider"
                        min={0}
                        max={10}
                        step={1}
                        value={row.satisfaction}
                        onChange={(e) =>
                          updateQ2(i, "satisfaction", Number(e.target.value))
                        }
                      />
                      <div className="pixel-ticks">{ticks(10)}</div>
                      <div className="flex w-full justify-between text-[10px] text-muted-foreground">
                        <span>0</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ──── Q3 ──── */}
            <div>
              <label className="block text-lg font-medium leading-relaxed sm:text-xl">
                What <span className={GREEN}>feature</span> do you dream of ? <span className="italic">(Optional)</span>
              </label>

              <div className="mt-4">
                <textarea
                  rows={5}
                  placeholder="Type your answer here…"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary resize-y"
                  value={q3Text}
                  onChange={(e) => setQ3Text(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Send the survey */}
          <div className="mt-12 flex justify-center">
            <Button
              className="w-full max-w-xs rounded-md"
              onClick={openModal}
              disabled={formStatus === "success"}
            >
              {formStatus === "success" ? "Survey sent!" : "Send the survey"}
            </Button>
          </div>
        </main>
      </div>

      {/* ── Modal (same as "Try it" flow) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Almost there!</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Tell us about yourself so we can follow up.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm text-neutral-500 hover:text-neutral-900"
              >
                Cancel
              </button>
            </div>

            <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
              <Input
                name="firstName"
                placeholder="First name"
                value={formState.firstName}
                onChange={handleChange}
                required
              />
              <Input
                name="lastName"
                placeholder="Last name"
                value={formState.lastName}
                onChange={handleChange}
                required
              />
              <Input
                name="email"
                type="email"
                placeholder="Work email"
                value={formState.email}
                onChange={handleChange}
                required
              />
              <Input
                name="phone"
                type="tel"
                placeholder="Phone number"
                value={formState.phone}
                onChange={handleChange}
                required
              />
              <Button type="submit" disabled={formStatus === "loading"}>
                {formStatus === "loading" ? "..." : "Submit"}
              </Button>
              {formStatus === "success" && (
                <p className="text-xs text-[color:var(--theme-accent-strong)]">
                  Thanks! We will reach out.
                </p>
              )}
              {formStatus === "error" && (
                <p className="text-xs text-red-600">Something went wrong.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
