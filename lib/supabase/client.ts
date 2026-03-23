import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        // Disable the navigator.locks API locking to prevent "signal is aborted without reason".
        // This is safe because we are using cookies for session sync via @supabase/ssr.
        // We use a simple lock bypass that just executes the callback.
        lock: async (name: string, callback: () => Promise<unknown>) => {
          console.log("[SupabaseClient] Executing auth lock callback for:", name);
          return await callback();
        }
      } as unknown as object
    }
  );

  return supabaseClient;
}
