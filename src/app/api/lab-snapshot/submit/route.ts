import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

interface SectionPayload {
  num: number;
  type: string;
  title: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rating, comment, experimentName, format, sections } = body as {
      rating: number;
      comment: string;
      experimentName: string;
      format: string;
      sections: SectionPayload[];
    };

    // Save feedback to Supabase (fire and forget errors)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from("lab_snapshot_feedback").insert({
        rating: Number(rating),
        comment: comment || null,
        experiment_name: experimentName || null,
      });
    } catch (e) {
      console.error("[lab-snapshot/submit] Supabase error:", e);
    }

    // Second email: final reworked content (fire-and-forget, silent)
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const resend = new Resend(resendKey);

        const sectionsHtml = (sections || [])
          .filter((s) => s.type !== "rawNotebook")
          .map((s) => `
            <div style="margin-bottom: 28px;">
              <p style="font-size: 11px; color: #6B6B6B; margin-bottom: 4px; letter-spacing: 0.1em; text-transform: uppercase;">${s.num}. ${s.title}</p>
              <div style="font-size: 13px; line-height: 1.75; white-space: pre-wrap; color: ${s.type === "rawTranscription" ? "#9A9A9A" : "#1a1a1a"};">${(s.content || "—").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}</div>
            </div>
          `).join("");

        await resend.emails.send({
          from: "Lab Snapshot <noreply@sylvy.co>",
          to: "mrikdbz@gmail.com",
          subject: `[2/2 — EXPORT ${(format || "").toUpperCase()}] ${experimentName || "Untitled"} — Final report`,
          html: `
            <div style="font-family: monospace; max-width: 700px; margin: 0 auto; padding: 32px; background: #faf9f6; color: #1a1a1a;">
              <h2 style="color: #4CAF7D; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px;">Lab Snapshot — 2/2 — Final Exported Report</h2>
              <h1 style="font-size: 18px; margin-top: 0; margin-bottom: 4px;">${experimentName || "Untitled Experiment"}</h1>
              <p style="font-size: 11px; color: #9A9A9A; margin-bottom: 8px;">Exported as ${(format || "").toUpperCase()}</p>
              <p style="font-size: 11px; color: #6B6B6B; margin-bottom: 24px;">Rating: <strong style="color: #4CAF7D; font-size: 15px;">${rating}/10</strong>${comment ? ` — "${comment}"` : ""}</p>
              <hr style="border: none; border-top: 1px solid #D8D2C8; margin-bottom: 28px;" />
              ${sectionsHtml}
            </div>
          `,
        });
      }
    } catch (e) {
      console.error("[lab-snapshot/submit] Email error:", e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lab-snapshot/submit]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
