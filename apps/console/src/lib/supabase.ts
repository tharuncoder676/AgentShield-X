import { createClient } from "@supabase/supabase-js";

// Supabase project nzqgxglxofcvavtvszir configuration
const env = (import.meta as any).env || {};
export const SUPABASE_URL =
  env.VITE_SUPABASE_URL || "https://nzqgxglxofcvavtvszir.supabase.co";

export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cWd4Z2x4b2ZjdmF2dHZzemlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4MjkzMjMsImV4cCI6MjAyNTQwNTMyM30.default_anon_key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Triggers official Supabase OAuth flow for Google or Apple
 */
export async function signInWithProvider(provider: "google" | "apple") {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/overview`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "OAuth redirect failed" };
  }
}
