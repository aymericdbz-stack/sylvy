import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET — list all protocols
export async function GET() {
  const { data, error } = await supabase
    .from("nb_protocols")
    .select("id, title, content, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ protocols: data });
}

// POST — create or update a protocol
export async function POST(request: Request) {
  let body: { id?: string; title?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id, title, content } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (id) {
    // Update existing
    const { data, error } = await supabase
      .from("nb_protocols")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ protocol: data });
  } else {
    // Create new
    const { data, error } = await supabase
      .from("nb_protocols")
      .insert({ title, content: content || "" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ protocol: data });
  }
}
