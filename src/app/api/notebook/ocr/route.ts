import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const apiKey = process.env.MISTRAL_API_KEY;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(request: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 }
    );
  }

  let payload: { file?: string; mimeType?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { file, mimeType } = payload;

  if (!file || !mimeType) {
    return NextResponse.json(
      { error: "Missing file or mimeType" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 }
    );
  }

  // Check approximate size from base64
  const approxBytes = (file.length * 3) / 4;
  if (approxBytes > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 20 MB)" },
      { status: 400 }
    );
  }

  const client = new Mistral({ apiKey });
  const dataUri = `data:${mimeType};base64,${file}`;

  try {
    const isPdf = mimeType === "application/pdf";

    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: isPdf
        ? { type: "document_url", documentUrl: dataUri }
        : { type: "image_url", imageUrl: dataUri },
    });

    const pages = ocrResponse.pages ?? [];
    const markdown = pages.map((p) => p.markdown).join("\n\n---\n\n");

    return NextResponse.json({
      markdown,
      pageCount: pages.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OCR processing failed";
    console.error("Mistral OCR error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
