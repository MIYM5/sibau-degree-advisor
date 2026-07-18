import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { validateResearchDatabaseConfig } from "../research-record-validation";

export type ServerSupabaseClientResult =
  | { isConfigured: true; client: SupabaseClient; errorCode: null }
  | {
      isConfigured: false;
      client: null;
      errorCode: "research_database_unavailable";
    };

/**
 * Creates a service-role client only on the server. Configuration never enables
 * research collection by itself; the API must evaluate governance, participant
 * eligibility, consent, and submission validation before calling the database.
 */
export function createServerSupabaseClient(
  environment: NodeJS.ProcessEnv = process.env,
): ServerSupabaseClientResult {
  const configuration = validateResearchDatabaseConfig(environment);
  if (!configuration.isConfigured) {
    return {
      isConfigured: false,
      client: null,
      errorCode: "research_database_unavailable",
    };
  }

  return {
    isConfigured: true,
    errorCode: null,
    client: createClient(
      environment.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      environment.SUPABASE_SERVICE_ROLE_KEY!.trim(),
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    ),
  };
}
