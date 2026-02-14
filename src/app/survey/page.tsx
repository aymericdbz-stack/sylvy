"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

/* ──────── Questions ──────── */
const QUESTIONS = [
  {
    label:
      "How much would you personally be willing to pay per month for Sylvy notebook\u2122\uFE0F only?",
    min: 0,
    max: 20,
    key: "notebook" as const,
  },
  {
    label:
      "How much would you personally pay per month for Sylvy planner\u2122\uFE0F only?",
    min: 0,
    max: 20,
    key: "planner" as const,
  },
  {
    label: "How much should Sylvy labmind\u2122\uFE0F cost per month?",
    min: 0,
    max: 50,
    key: "labmind" as const,
  },
] as const;

/* ──────── Component ──────── */
export default function SurveyPage() {
  const [answers, setAnswers] = useState({
    notebook: 10,
    planner: 10,
    labmind: 25,
  });

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

  /* slider change */
  const handleSlider = (key: "notebook" | "planner" | "labmind", val: number) =>
    setAnswers((prev) => ({ ...prev, [key]: val }));

  /* form field change */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  /* open modal on "Send the survey" click */
  const openModal = () => {
    setIsModalOpen(true);
    setFormStatus("idle");
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setFormStatus("idle");
  };

  /* submit modal form → client + survey */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("loading");

    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formState.firstName.trim(),
          lastName: formState.lastName.trim(),
          email: formState.email.trim(),
          phone: formState.phone.trim(),
          notebook: answers.notebook,
          planner: answers.planner,
          labmind: answers.labmind,
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
            Help us find the right price for each Sylvy product.
          </p>

          <div className="mt-10 space-y-10">
            {QUESTIONS.map((q) => (
              <div key={q.key}>
                <label className="block text-sm font-medium leading-relaxed">
                  {q.label}
                </label>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      className="pixel-slider"
                      min={q.min}
                      max={q.max}
                      step={1}
                      value={answers[q.key]}
                      onChange={(e) =>
                        handleSlider(q.key, Number(e.target.value))
                      }
                    />
                    <div className="pixel-ticks">{ticks(q.max)}</div>
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>{q.min}&euro;</span>
                      <span>{q.max}&euro;</span>
                    </div>
                  </div>

                  {/* selected value */}
                  <span className="w-14 shrink-0 text-right text-lg font-bold tabular-nums">
                    &euro;{answers[q.key]}
                  </span>
                </div>
              </div>
            ))}
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
