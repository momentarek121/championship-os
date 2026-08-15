import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anonKey
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

export async function signInWithGoogle() {
  if (!supabase) throw new Error("Supabase Auth is not configured");
  const result = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin, skipBrowserRedirect: true } });
  if (!result.error && result.data?.url) window.location.assign(result.data.url);
  return result;
}

export async function sendEmailMagicLink(email: string) {
  if (!supabase) throw new Error("Supabase Auth is not configured");
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
}

export async function sendPhoneOtp(phone: string) {
  if (!supabase) throw new Error("Supabase Auth is not configured");
  return supabase.auth.signInWithOtp({ phone });
}

export async function verifyPhoneOtp(phone: string, token: string) {
  if (!supabase) throw new Error("Supabase Auth is not configured");
  return supabase.auth.verifyOtp({ phone, token, type: "sms" });
}
