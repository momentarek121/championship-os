import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { normalizeAthleteImportRow, previewAthleteImport, type AthleteImportPreview } from "@shared/athlete-import";

export default function AthleteImportPanel({ tournamentId, competitionMode, onImported }: { tournamentId: number; competitionMode: "gi" | "nogi" | "both"; onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<AthleteImportPreview[]>([]);
  const [busy, setBusy] = useState(false);
  const mutation = trpc.tournament.bulkRegisterAthletes.useMutation({ onSuccess: result => { toast.success(`${result.imported} athletes imported and classified`); setPreview([]); onImported(); }, onError: error => toast.error(error.message) });

  const parseFile = async (file: File) => {
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (!rawRows.length) throw new Error("The file has no rows");
      const rows = rawRows.slice(0, 500).map(normalizeAthleteImportRow);
      setPreview(previewAthleteImport(rows, competitionMode));
      toast.success(`${rows.length} rows ready for review`);
    } catch (error) { setPreview([]); toast.error(error instanceof Error ? error.message : "Could not read the file"); }
    finally { setBusy(false); }
  };

  return <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="flex flex-wrap items-center justify-between gap-3"><span>Import athletes / استيراد اللاعبين</span><Badge variant="outline">Excel · XLSX · CSV</Badge></CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-slate-600">Upload columns: name, date of birth, gender, belt, weight. The preview assigns age, exact weight division, GI/No-Gi mode, and pools automatically.</p>
    <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void parseFile(file); event.currentTarget.value = ""; }} />
    <Button type="button" disabled={busy || mutation.isPending} onClick={() => inputRef.current?.click()} className="bg-[#07111f] text-white">{busy ? "Reading…" : "Choose Excel file"}</Button>
    {preview.length > 0 && <><div className="grid gap-3 sm:grid-cols-4"><div className="rounded-xl bg-slate-50 p-3"><b>{preview.length}</b><span className="ml-2 text-sm text-slate-500">rows</span></div><div className="rounded-xl bg-slate-50 p-3"><b>{new Set(preview.map(row => row.categoryName)).size}</b><span className="ml-2 text-sm text-slate-500">categories</span></div><div className="rounded-xl bg-slate-50 p-3"><b>{new Set(preview.map(row => row.pool)).size}</b><span className="ml-2 text-sm text-slate-500">pools</span></div><div className="rounded-xl bg-slate-50 p-3"><b>{preview.filter(row => row.expectedWeight <= row.weightLimit).length}</b><span className="ml-2 text-sm text-slate-500">within limit</span></div></div><div className="max-h-72 overflow-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50"><tr><th className="p-2">Name</th><th className="p-2">Age</th><th className="p-2">Weight</th><th className="p-2">Category</th><th className="p-2">Pool</th></tr></thead><tbody>{preview.map((row, index) => <tr key={`${row.fullName}-${index}`} className="border-t"><td className="p-2 font-medium">{row.fullName}</td><td className="p-2">{row.age}</td><td className="p-2">{row.expectedWeight.toFixed(2)} kg</td><td className="p-2">{row.categoryName}</td><td className="p-2">{row.pool}</td></tr>)}</tbody></table></div><Button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ tournamentId, rows: preview.map(({ age: _age, categoryName: _category, weightLimit: _limit, pool: _pool, ...row }) => row), sport: "Brazilian Jiu-Jitsu" })} className="bg-[#d7ff54] text-[#07111f]">{mutation.isPending ? "Saving…" : `Save ${preview.length} athletes automatically`}</Button></>}
  </CardContent></Card>;
}
