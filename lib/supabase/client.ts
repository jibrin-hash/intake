import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        // Use a defensive lock bypass to prevent "signal is aborted without reason".
        // This dynamically finds the callback argument (usually the 2nd) and executes it.
        lock: async (...args: unknown[]) => {
          const callback = args.find((a) => typeof a === "function") as
            | (() => Promise<unknown>)
            | undefined;
          if (callback) return await callback();
          return Promise.resolve();
        }
      } as unknown as object
    }
  );

  return supabaseClient;
}
