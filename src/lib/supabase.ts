import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type TypedClient = SupabaseClient<Database>;

// Lazy singleton — evaluated at runtime, not at build time, so missing env vars
// during static analysis don't crash the build.
let _client: TypedClient | null = null;

export function getServiceClient(): TypedClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
      );
    }
    _client = createClient<Database>(url, key);
  }
  return _client;
}

// Backward-compat named export used by existing notebook API routes.
// Uses a Proxy so the module can be imported at build time without env vars present.
export const supabase: TypedClient = new Proxy({} as TypedClient, {
  get(_target, prop) {
    return (getServiceClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
