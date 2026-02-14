import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 }
    );
  }

  let payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    notebook?: number;
    planner?: number;
    labmind?: number;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const firstName = payload.firstName?.trim() ?? "";
  const lastName = payload.lastName?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const phone = payload.phone?.trim() ?? null;
  const notebook = payload.notebook;
  const planner = payload.planner;
  const labmind = payload.labmind;

  if (!firstName || !lastName || !email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (
    notebook == null || planner == null || labmind == null ||
    !Number.isInteger(notebook) || !Number.isInteger(planner) || !Number.isInteger(labmind) ||
    notebook < 0 || notebook > 20 ||
    planner < 0 || planner > 20 ||
    labmind < 0 || labmind > 50
  ) {
    return NextResponse.json({ error: "Invalid survey answers" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  // 1) Upsert client (dedupe by email)
  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .upsert(
      { first_name: firstName, last_name: lastName, email, phone_number: phone },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (clientError || !clientData) {
    return NextResponse.json(
      { error: "Client insert failed" },
      { status: 500 }
    );
  }

  // 2) Insert survey row
  const { error: surveyError } = await supabase
    .from("surveys_pricing")
    .insert({
      client_id: clientData.id,
      notebook_price_eur_int: notebook,
      planner_price_eur_int: planner,
      labmind_price_eur_int: labmind,
    });

  if (surveyError) {
    return NextResponse.json(
      { error: "Survey insert failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
