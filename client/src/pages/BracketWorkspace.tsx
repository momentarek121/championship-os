import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BracketTreeExport from "@/components/BracketTreeExport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Slot = "a" | "b";
type SlotEdit = { a: string; b: string };

export default function BracketWorkspace() {
  const dashboard = trpc.tournament.dashboard.useQuery(undefined, { enabled: true, retry: false, refetchInterval: 3000 });
  const generate = trpc.tournament.generateBrackets.useMutation({ onSuccess: result => { if (result.alreadyGenerated) toast.info("Brackets already exist for this tournament"); else { const byeCount = result.groups.reduce((total, group) => total + group.byes, 0); toast.success(`${result.created} matches generated across ${result.groups.length} categories${byeCount ? ` · ${byeCount} bye slot${byeCount === 1 ? "" : "s"}` : ""}`); } dashboard.refetch(); }, onError: error => toast.error(error.message) });
  const updateSlots = trpc.tournament.updateMatchSlots.useMutation({ onSuccess: () => { toast.success("Bracket slot saved"); dashboard.refetch(); }, onError: error => toast.error(error.message) });
  const [mode, setMode] = useState("all");
  const [round, setRound] = useState("all");
  const [slotEdits, setSlotEdits] = useState<Record<number, SlotEdit>>({});
  const [dragged, setDragged] = useState<{ matchId: number; slot: Slot } | null>(null);
  const data = dashboard.data;
  const tournament = data?.tournaments?.[0];
  const matches = data?.matches ?? [];
  const athletes = data?.athletes ?? [];
  const registrations = data?.registrations ?? [];
  const athleteName = (id: number | null) => athletes.find((athlete: any) => athlete.id === id)?.fullName ?? "Open slot";
  const matchMode = (match: any) => registrations.find((registration: any) => registration.categoryId === match.categoryId)?.categoryCompetitionMode ?? "gi";
  const filtered = useMemo(() => matches.filter((match: any) => (mode === "all" || matchMode(match) === mode) && (round === "all" || match.round === round)), [matches, mode, round, registrations]);
  const rounds = Array.from(new Set(matches.map((match: any) => match.round).filter(Boolean)));
  const groups = ["gi", "nogi"].map(value => ({ value, rows: filtered.filter((match: any) => matchMode(match) === value) }));
  const getEdit = (match: any): SlotEdit => slotEdits[match.id] ?? { a: match.athleteAId == null ? "empty" : String(match.athleteAId), b: match.athleteBId == null ? "empty" : String(match.athleteBId) };
  const setSlot = (matchId: number, slot: Slot, value: string) => setSlotEdits(current => ({ ...current, [matchId]: { ...getEdit(matches.find((match: any) => match.id === matchId)), [slot]: value } }));
  const swapSlots = (first: { matchId: number; slot: Slot }, second: { matchId: number; slot: Slot }) => {
    const firstMatch = matches.find((match: any) => match.id === first.matchId);
    const secondMatch = matches.find((match: any) => match.id === second.matchId);
    if (!firstMatch || !secondMatch) return;
    const firstEdit = getEdit(firstMatch);
    const secondEdit = getEdit(secondMatch);
    const firstValue = firstEdit[first.slot];
    const secondValue = secondEdit[second.slot];
    setSlotEdits(current => ({ ...current, [first.matchId]: { ...getEdit(firstMatch), [first.slot]: secondValue }, [second.matchId]: { ...getEdit(secondMatch), [second.slot]: firstValue } }));
  };
  const saveSlots = (match: any) => { const edit = getEdit(match); updateSlots.mutate({ matchId: match.id, athleteAId: edit.a === "empty" ? null : Number(edit.a), athleteBId: edit.b === "empty" ? null : Number(edit.b) }); setSlotEdits(current => { const next = { ...current }; delete next[match.id]; return next; }); };
  const resetSlots = (matchId: number) => setSlotEdits(current => { const next = { ...current }; delete next[matchId]; return next; });
  const onDrop = (matchId: number, slot: Slot) => { if (!dragged) return; swapSlots(dragged, { matchId, slot }); setDragged(null); };
  if (dashboard.isLoading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-500">Loading bracket workspace…</div>;
  if (!tournament) return <div className="grid min-h-screen place-items-center p-6"><Card><CardContent className="p-8 text-center"><CardTitle>Tournament data unavailable</CardTitle><p className="mt-2 text-sm text-slate-500">Open the main operations hub or load tournament data first.</p><Link href="/"><Button className="mt-4 bg-[#07111f] text-white">Back to organizer</Button></Link></CardContent></Card></div>;
  return <div className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-7"><div className="mx-auto max-w-7xl space-y-6"><header className="flex flex-col gap-4 rounded-3xl bg-[#07111f] p-6 text-white md:flex-row md:items-end md:justify-between"><div><Link href="/" className="text-sm text-slate-300 hover:text-[#d7ff54]">← Organizer workspace</Link><p className="mt-5 text-xs font-bold uppercase tracking-[.25em] text-[#d7ff54]">Bracket control</p><h1 className="mt-2 text-4xl font-black">{tournament.name}</h1><p className="mt-2 text-slate-300">Drag a player card onto another slot to swap positions. Save each changed match before final approval.</p></div><Button onClick={() => generate.mutate({ tournamentId: Number(tournament.id) })} disabled={generate.isPending} className="bg-[#d7ff54] text-[#07111f]">{generate.isPending ? "Generating…" : "Generate automatic brackets"}</Button></header><Card><CardContent className="flex flex-wrap gap-3 p-4"><Select value={mode} onValueChange={setMode}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All modes</SelectItem><SelectItem value="gi">GI only</SelectItem><SelectItem value="nogi">No-Gi only</SelectItem></SelectContent></Select><Select value={round} onValueChange={setRound}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All rounds</SelectItem>{rounds.map(value => <SelectItem key={String(value)} value={String(value)}>{String(value)}</SelectItem>)}</SelectContent></Select><Badge className="bg-slate-100 px-3 py-2 text-slate-700">{filtered.length} matches</Badge><Badge className="bg-[#d7ff54] px-3 py-2 text-[#07111f]">Drag & drop enabled</Badge><BracketTreeExport tournamentName={tournament.name} mode={mode} matches={filtered} athleteName={athleteName} /></CardContent></Card><div className="grid gap-6 xl:grid-cols-2">{groups.map(group => <Card key={group.value} className="border-0 shadow-sm"><CardHeader><div className="flex items-center justify-between"><CardTitle>{group.value === "gi" ? "GI brackets" : "No-Gi brackets"}</CardTitle><Badge className={group.value === "gi" ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700"}>{group.rows.length}</Badge></div></CardHeader><CardContent className="space-y-3">{group.rows.length === 0 ? <p className="text-sm text-slate-500">No matches in this mode yet.</p> : group.rows.map((match: any) => { const edit = getEdit(match); const dirty = Boolean(slotEdits[match.id]); return <div key={match.id} className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${dirty ? "border-[#84a900] bg-[#fbffe8]" : "border-slate-200"}`}><div className="flex items-center justify-between"><p className="font-bold">{match.round} · Match {match.matchNumber}</p><Badge>{match.status}</Badge></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{(["a", "b"] as Slot[]).map(slot => <div key={slot} onDragOver={event => event.preventDefault()} onDrop={() => onDrop(match.id, slot)} className="rounded-xl border border-dashed border-slate-300 p-2"><div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400"><span>{slot === "a" ? "Red / A" : "Blue / B"}</span><span>Drop here</span></div><div draggable={edit[slot] !== "empty"} onDragStart={() => setDragged({ matchId: match.id, slot })} className="cursor-grab rounded-lg bg-white p-2 text-sm font-semibold shadow-sm active:cursor-grabbing">{athleteName(edit[slot] === "empty" ? null : Number(edit[slot]))}</div><Select value={edit[slot]} onValueChange={value => setSlot(match.id, slot, value)}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="empty">Open slot</SelectItem>{athletes.map((athlete: any) => <SelectItem key={athlete.id} value={String(athlete.id)}>{athlete.fullName}</SelectItem>)}</SelectContent></Select></div>)}</div><p className="mt-2 text-xs text-slate-500">{athleteName(edit.a === "empty" ? null : Number(edit.a))} vs {athleteName(edit.b === "empty" ? null : Number(edit.b))} · Mat {match.matId ?? "TBA"}</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => saveSlots(match)} disabled={!dirty || updateSlots.isPending} size="sm" className="bg-[#07111f]">{updateSlots.isPending ? "Saving…" : "Save slot swap"}</Button><Button onClick={() => resetSlots(match.id)} disabled={!dirty} variant="outline" size="sm">Revert</Button></div></div>; })}</CardContent></Card>)}</div></div></div>;
}
