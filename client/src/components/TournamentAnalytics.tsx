import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildTournamentAnalytics } from "@shared/analytics";

type Props = { registrations: any[]; athletes: any[]; matches: any[]; mats: any[] };

function Kpi({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></CardContent></Card>;
}

function Breakdown({ title, rows, color }: { title: string; rows: Array<{ label: string; count: number }>; color: string }) {
  return <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows} layout="vertical" margin={{ left: 10, right: 12, top: 4, bottom: 4 }}><CartesianGrid horizontal={false} strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="label" width={92} tick={{ fontSize: 11 }} /><Tooltip cursor={{ fill: "#f8fafc" }} /><Bar dataKey="count" fill={color} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>{rows.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}</CardContent></Card>;
}

export default function TournamentAnalytics({ registrations, athletes, matches, mats }: Props) {
  const analytics = buildTournamentAnalytics(registrations, athletes, matches, mats);
  return <section className="space-y-4" aria-label="Tournament analytics"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black text-slate-900">Tournament analytics</h2><p className="text-sm text-slate-500">Live counts calculated from the current tournament records.</p></div><Badge className="w-fit bg-slate-100 text-slate-700">{analytics.mats} mats</Badge></div><div className="grid gap-3 grid-cols-2 lg:grid-cols-4"><Kpi label="Registered" value={analytics.totalRegistrations} detail={`${analytics.approved} approved`} /><Kpi label="Passed weigh-in" value={analytics.passedWeighIn} detail={`${analytics.overweight} overweight`} /><Kpi label="Paid" value={analytics.paid} detail={`${analytics.checkedIn} progressed`} /><Kpi label="Matches" value={analytics.matches.total} detail={`${analytics.matches.live} live · ${analytics.matches.finished} finished`} /></div><div className="grid gap-4 xl:grid-cols-2"><Breakdown title="Players by weight category" rows={analytics.weightCategories} color="#07111f" /><Breakdown title="Players by belt" rows={analytics.belts} color="#d7ff54" /></div></section>;
}
