import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const apiKey = process.env.MISTRAL_API_KEY;

// POST — generate a structured report from protocol + notes
export async function POST(request: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let body: { protocolTitle?: string; protocolContent?: string; experimentNotes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { protocolTitle, protocolContent, experimentNotes } = body;

  if (!protocolContent || !experimentNotes) {
    return NextResponse.json(
      { error: "Both protocolContent and experimentNotes are required" },
      { status: 400 }
    );
  }

  const client = new Mistral({ apiKey });

  try {
    const prompt = `You are a scientific lab report generator. Given a protocol template and experimental notes, generate a structured experimental report.

## Protocol Title
${protocolTitle || "Untitled Protocol"}

## Protocol Content
${protocolContent}

## Experimental Notes
${experimentNotes}

## Instructions
Generate a structured JSON report with the following format:
{
  "title": "Protocol title",
  "date": "Today's date or extracted date",
  "steps": [
    {
      "stepNumber": 1,
      "expectedAction": "What the protocol says to do",
      "actualObservation": "What actually happened based on the notes",
      "parameters": ["param1: value1", "param2: value2"],
      "deviation": "Any deviation from the protocol, or null"
    }
  ],
  "summary": "Brief overall summary",
  "additionalNotes": "Any notes that don't map to specific steps"
}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation.`;

    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 502 });
    }

    const reportJson = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

    return NextResponse.json({ report: reportJson });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Report generation failed";
    console.error("Report generation error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
