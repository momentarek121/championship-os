import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import jsPDF from "jspdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildTournamentAnalytics, type AnalyticsWindow } from "@shared/analytics";

type Props = { registrations: any[]; athletes: any[]; matches: any[]; mats: any[] };

function Kpi({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></CardContent></Card>;
}

function Breakdown({ title, rows, color }: { title: string; rows: Array<{ label: string; count: number }>; color: string }) {
  return <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows} layout="vertical" margin={{ left: 10, right: 12, top: 4, bottom: 4 }}><CartesianGrid horizontal={false} strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="label" width={92} tick={{ fontSize: 11 }} /><Tooltip cursor={{ fill: "#f8fafc" }} /><Bar dataKey="count" fill={color} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>{rows.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}</CardContent></Card>;
}

export default function TournamentAnalytics({ registrations, athletes, matches, mats }: Props) {
  const [window, setWindow] = useState<AnalyticsWindow>("all");
  const analytics = useMemo(() => buildTournamentAnalytics(registrations, athletes, matches, mats, window), [registrations, athletes, matches, mats, window]);
  const exportPdf = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text("Championship OS — Tournament Analytics", 14, 18);
    pdf.setFontSize(10);
    pdf.text(`Window: ${window === "all" ? "All registrations" : `Last ${window.replace("d", " days")}`}`, 14, 26);
    const lines = [
      `Registered: ${analytics.totalRegistrations}`,
      `Approved: ${analytics.approved}`,
      `Passed weigh-in: ${analytics.passedWeighIn}`,
      `Paid: ${analytics.paid}`,
      `Matches: ${analytics.matches.total} (${analytics.matches.finished} finished, ${analytics.matches.live} live)`,
      "",
      "Competition mode comparison",
      ...analytics.competitionModes.map(row => `${row.label}: ${row.count}`),
      "",
      "Weight categories",
      ...analytics.weightCategories.map(row => `${row.label}: ${row.count}`),
    ];
    pdf.text(lines, 14, 38, { lineHeightFactor: 1.5 });
    pdf.save("championship-os-analytics.pdf");
  };
  return <section className="space-y-4" aria-label="Tournament analytics"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black text-slate-900">Tournament analytics</h2><p className="text-sm text-slate-500">Live counts calculated from the current tournament records.</p></div><div className="flex flex-wrap items-center gap-2"><Badge className="bg-slate-100 text-slate-700">{analytics.mats} mats</Badge><Select value={window} onValueChange={value => setWindow(value as AnalyticsWindow)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All time</SelectItem><SelectItem value="7d">Last 7 days</SelectItem><SelectItem value="30d">Last 30 days</SelectItem><SelectItem value="90d">Last 90 days</SelectItem></SelectContent></Select><Button variant="outline" onClick={exportPdf}>Export PDF</Button></div></div><div className="grid gap-3 grid-cols-2 lg:grid-cols-4"><Kpi label="Registered" value={analytics.totalRegistrations} detail={`${analytics.approved} approved`} /><Kpi label="Passed weigh-in" value={analytics.passedWeighIn} detail={`${analytics.overweight} overweight`} /><Kpi label="Paid" value={analytics.paid} detail={`${analytics.checkedIn} progressed`} /><Kpi label="Matches" value={analytics.matches.total} detail={`${analytics.matches.live} live · ${analytics.matches.finished} finished`} /></div><div className="grid gap-4 xl:grid-cols-3"><Breakdown title="Players by weight category" rows={analytics.weightCategories} color="#07111f" /><Breakdown title="Players by belt" rows={analytics.belts} color="#d7ff54" /><Breakdown title="GI / No-Gi comparison" rows={analytics.competitionModes} color="#f59e0b" /></div></section>;
}
