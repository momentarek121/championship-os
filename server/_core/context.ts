import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { createClient } from "@supabase/supabase-js";
import { getUserByOpenId, upsertUser } from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function bearerToken(req: CreateExpressContextOptions["req"]) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

async function authenticateSupabase(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  const token = bearerToken(req);
  if (!token || !ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) return null;
  const supabase = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const openId = `supabase:${data.user.id}`;
  const isOwner = Boolean(ENV.ownerEmail && data.user.email?.toLowerCase() === ENV.ownerEmail.toLowerCase());
  await upsertUser({ openId, name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? data.user.email ?? "Organizer", email: data.user.email ?? null, loginMethod: "supabase", ...(isOwner ? { role: "admin" as const } : {}) });
  return (await getUserByOpenId(openId)) ?? null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await authenticateSupabase(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
