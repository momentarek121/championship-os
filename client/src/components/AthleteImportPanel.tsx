import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { normalizeAthleteImportRow, previewAthleteImport, type AthleteImportPreview, type AthleteImportRow } from "@shared/athlete-import";

type PdfTextItem = { str?: string; transform?: number[] };

function pdfLines(items: PdfTextItem[]) {
  const groups = new Map<number, string[]>();
  for (const item of items) {
    const text = String(item.str ?? "").trim();
    const y = Math.round(Number(item.transform?.[5] ?? 0));
    if (!text) continue;
    const key = Array.from(groups.keys()).find(existing => Math.abs(existing - y) <= 2) ?? y;
    groups.set(key, [...(groups.get(key) ?? []), text]);
  }
  return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]).map(([, values]) => values.join(" ").trim()).filter(Boolean);
}

function pdfRows(lines: string[]): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const line of lines) {
    const cells = line.split(/\t|\s{2,}|\s*\|\s*|\s*,\s*/).map(cell => cell.trim()).filter(Boolean);
    if (cells.length < 3 || /name|full name|الاسم|اسم اللاعب/i.test(line) && /weight|الوزن|الميزان/i.test(line)) continue;
    const date = cells.find(cell => /\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(cell));
    const weight = cells.find(cell => /^\d{2,3}(?:[.,]\d{1,2})?\s*(?:kg|كجم)?$/i.test(cell));
    const gender = cells.find(cell => /male|female|ذكر|انثى|أنثى|بنت|ولد/i.test(cell));
    const belt = cells.find(cell => /white|blue|purple|brown|black|أبيض|أزرق|بنفسجي|بني|أسود/i.test(cell));
    if (!date || !weight) continue;
    const used = new Set([date, weight, gender, belt].filter(Boolean));
    const name = cells.find(cell => !used.has(cell) && !/^\d+$/.test(cell));
    if (!name) continue;
    rows.push({ fullName: name, dateOfBirth: date, expectedWeight: weight.replace(",", ".").replace(/\s*kg|\s*كجم/i, ""), gender: gender ?? "male", belt: belt ?? "White", email: "", phone: "" });
  }
  return rows;
}

async function readPdf(file: File): Promise<AthleteImportRow[]> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const lines: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    lines.push(...pdfLines(content.items as PdfTextItem[]));
  }
  const rows = pdfRows(lines).slice(0, 500).map(normalizeAthleteImportRow);
  if (!rows.length) throw new Error("No readable athlete rows found. Use columns: name, date of birth, gender, belt, weight.");
  return rows;
}

export default function AthleteImportPanel({ tournamentId, competitionMode, onImported }: { tournamentId: number; competitionMode: "gi" | "nogi" | "both"; onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<AthleteImportPreview[]>([]);
  const [busy, setBusy] = useState(false);
  const mutation = trpc.tournament.bulkRegisterAthletes.useMutation({ onSuccess: result => { toast.success(`${result.imported} athletes imported and classified`); setPreview([]); onImported(); }, onError: error => toast.error(error.message) });

  const parseFile = async (file: File) => {
    setBusy(true);
    try {
      let rows: AthleteImportRow[];
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        rows = await readPdf(file);
      } else {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        if (!rawRows.length) throw new Error("The file has no rows");
        rows = rawRows.slice(0, 500).map(normalizeAthleteImportRow);
      }
      setPreview(previewAthleteImport(rows, competitionMode));
      toast.success(`${rows.length} rows ready for review`);
    } catch (error) { setPreview([]); toast.error(error instanceof Error ? error.message : "Could not read the file"); }
    finally { setBusy(false); }
  };

  return <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="flex flex-wrap items-center justify-between gap-3"><span>Import athletes / استيراد اللاعبين</span><Badge variant="outline">Excel · XLSX · CSV · PDF</Badge></CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-slate-600">Upload a spreadsheet or text-based PDF with columns: name, date of birth, gender, belt, weight. The preview assigns age, exact weight division, GI/No-Gi mode, and pools automatically.</p>
    <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.pdf,application/pdf" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void parseFile(file); event.currentTarget.value = ""; }} />
    <Button type="button" disabled={busy || mutation.isPending} onClick={() => inputRef.current?.click()} className="bg-[#07111f] text-white">{busy ? "Reading…" : "Choose Excel or PDF file"}</Button>
    {preview.length > 0 && <><div className="grid gap-3 sm:grid-cols-4"><div className="rounded-xl bg-slate-50 p-3"><b>{preview.length}</b><span className="ml-2 text-sm text-slate-500">rows</span></div><div className="rounded-xl bg-slate-50 p-3"><b>{new Set(preview.map(row => row.categoryName)).size}</b><span className="ml-2 text-sm text-slate-500">categories</span></div><div className="rounded-xl bg-slate-50 p-3"><b>{new Set(preview.map(row => row.pool)).size}</b><span className="ml-2 text-sm text-slate-500">pools</span></div><div className="rounded-xl bg-slate-50 p-3"><b>{preview.filter(row => row.expectedWeight <= row.weightLimit).length}</b><span className="ml-2 text-sm text-slate-500">within limit</span></div></div><div className="max-h-72 overflow-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50"><tr><th className="p-2">Name</th><th className="p-2">Age</th><th className="p-2">Weight</th><th className="p-2">Category</th><th className="p-2">Pool</th></tr></thead><tbody>{preview.map((row, index) => <tr key={`${row.fullName}-${index}`} className="border-t"><td className="p-2 font-medium">{row.fullName}</td><td className="p-2">{row.age}</td><td className="p-2">{row.expectedWeight.toFixed(2)} kg</td><td className="p-2">{row.categoryName}</td><td className="p-2">{row.pool}</td></tr>)}</tbody></table></div><Button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ tournamentId, rows: preview.map(({ age: _age, categoryName: _category, weightLimit: _limit, pool: _pool, ...row }) => row), sport: "Brazilian Jiu-Jitsu" })} className="bg-[#d7ff54] text-[#07111f]">{mutation.isPending ? "Saving…" : `Save ${preview.length} athletes automatically`}</Button></>}
  </CardContent></Card>;
}
