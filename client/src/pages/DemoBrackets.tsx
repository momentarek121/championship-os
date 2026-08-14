import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DemoMatch = { number: number; a: string; b: string; winner?: string; status: "finished" | "live" | "queued" };
type DemoDivision = { key: string; label: string; subtitle: string; pool: string; matches: DemoMatch[] };

const divisions: DemoDivision[] = [
  { key: "children", label: "Children · Boys · 30 KG", subtitle: "Kids / White belt", pool: "Pool A", matches: [
    { number: 1, a: "Demo Athlete 01", b: "Demo Athlete 02", winner: "Demo Athlete 01", status: "finished" },
    { number: 2, a: "Demo Athlete 03", b: "Demo Athlete 04", winner: "Demo Athlete 04", status: "finished" },
    { number: 3, a: "Demo Athlete 01", b: "Demo Athlete 04", status: "queued" },
  ] },
  { key: "girls", label: "Girls · Youth · 44 KG", subtitle: "Youth / White & Blue", pool: "Pool A", matches: [
    { number: 1, a: "Demo Athlete 05", b: "Demo Athlete 06", winner: "Demo Athlete 06", status: "finished" },
    { number: 2, a: "Demo Athlete 07", b: "Demo Athlete 08", status: "live" },
    { number: 3, a: "Demo Athlete 06", b: "Demo Athlete 07", status: "queued" },
  ] },
  { key: "boys", label: "Boys · Junior · 60 KG", subtitle: "Junior / Blue belt", pool: "Pool B", matches: [
    { number: 1, a: "Demo Athlete 09", b: "Demo Athlete 10", winner: "Demo Athlete 09", status: "finished" },
    { number: 2, a: "Demo Athlete 11", b: "Demo Athlete 12", winner: "Demo Athlete 12", status: "finished" },
    { number: 3, a: "Demo Athlete 09", b: "Demo Athlete 12", status: "queued" },
  ] },
  { key: "adult", label: "Adult · Men · 76 KG", subtitle: "Adult / Blue belt", pool: "Pool C", matches: [
    { number: 1, a: "Demo Athlete 13", b: "Demo Athlete 14", winner: "Demo Athlete 14", status: "finished" },
    { number: 2, a: "Demo Athlete 15", b: "Demo Athlete 16", winner: "Demo Athlete 15", status: "finished" },
    { number: 3, a: "Demo Athlete 14", b: "Demo Athlete 15", status: "queued" },
  ] },
];

function AthleteLine({ name, winner }: { name: string; winner?: boolean }) {
  return <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${winner ? "bg-[#d7ff54] font-black text-[#07111f]" : "bg-slate-50 text-slate-700"}`}><span>{name}</span>{winner && <Trophy className="h-4 w-4" />}</div>;
}

export default function DemoBrackets() {
  const [selectedKey, setSelectedKey] = useState(divisions[0].key);
  const selected = useMemo(() => divisions.find(division => division.key === selectedKey) ?? divisions[0], [selectedKey]);
  return <div className="min-h-screen bg-[#07111f] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#d7ff54]"><ArrowLeft className="h-4 w-4" /> Back to Championship OS</Link><p className="mt-6 text-xs font-bold uppercase tracking-[.3em] text-[#d7ff54]">Demo fixture · no production data</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Bracket control room</h1><p className="mt-3 max-w-2xl text-slate-300">Inspect how pools, rounds, winners, live matches, and next-match progression look before using real registrations.</p></div><Badge className="w-fit bg-white/10 px-4 py-2 text-slate-200">Synthetic athletes only</Badge></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{divisions.map(division => <button key={division.key} onClick={() => setSelectedKey(division.key)} className={`rounded-2xl border p-4 text-left transition ${selected.key === division.key ? "border-[#d7ff54] bg-[#d7ff54] text-[#07111f]" : "border-white/10 bg-white/[.05] text-white hover:border-white/30"}`}><p className="text-xs font-bold uppercase tracking-wider opacity-70">{division.pool}</p><p className="mt-2 font-black">{division.label}</p><p className="mt-1 text-xs opacity-70">{division.subtitle}</p></button>)}</div><div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><Card className="border-0 bg-white text-slate-900"><CardHeader><CardTitle>{selected.label}</CardTitle><p className="text-sm text-slate-500">{selected.subtitle} · {selected.pool} · Demo only</p></CardHeader><CardContent className="space-y-3"><div className="rounded-2xl bg-slate-100 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Flow</p><div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold"><span className="rounded-lg bg-white p-3">Pool</span><span className="rounded-lg bg-white p-3">Round 1</span><span className="rounded-lg bg-[#07111f] p-3 text-white">Final</span></div></div><div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Eligibility: approved + passed weigh-in. This fixture is visual-only and cannot modify real tournament records.</div></CardContent></Card><Card className="border-0 bg-white text-slate-900"><CardHeader><CardTitle>Match board</CardTitle><p className="text-sm text-slate-500">Finished winners feed the next queued match.</p></CardHeader><CardContent className="grid gap-4 md:grid-cols-3">{selected.matches.map(match => <div key={match.number} className="rounded-2xl border border-slate-200 p-3"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Match {match.number}</span><Badge className={match.status === "finished" ? "bg-emerald-100 text-emerald-800" : match.status === "live" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}>{match.status}</Badge></div><div className="space-y-2"><AthleteLine name={match.a} winner={match.winner === match.a} /><AthleteLine name={match.b} winner={match.winner === match.b} /></div><p className="mt-3 text-xs text-slate-500">{match.status === "finished" ? `Winner: ${match.winner}` : match.status === "live" ? "On mat · scoring live" : "Waiting for previous winners"}</p></div>)}</CardContent></Card></div><div className="mt-8 flex flex-wrap gap-3"><Button asChild className="bg-[#d7ff54] text-[#07111f]"><Link href="/">Open organizer workspace</Link></Button><Button asChild variant="outline" className="border-white/20 bg-transparent text-white"><Link href="/event/demo/participants">View participant directory</Link></Button></div></div></div>;
}
