import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { canRole, roleCapabilities, type RoleCapability } from "@shared/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const roleTitles: Record<string, string> = {
  registration_staff: "Registration Staff",
  weighin_staff: "Weigh-in Staff",
  mat_manager: "Mat Manager",
  referee: "Referee Desk",
  organizer: "Organizer Workspace",
  admin: "Admin Workspace",
};

export default function StaffDashboard() {
  const { user, loading } = useAuth();
  const dashboard = trpc.tournament.dashboard.useQuery(undefined, { enabled: true, retry: false, refetchInterval: 3000 });
  const data = dashboard.data;
  const tournament = data?.tournaments?.[0];
  const role = user?.role ?? "admin";
  const can = (capability: RoleCapability) => canRole(role, capability);
  const registrations = data?.registrations ?? [];
  const athletes = data?.athletes ?? [];
  const matches = data?.matches ?? [];
  const mats = data?.mats ?? [];
  const [draggedMatchId, setDraggedMatchId] = useState<number | null>(null);
  const [draggedAthleteId, setDraggedAthleteId] = useState<number | null>(null);
  const [weights, setWeights] = useState<Record<number, string>>({});
  useSupabaseRealtime(tournament?.id, dashboard.refetch);

  const updateRegistration = trpc.tournament.updateRegistration.useMutation({ onSuccess: () => { toast.success("Registration updated"); dashboard.refetch(); }, onError: error => toast.error(error.message) });
  const reassignMatchMat = trpc.tournament.reassignMatchMat.useMutation({ onSuccess: () => { toast.success("Match moved"); dashboard.refetch(); }, onError: error => toast.error(error.message) });
  const updateMatchSlots = trpc.tournament.updateMatchSlots.useMutation({ onSuccess: () => { toast.success("Bracket slot updated"); dashboard.refetch(); }, onError: error => toast.error(error.message) });

  const activeRegistrations = useMemo(() => registrations.filter((row: any) => row.status !== "withdrawn"), [registrations]);
  const athleteName = (id: number | null) => athletes.find((athlete: any) => athlete.id === id)?.fullName ?? "Open slot";

  if (dashboard.isLoading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-500">Loading staff workspace…</div>;
  if (roleCapabilities(role).length === 0) return <div className="grid min-h-screen place-items-center p-6"><Card><CardContent className="p-8 text-center"><CardTitle>Access unavailable</CardTitle><p className="mt-2 text-sm text-slate-500">Your account does not have an operations role.</p></CardContent></Card></div>;

  return <div className="min-h-screen bg-slate-50 p-3 text-slate-900 sm:p-6"><div className="mx-auto max-w-7xl space-y-5"><header className="flex flex-col gap-3 rounded-2xl bg-[#07111f] p-5 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#d7ff54]">Championship OS · Staff</p><h1 className="mt-1 text-2xl font-black">{roleTitles[role] ?? "Operations Desk"}</h1><p className="mt-1 text-sm text-slate-300">{tournament?.name ?? "No tournament selected"}</p></div><div className="flex flex-wrap gap-2"><Link href="/"><Button variant="outline" className="border-white/20 bg-transparent text-white">Organizer workspace</Button></Link>{can("scoring") && <Link href="/referee"><Button className="bg-[#d7ff54] text-[#07111f]">Open referee desk</Button></Link>}</div></header>

    {can("registration") && <Card><CardHeader><CardTitle>Registration operations</CardTitle><p className="text-sm text-slate-500">Approve, check in, and confirm payment without opening the full organizer workspace.</p></CardHeader><CardContent className="space-y-3">{activeRegistrations.length === 0 ? <p className="text-sm text-slate-500">No registrations yet.</p> : activeRegistrations.map((row: any) => <div key={row.id} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{athleteName(row.athleteId)}</p><p className="text-xs text-slate-500">{row.categoryName ?? "Unassigned"} · {row.status} · {row.paymentStatus}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => updateRegistration.mutate({ id: row.id, status: row.status === "approved" ? "pending" : "approved" })}>{row.status === "approved" ? "Move to pending" : "Approve"}</Button><Button size="sm" variant="outline" onClick={() => updateRegistration.mutate({ id: row.id, checkInStatus: row.checkInStatus === "checked_in" ? "not_checked_in" : "checked_in" })}>{row.checkInStatus === "checked_in" ? "Undo check-in" : "Check in"}</Button><Button size="sm" onClick={() => updateRegistration.mutate({ id: row.id, paymentStatus: row.paymentStatus === "paid" ? "unpaid" : "paid" })}>{row.paymentStatus === "paid" ? "Mark unpaid" : "Mark paid"}</Button></div></div>)}</CardContent></Card>}

    {can("weigh_in") && <Card><CardHeader><CardTitle>Weigh-in operations</CardTitle><p className="text-sm text-slate-500">Record the exact measured weight and keep bracket readiness accurate.</p></CardHeader><CardContent className="space-y-3">{activeRegistrations.filter((row: any) => row.status === "approved").map((row: any) => <div key={row.id} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{athleteName(row.athleteId)}</p><p className="text-xs text-slate-500">Limit {row.categoryWeightLimit ?? "—"} KG · {row.weighInStatus}</p></div><div className="flex flex-wrap gap-2"><Input className="w-32" type="number" step="0.01" min="0" placeholder="Exact KG" value={weights[row.id] ?? row.actualWeight ?? ""} onChange={event => setWeights(current => ({ ...current, [row.id]: event.target.value }))} /><Button size="sm" onClick={() => { const actualWeight = Number(weights[row.id]); if (!Number.isFinite(actualWeight)) return toast.error("Enter an exact weight"); updateRegistration.mutate({ id: row.id, actualWeight, weighInStatus: actualWeight <= Number(row.categoryWeightLimit ?? 0) + Number(tournament?.weighInTolerance ?? 0) ? "passed" : "overweight", weighInNotes: `Measured ${actualWeight.toFixed(2)} KG` }); }}>Save weigh-in</Button></div></div>)}</CardContent></Card>}

    {can("brackets") && <Card><CardHeader><CardTitle>Mat manager drag-and-drop</CardTitle><p className="text-sm text-slate-500">Drag a queued match onto another mat to persist its assignment.</p></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2">{mats.map((mat: any) => <div key={mat.id} onDragOver={event => event.preventDefault()} onDrop={() => draggedMatchId != null && reassignMatchMat.mutate({ matchId: draggedMatchId, matId: mat.id })} className="min-h-40 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4"><div className="flex items-center justify-between"><p className="font-bold">{mat.name}</p><Badge>{matches.filter((match: any) => match.matId === mat.id && match.status !== "finished").length} queued</Badge></div><div className="mt-3 space-y-2">{matches.filter((match: any) => match.matId === mat.id && match.status !== "finished").map((match: any) => <div key={match.id} draggable onDragStart={() => setDraggedMatchId(match.id)} className="cursor-grab rounded-xl bg-white p-3 shadow-sm active:cursor-grabbing"><p className="text-sm font-bold">{match.round} · Match {match.matchNumber}</p><p className="mt-1 text-xs text-slate-500">{athleteName(match.athleteAId)} vs {athleteName(match.athleteBId)}</p></div>)}</div></div>)}</CardContent></Card>}

    {can("brackets") && <Card><CardHeader><CardTitle>Bracket slot editor</CardTitle><p className="text-sm text-slate-500">Drag an athlete onto Slot A or Slot B. The server validates category and bracket policy before saving.</p></CardHeader><CardContent className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><div className="space-y-2 rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Athletes</p>{athletes.map((athlete: any) => <div key={athlete.id} draggable onDragStart={() => setDraggedAthleteId(athlete.id)} className="cursor-grab rounded-xl border bg-white p-3 text-sm font-bold shadow-sm active:cursor-grabbing">{athlete.fullName}<p className="mt-1 text-xs font-normal text-slate-500">{athlete.belt ?? "No belt"} · {athlete.expectedWeight ?? "—"} KG</p></div>)}</div><div className="space-y-3">{matches.filter((match: any) => match.status !== "finished").map((match: any) => <div key={match.id} className="rounded-2xl border p-3"><p className="text-sm font-bold">{match.round} · Match {match.matchNumber}</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><button type="button" onDragOver={event => event.preventDefault()} onDrop={() => { if (draggedAthleteId == null) return; updateMatchSlots.mutate({ matchId: match.id, athleteAId: draggedAthleteId, athleteBId: match.athleteBId ?? null }); setDraggedAthleteId(null); }} className="min-h-14 rounded-xl border-2 border-dashed p-3 text-left text-sm hover:border-[#07111f]">Slot A: {athleteName(match.athleteAId)}</button><button type="button" onDragOver={event => event.preventDefault()} onDrop={() => { if (draggedAthleteId == null) return; updateMatchSlots.mutate({ matchId: match.id, athleteAId: match.athleteAId ?? null, athleteBId: draggedAthleteId }); setDraggedAthleteId(null); }} className="min-h-14 rounded-xl border-2 border-dashed p-3 text-left text-sm hover:border-[#07111f]">Slot B: {athleteName(match.athleteBId)}</button></div></div>)}</div></CardContent></Card>}

    {can("scoring") && <Card><CardHeader><CardTitle>Referee handoff</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-500">The referee receives a focused queue, timer, scoring controls, and automatic winner advancement.</p><Link href="/referee"><Button className="mt-3 bg-[#07111f] text-white">Open referee desk</Button></Link></CardContent></Card>}
  </div></div>;
}
