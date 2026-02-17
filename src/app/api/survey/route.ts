import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/* ──────── Types ──────── */
interface Q1Task {
  task: string;
  time: number | null;
}

interface Q2Software {
  software: string;
  satisfaction: number;
}

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
    q1Tasks?: Q1Task[];
    q2Softwares?: Q2Software[];
    q3Text?: string | null;
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

  if (!firstName || !lastName || !email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Validate q1Tasks
  const q1Tasks: Q1Task[] = Array.isArray(payload.q1Tasks)
    ? payload.q1Tasks
        .filter(
          (r): r is Q1Task =>
            typeof r === "object" &&
            r !== null &&
            typeof r.task === "string"
        )
        .map((r) => ({
          task: r.task.trim(),
          time:
            r.time === null || r.time === undefined
              ? null
              : typeof r.time === "number" && isFinite(r.time)
                ? r.time
                : null,
        }))
    : [];

  // Validate q2Softwares
  const q2Softwares: Q2Software[] = Array.isArray(payload.q2Softwares)
    ? payload.q2Softwares
        .filter(
          (r): r is Q2Software =>
            typeof r === "object" &&
            r !== null &&
            typeof r.software === "string" &&
            typeof r.satisfaction === "number"
        )
        .map((r) => ({
          software: r.software.trim(),
          satisfaction: Math.max(0, Math.min(10, Math.round(r.satisfaction))),
        }))
    : [];

  const q3Text =
    typeof payload.q3Text === "string" ? payload.q3Text.trim() || null : null;

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

  // 2) Insert survey row with new schema
  const { error: surveyError } = await supabase
    .from("surveys_pricing")
    .insert({
      client_id: clientData.id,
      q1_tasks: q1Tasks,
      q2_softwares: q2Softwares,
      q3_text: q3Text,
    });

  if (surveyError) {
    return NextResponse.json(
      { error: "Survey insert failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
