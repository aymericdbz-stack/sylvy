"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Protocol {
  id: string;
  title: string;
  content?: string;
  created_at: string;
}

interface Step1Props {
  onNewProtocol: (title: string) => void;
  onSelectExisting: (protocol: Protocol) => void;
}

export function Step1_ChooseProtocol({ onNewProtocol, onSelectExisting }: Step1Props) {
  const [mode, setMode] = useState<"choose" | "new" | "existing">("choose");
  const [title, setTitle] = useState("");
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProtocols = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notebook/protocols");
      const data = await res.json();
      if (res.ok) {
        setProtocols(data.protocols || []);
      }
    } catch {
      // Silently fail — may not have table yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "existing") {
      fetchProtocols();
    }
  }, [mode, fetchProtocols]);

  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Please enter a protocol title.");
      return;
    }
    onNewProtocol(trimmed);
  };

  const handleSelectProtocol = async (protocol: Protocol) => {
    // Fetch full protocol content
    try {
      const res = await fetch("/api/notebook/protocols");
      const data = await res.json();
      const full = data.protocols?.find((p: Protocol) => p.id === protocol.id);
      if (full) {
        // Re-fetch with content
        onSelectExisting(full);
      } else {
        onSelectExisting(protocol);
      }
    } catch {
      onSelectExisting(protocol);
    }
  };

  const filtered = protocols.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  // Main choice screen
  if (mode === "choose") {
    return (
      <div className="mx-auto max-w-lg space-y-8 text-center">
        <div className="space-y-3">
          <h2
            className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ fontFamily: "Pulp, sans-serif" }}
          >
            Choose a <span style={{ color: "#00ac73" }}>Protocol</span>
          </h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Start by selecting how you want to set up your experimental protocol.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <button
            type="button"
            onClick={() => setMode("new")}
            className="flex-1 rounded-2xl border-2 p-8 text-left transition-all hover:shadow-md"
            style={{ borderColor: "#d1d5db", background: "#fff" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#00ac73";
              e.currentTarget.style.background = "#ecfdf5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.background = "#fff";
            }}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#d1fae5" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ac73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "#111827" }}>
              Create New Protocol
            </h3>
            <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>
              Start from scratch with a new protocol
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("existing")}
            className="flex-1 rounded-2xl border-2 p-8 text-left transition-all hover:shadow-md"
            style={{ borderColor: "#d1d5db", background: "#fff" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#00ac73";
              e.currentTarget.style.background = "#ecfdf5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.background = "#fff";
            }}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#d1fae5" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ac73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "#111827" }}>
              Use Existing Protocol
            </h3>
            <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>
              Select from your saved protocols
            </p>
          </button>
        </div>
      </div>
    );
  }

  // New protocol form
  if (mode === "new") {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "Pulp, sans-serif" }}
          >
            Name your <span style={{ color: "#00ac73" }}>Protocol</span>
          </h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Give your protocol a descriptive title.
          </p>
        </div>

        <form onSubmit={handleNewSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="e.g., Western Blot — Anti-GFP"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            autoFocus
            className="h-12 rounded-xl text-base"
            style={{ background: "#fff", border: "1px solid #e5e7eb" }}
          />
          {error && (
            <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setMode("choose")}
              className="h-11 flex-1 rounded-xl text-sm font-medium"
              style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db" }}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 rounded-xl text-sm font-semibold"
              style={{ background: "#00ac73", color: "#fff" }}
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Existing protocol selection
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2 text-center">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "Pulp, sans-serif" }}
        >
          Select a <span style={{ color: "#00ac73" }}>Protocol</span>
        </h2>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          Choose from your saved protocols.
        </p>
      </div>

      <Input
        type="text"
        placeholder="Search protocols..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11 rounded-xl text-sm"
        style={{ background: "#fff", border: "1px solid #e5e7eb" }}
      />

      <div className="max-h-80 space-y-2 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4" style={{ borderColor: "#d1fae5", borderTopColor: "#00ac73" }} />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm" style={{ color: "#9ca3af" }}>
            {protocols.length === 0 ? "No saved protocols yet." : "No protocols match your search."}
          </p>
        )}
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSelectProtocol(p)}
            className="w-full rounded-xl border p-4 text-left transition-all hover:shadow-sm"
            style={{ background: "#fff", borderColor: "#e5e7eb" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#00ac73";
              e.currentTarget.style.background = "#f0fdf4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.background = "#fff";
            }}
          >
            <p className="font-medium" style={{ color: "#111827" }}>{p.title}</p>
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              {new Date(p.created_at).toLocaleDateString()}
            </p>
          </button>
        ))}
      </div>

      <Button
        type="button"
        onClick={() => setMode("choose")}
        className="w-full h-11 rounded-xl text-sm font-medium"
        style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db" }}
      >
        Back
      </Button>
    </div>
  );
}
