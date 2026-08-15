import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function MatWorkspace() {
  const { user, loading } = useAuth();
  const dashboard = trpc.tournament.dashboard.useQuery(undefined, { enabled: true, retry: false, refetchInterval: 3000 });
  const reassign = trpc.tournament.reassignMatchMat.useMutation({ onSuccess: () => { toast.success("Match assigned to mat"); dashboard.refetch(); }, onError: error => toast.error(error.message) });
  const [dragged, setDragged] = useState<number | null>(null);
  const data = dashboard.data;
  const tournament = data?.tournaments?.[0];
  const matches = data?.matches ?? [];
  const mats = data?.mats ?? [];
  const athletes = data?.athletes ?? [];
  useSupabaseRealtime(tournament?.id, dashboard.refetch);
  const name = (id: number | null) => athletes.find((athlete: any) => athlete.id === id)?.fullName ?? "Open slot";
  if (dashboard.isLoading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-500">Loading mat workspace…</div>;
  if (!tournament) return <div className="grid min-h-screen place-items-center p-6"><Card><CardContent className="p-8 text-center"><CardTitle>Tournament data unavailable</CardTitle><Link href="/"><Button className="mt-4 bg-[#07111f] text-white">Back to organizer</Button></Link></CardContent></Card></div>;
  return <div className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-7"><div className="mx-auto max-w-7xl space-y-6"><header className="flex flex-col gap-4 rounded-3xl bg-[#07111f] p-6 text-white md:flex-row md:items-end md:justify-between"><div><Link href="/" className="text-sm text-slate-300 hover:text-[#d7ff54]">← Organizer workspace</Link><p className="mt-5 text-xs font-bold uppercase tracking-[.25em] text-[#d7ff54]">Mat and pool control</p><h1 className="mt-2 text-4xl font-black">{tournament.name}</h1><p className="mt-2 text-slate-300">Every mat has an ordered queue. Drag a match to adapt the floor without losing the bracket record.</p></div><Link href="/matches"><Button className="bg-[#d7ff54] text-[#07111f]">Open full match screen</Button></Link></header><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{mats.map((mat: any) => { const queued = matches.filter((match: any) => match.matId === mat.id && match.status !== "finished").sort((a: any, b: any) => Number(a.schedulerOrder ?? 999) - Number(b.schedulerOrder ?? 999)); return <Card key={mat.id} onDragOver={event => event.preventDefault()} onDrop={() => { if (dragged != null) reassign.mutate({ matchId: dragged, matId: mat.id }); setDragged(null); }} className="min-h-80 border-0 shadow-sm"><CardHeader className="border-b"><div className="flex items-center justify-between"><CardTitle>{mat.name}</CardTitle><Badge className={mat.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>{mat.status}</Badge></div><p className="text-xs text-slate-500">{queued.length} queued · drop matches here</p></CardHeader><CardContent className="space-y-2 p-4">{queued.length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center text-xs text-slate-500">No queued matches</div> : queued.map((match: any) => <div key={match.id} draggable onDragStart={() => setDragged(match.id)} className="cursor-grab rounded-xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"><div className="flex items-center justify-between"><p className="text-xs font-bold">#{match.matchNumber} · {match.round}</p><Badge>{match.status}</Badge></div><p className="mt-2 text-sm font-semibold">{name(match.athleteAId)}</p><p className="text-xs text-slate-500">vs {name(match.athleteBId)}</p><p className="mt-2 text-[11px] text-slate-400">Queue {match.schedulerOrder ?? "—"} · {match.scheduledAt ? new Date(match.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBA"}</p></div>)}</CardContent></Card>; })}</div><Card><CardHeader><CardTitle>Floor sequence / ترتيب أرض البطولة</CardTitle><p className="text-sm text-slate-500">Keep pools moving methodically. Use the bracket screen to change slots; use this screen to change mat assignment.</p></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-3"><div className="rounded-xl bg-violet-50 p-4"><p className="font-bold text-violet-900">GI pools</p><p className="mt-1 text-sm text-violet-700">Separate bracket and queue</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="font-bold text-amber-900">No-Gi pools</p><p className="mt-1 text-sm text-amber-700">Separate bracket and queue</p></div><div className="rounded-xl bg-slate-100 p-4"><p className="font-bold text-slate-900">Live handoff</p><p className="mt-1 text-sm text-slate-600">Call the next match on the referee screen</p></div></div></CardContent></Card></div></div>;
}
