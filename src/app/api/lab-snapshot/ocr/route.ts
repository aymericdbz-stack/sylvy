import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Resend } from "resend";

const SYSTEM_PROMPT = `You are a scientific lab notebook transcription and synthesis assistant. The user uploads photos of handwritten or printed lab notebook pages.

Your job:
- Transcribe ALL visible content from ALL pages completely and accurately
- Organize content chronologically by date if dates are visible
- Synthesize the content into a structured scientific document

Return a JSON object with exactly these six string keys:
{ "experimentName": "...", "tags": "...", "abstract": "...", "summary": "...", "analysis": "...", "rawOcrText": "..." }

FIELD INSTRUCTIONS:

experimentName — The experiment name or title. Infer from context if not explicit.

tags — Exactly 5 short tags, one per line, starting with capital letters. Format as vertical list. Example:
- Bacterial Culture
- Temperature Control
- Growth Rate Analysis
- pH Measurement
- Incubation Study

abstract — A summary with key points. 5-7 items maximum, one per line. Cover: type of experiment, date range, organisms/samples/molecules, conditions tested, key outcome if visible. Use "-" for each item.

summary — A clean, reformatted version of the full notebook content. This is the ENTIRE raw transcription but cleaned and organized better. The word count must be almost identical to the original document (aim for 95-100% of the original length). Preserve ALL information — same level of detail as the original, nothing omitted. Only make very slight improvements: fix obvious typos, expand clear abbreviations, improve formatting. Keep prose where original is prose; use "-" markers where content is naturally a list. No bold markers or ** symbols.

analysis — Three labeled sections, each with 3-5 items. This must be a single plain string formatted exactly as:
MAIN FINDINGS:
- key result or observation
WATCH CLOSELY:
- anomaly, deviation, or item to re-check
POSITIVES:
- what worked well or confirmed hypothesis

rawOcrText — COMPLETE verbatim transcription of ALL text visible across ALL pages. This must be EXACTLY the same word count as the original document — word-for-word transcription with absolutely nothing omitted or summarized. Where dates appear, write the date on its own line (no dashes around it), then the content below. Include all handwritten notes, values, labels, table contents, headers, marginal notes, crossed-out text, and any other text present. This is a pure OCR output with zero modifications.

Rules:
- Never invent data. Transcribe only what is visible.
- If a field cannot be filled, return an empty string "".
- Preserve scientific notation, units, and terminology exactly.
- Return only the JSON object, no markdown fences, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageBlocks: any[] = [];

    for (const file of files) {
      const isImage =
        file.type.startsWith("image/") ||
        /\.(png|jpe?g|webp|heic|heif)$/i.test(file.name);

      if (!isImage) continue;

      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = file.type || "image/jpeg";

      imageBlocks.push({
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${base64}`, detail: "auto" },
      });
    }

    if (imageBlocks.length === 0) {
      return NextResponse.json({
        experimentName: "",
        tags: "",
        abstract: "",
        summary: "",
        analysis: "",
        rawOcrText: "",
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these ${imageBlocks.length} lab notebook page(s). Transcribe everything and produce the structured document as instructed.`,
            },
            ...imageBlocks,
          ],
        },
      ],
      max_tokens: 6000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Failed to parse response", raw }, { status: 500 });
    }

    // Send email in background without blocking response
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      // Fire-and-forget: don't await, catch errors silently
      resend.emails.send({
        from: "Lab Snapshot <onboarding@resend.dev>",
        to: "mrikdbz@gmail.com",
        subject: `[OCR] ${parsed.experimentName || "Untitled"} — Raw transcription`,
        html: `
          <div style="font-family: monospace; max-width: 700px; margin: 0 auto; padding: 32px; background: #faf9f6; color: #1a1a1a;">
            <h2 style="color: #4CAF7D; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px;">Lab Snapshot — Raw OCR Output</h2>
            <h1 style="font-size: 18px; margin-top: 0; margin-bottom: 4px;">${parsed.experimentName || "Untitled Experiment"}</h1>
            <p style="font-size: 11px; color: #9A9A9A; margin-bottom: 24px;">${imageBlocks.length} page(s) analyzed</p>
            <hr style="border: none; border-top: 1px solid #D8D2C8; margin-bottom: 24px;" />
            <p style="font-size: 11px; color: #6B6B6B; margin-bottom: 8px; letter-spacing: 0.1em; text-transform: uppercase;">Raw Transcription</p>
            <pre style="font-size: 12px; line-height: 1.75; white-space: pre-wrap; color: #1a1a1a; background: #f0ede6; padding: 16px; border-radius: 4px;">${(parsed.rawOcrText || "—").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
          </div>
        `,
      }).catch((err) => {
        console.error("[email-send-error]", err);
      });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[lab-snapshot/ocr]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
