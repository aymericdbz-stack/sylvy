"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ReportBlock } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import LabProcessEditor from "./LabProcessEditor";

interface ResultsCommentsEditorProps {
  reportId: string | null;
  experimentId: string;
  orgId: string;
  blocks: ReportBlock[];
}

type SaveStatus = "saving" | "saved" | "idle";

export default function ResultsCommentsEditor({ reportId: initialReportId, experimentId, orgId, blocks }: ResultsCommentsEditorProps) {
  const [resolvedReportId, setResolvedReportId] = useState<string | null>(initialReportId);
  const [resultsId, setResultsId] = useState<string | null>(null);
  const [commentsId, setCommentsId] = useState<string | null>(null);
  const [resultsValue, setResultsValue] = useState("");
  const [commentsValue, setCommentsValue] = useState("");
  const [resultsSave, setResultsSave] = useState<SaveStatus>("idle");
  const [commentsSave, setCommentsSave] = useState<SaveStatus>("idle");
  const [ready, setReady] = useState(false);

  const resultsTimer = useRef<NodeJS.Timeout | null>(null);
  const commentsTimer = useRef<NodeJS.Timeout | null>(null);
  const resultsInFlight = useRef<Promise<void> | null>(null);
  const commentsInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();

      // Resolve or create report
      let reportId = resolvedReportId;
      if (!reportId) {
        // Check if a report already exists for this experiment
        const { data: existing } = await supabase
          .from("reports")
          .select("id")
          .eq("experiment_id", experimentId)
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          reportId = existing.id;
        } else {
          // Create a minimal stub report
          const { data: { user } } = await supabase.auth.getUser();
          if (!user?.id) return;
          const { data: created } = await supabase
            .from("reports")
            .insert({ experiment_id: experimentId, created_by: user.id })
            .select("id")
            .single();
          reportId = created?.id ?? null;
        }

        if (reportId) setResolvedReportId(reportId);
      }

      if (!reportId) return;

      // Fetch all blocks for this report
      const { data: allBlocks } = await supabase
        .from("report_blocks")
        .select("*")
        .eq("report_id", reportId)
        .order("order", { ascending: true });

      const current = (allBlocks as ReportBlock[]) ?? blocks;

      const allResultsHeadings = current.filter((b) => b.type === "heading" && /result/i.test(b.content || ""));
      const allCommentsHeadings = current.filter((b) => b.type === "heading" && /comment/i.test(b.content || ""));

      const getTextBlockAfter = (heading: ReportBlock, all: ReportBlock[]): ReportBlock | null => {
        const nextHeadingOrder = all.find(
          (b) => b.type === "heading" && b.order > heading.order,
        )?.order ?? Infinity;
        return all.find((b) => b.type === "text" && b.order > heading.order && b.order < nextHeadingOrder) ?? null;
      };

      const deduplicateSection = async (headings: ReportBlock[]): Promise<{ headingId: string; textBlock: ReportBlock | null }> => {
        if (headings.length === 0) return { headingId: "", textBlock: null };
        const pairs = headings.map((h) => ({ heading: h, text: getTextBlockAfter(h, current) }));
        const winner = pairs.find((p) => p.text?.content?.trim()) ?? pairs[0];
        const losers = pairs.filter((p) => p !== winner);
        const idsToDelete = losers.flatMap((p) => [p.heading.id, p.text?.id].filter(Boolean) as string[]);
        if (idsToDelete.length > 0) {
          await supabase.from("report_blocks").delete().in("id", idsToDelete);
        }
        return { headingId: winner.heading.id, textBlock: winner.text };
      };

      type InsertBlock = {
        report_id: string;
        template_block_id: null;
        type: "heading" | "text";
        order: number;
        content: string | null;
      };
      let nextOrder = current.length > 0 ? Math.max(...current.map((b) => b.order)) : 0;

      let rId: string | null = null;
      let rVal = "";
      if (allResultsHeadings.length > 0) {
        const { textBlock } = await deduplicateSection(allResultsHeadings);
        if (textBlock) {
          rId = textBlock.id;
          rVal = textBlock.content ?? "";
        } else {
          const toCreate: InsertBlock[] = [
            { report_id: reportId, template_block_id: null, type: "text", order: ++nextOrder, content: null },
          ];
          const { data: created } = await supabase.from("report_blocks").insert(toCreate).select();
          rId = created?.[0]?.id ?? null;
        }
      } else {
        const toCreate: InsertBlock[] = [
          { report_id: reportId, template_block_id: null, type: "heading", order: ++nextOrder, content: "Results" },
          { report_id: reportId, template_block_id: null, type: "text", order: ++nextOrder, content: null },
        ];
        const { data: created } = await supabase.from("report_blocks").insert(toCreate).select();
        rId = created?.find((b) => b.type === "text")?.id ?? null;
      }

      let cId: string | null = null;
      let cVal = "";
      const { data: refreshed } = await supabase
        .from("report_blocks")
        .select("order")
        .eq("report_id", reportId)
        .order("order", { ascending: false })
        .limit(1);
      nextOrder = refreshed?.[0]?.order ?? nextOrder;

      if (allCommentsHeadings.length > 0) {
        const { textBlock } = await deduplicateSection(allCommentsHeadings);
        if (textBlock) {
          cId = textBlock.id;
          cVal = textBlock.content ?? "";
        } else {
          const toCreate: InsertBlock[] = [
            { report_id: reportId, template_block_id: null, type: "text", order: ++nextOrder, content: null },
          ];
          const { data: created } = await supabase.from("report_blocks").insert(toCreate).select();
          cId = created?.[0]?.id ?? null;
        }
      } else {
        const toCreate: InsertBlock[] = [
          { report_id: reportId, template_block_id: null, type: "heading", order: ++nextOrder, content: "Comments" },
          { report_id: reportId, template_block_id: null, type: "text", order: ++nextOrder, content: null },
        ];
        const { data: created } = await supabase.from("report_blocks").insert(toCreate).select();
        cId = created?.find((b) => b.type === "text")?.id ?? null;
      }

      setResultsId(rId);
      setCommentsId(cId);
      setResultsValue(rVal);
      setCommentsValue(cVal);
      setReady(true);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId]);

  const saveBlock = useCallback(
    async (id: string, content: string, setSave: (s: SaveStatus) => void) => {
      const supabase = createClient();
      setSave("saving");
      try {
        await supabase.from("report_blocks").update({ content }).eq("id", id);
        setSave("saved");
        setTimeout(() => setSave("idle"), 2000);
      } catch {
        setSave("idle");
      }
    },
    [],
  );

  const flushPendingSaves = useCallback(async () => {
    const tasks: Array<Promise<void>> = [];

    if (resultsTimer.current) {
      clearTimeout(resultsTimer.current);
      resultsTimer.current = null;
      if (resultsId) {
        const p = saveBlock(resultsId, resultsValue, setResultsSave);
        resultsInFlight.current = p;
        p.finally(() => {
          if (resultsInFlight.current === p) resultsInFlight.current = null;
        });
        tasks.push(p);
      }
    } else if (resultsInFlight.current) {
      tasks.push(resultsInFlight.current);
    }

    if (commentsTimer.current) {
      clearTimeout(commentsTimer.current);
      commentsTimer.current = null;
      if (commentsId) {
        const p = saveBlock(commentsId, commentsValue, setCommentsSave);
        commentsInFlight.current = p;
        p.finally(() => {
          if (commentsInFlight.current === p) commentsInFlight.current = null;
        });
        tasks.push(p);
      }
    } else if (commentsInFlight.current) {
      tasks.push(commentsInFlight.current);
    }

    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }
  }, [commentsId, commentsValue, resultsId, resultsValue, saveBlock]);

  const handleResultsChange = useCallback(
    (value: string) => {
      setResultsValue(value);
      if (!resultsId) return;
      if (resultsTimer.current) clearTimeout(resultsTimer.current);
      resultsTimer.current = setTimeout(() => {
        resultsTimer.current = null;
        const p = saveBlock(resultsId, value, setResultsSave);
        resultsInFlight.current = p;
        p.finally(() => {
          if (resultsInFlight.current === p) resultsInFlight.current = null;
        });
      }, 1500);
    },
    [resultsId, saveBlock],
  );

  const handleCommentsChange = useCallback(
    (value: string) => {
      setCommentsValue(value);
      if (!commentsId) return;
      if (commentsTimer.current) clearTimeout(commentsTimer.current);
      commentsTimer.current = setTimeout(() => {
        commentsTimer.current = null;
        const p = saveBlock(commentsId, value, setCommentsSave);
        commentsInFlight.current = p;
        p.finally(() => {
          if (commentsInFlight.current === p) commentsInFlight.current = null;
        });
      }, 1500);
    },
    [commentsId, saveBlock],
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { experimentId?: string; add?: (p: Promise<void>) => void }
        | undefined;
      if (!detail?.add) return;
      if (detail.experimentId && detail.experimentId !== experimentId) return;
      detail.add(flushPendingSaves());
    };

    window.addEventListener("sylvy:reportBlocksFlush", handler as EventListener);
    return () => window.removeEventListener("sylvy:reportBlocksFlush", handler as EventListener);
  }, [experimentId, flushPendingSaves]);

  useEffect(() => {
    return () => {
      if (resultsTimer.current) clearTimeout(resultsTimer.current);
      if (commentsTimer.current) clearTimeout(commentsTimer.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 font-nb-mono">
        <h2 className="text-[13px] font-[700] text-nb-muted uppercase tracking-[0.06em] mb-4">Lab notebook</h2>
        <LabProcessEditor
          reportId={resolvedReportId}
          experimentId={experimentId}
          orgId={orgId}
        />
      </div>

      <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 font-nb-mono">
        <div>
          <textarea
            value={resultsValue}
            onChange={(e) => handleResultsChange(e.target.value)}
            placeholder="Enter your results..."
            rows={4}
            disabled={!ready}
            className="w-full p-3 border border-nb-cream-border rounded-[6px] text-[13px] font-nb-mono resize-none focus:outline-none focus:ring-1 focus:ring-nb-green disabled:opacity-40"
          />
          {resultsSave !== "idle" && (
            <p className="text-[10px] text-nb-muted mt-1">
              {resultsSave === "saving" ? "Saving..." : "Saved"}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 font-nb-mono">
        <div>
          <textarea
            value={commentsValue}
            onChange={(e) => handleCommentsChange(e.target.value)}
            placeholder="Enter your comments..."
            rows={4}
            disabled={!ready}
            className="w-full p-3 border border-nb-cream-border rounded-[6px] text-[13px] font-nb-mono resize-none focus:outline-none focus:ring-1 focus:ring-nb-green disabled:opacity-40"
          />
          {commentsSave !== "idle" && (
            <p className="text-[10px] text-nb-muted mt-1">
              {commentsSave === "saving" ? "Saving..." : "Saved"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
