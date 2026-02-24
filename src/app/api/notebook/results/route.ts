import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST — save result files with context
export async function POST(request: Request) {
  let body: {
    experiment_id: string;
    files: Array<{
      file_name: string;
      file_type: string;
      file_size: number;
      file_data: string; // base64
      description: string;
      protocol_step?: string;
      tags?: string[];
    }>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!body.experiment_id || !body.files?.length) {
    return NextResponse.json(
      { error: "experiment_id and at least one file are required" },
      { status: 400 }
    );
  }

  const rows = body.files.map((f) => ({
    experiment_id: body.experiment_id,
    file_name: f.file_name,
    file_type: f.file_type,
    file_size: f.file_size,
    file_data: f.file_data,
    description: f.description || "",
    protocol_step: f.protocol_step || null,
    tags: f.tags || [],
  }));

  const { data, error } = await supabase
    .from("nb_result_files")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data });
}
