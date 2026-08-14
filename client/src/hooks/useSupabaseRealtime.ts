import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { useEffect } from "react";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const client = url && anonKey ? createClient(url, anonKey, { realtime: { params: { eventsPerSecond: 10 } } }) : null;

export function useSupabaseRealtime(scope: string | number | undefined, onChange: () => void) {
  useEffect(() => {
    if (!client || scope == null) return;
    let channel: RealtimeChannel | null = client.channel(`championship-os:${scope}`);
    const refresh = () => onChange();
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations", filter: `tournament_id=eq.${scope}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `tournament_id=eq.${scope}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "mats", filter: `tournament_id=eq.${scope}` }, refresh)
      .subscribe();
    return () => {
      if (channel) void client.removeChannel(channel);
      channel = null;
    };
  }, [scope, onChange]);
}
