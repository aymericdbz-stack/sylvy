import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";

// POST — create a new QR session or submit files to an existing session
export async function POST(request: Request) {
  let body: {
    action: "create" | "submit" | "check";
    sessionToken?: string;
    filesData?: Array<{ file: string; mimeType: string; fileName: string }>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (body.action === "create") {
    // Generate a unique session token
    const sessionToken = `qr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    // Save to Supabase
    const { error } = await supabase.from("qr_sessions").insert({
      session_token: sessionToken,
      status: "pending",
      files_data: null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate QR code as data URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sylvy.co";
    const captureUrl = `${appUrl}/notebook/capture/${sessionToken}`;
    const qrDataUrl = await QRCode.toDataURL(captureUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#00ac73", light: "#ffffff" },
    });

    return NextResponse.json({ sessionToken, qrDataUrl, captureUrl });
  }

  if (body.action === "submit") {
    if (!body.sessionToken || !body.filesData?.length) {
      return NextResponse.json(
        { error: "sessionToken and filesData are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("nb_qr_sessions")
      .update({
        status: "submitted",
        files_data: body.filesData,
        updated_at: new Date().toISOString(),
      })
      .eq("session_token", body.sessionToken);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "check") {
    if (!body.sessionToken) {
      return NextResponse.json({ error: "sessionToken is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("nb_qr_sessions")
      .select("status, files_data")
      .eq("session_token", body.sessionToken)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: data.status, filesData: data.files_data });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
