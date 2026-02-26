import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Json } from "@/lib/supabase/types";

// POST — create or update a notebook experiment
export async function POST(request: Request) {
  let body: {
    id?: string;
    protocol_id?: string;
    notes_raw?: string;
    notes_parsed?: string;
    report_json?: Json;
    status?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (body.id) {
    // Update existing experiment
    const updateData: { updated_at: string; notes_raw?: string | null; notes_parsed?: string | null; report_json?: Json; status?: string } = { updated_at: new Date().toISOString() };
    if (body.notes_raw !== undefined) updateData.notes_raw = body.notes_raw;
    if (body.notes_parsed !== undefined) updateData.notes_parsed = body.notes_parsed;
    if (body.report_json !== undefined) updateData.report_json = body.report_json;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from("nb_experiments")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ experiment: data });
  } else {
    // Create new experiment
    if (!body.protocol_id) {
      return NextResponse.json({ error: "protocol_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("nb_experiments")
      .insert({
        protocol_id: body.protocol_id,
        notes_raw: body.notes_raw || "",
        notes_parsed: body.notes_parsed || "",
        report_json: body.report_json || null,
        status: body.status || "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ experiment: data });
  }
}
