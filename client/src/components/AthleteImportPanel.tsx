import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type ImportRow = { fullName: string; email: string; phone: string; dateOfBirth: string; gender: "male" | "female"; belt: string; expectedWeight: number; error?: string };
type Props = { onImport: (rows: ImportRow[]) => Promise<void>; disabled?: boolean };

const aliases: Record<string, keyof ImportRow> = {
  name: "fullName", fullname: "fullName", "full name": "fullName", الاسم: "fullName", "الاسم بالكامل": "fullName",
  email: "email", البريد: "email", "البريد الإلكتروني": "email", phone: "phone", mobile: "phone", الهاتف: "phone",
  dob: "dateOfBirth", dateofbirth: "dateOfBirth", birthdate: "dateOfBirth", الميلاد: "dateOfBirth", "تاريخ الميلاد": "dateOfBirth",
  gender: "gender", النوع: "gender", sex: "gender", belt: "belt", الحزام: "belt", weight: "expectedWeight", expectedweight: "expectedWeight", الوزن: "expectedWeight", "الوزن المتوقع": "expectedWeight",
};

function key(value: unknown) { return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " "); }
function normalizeDate(value: unknown) { if (value instanceof Date) return value.toISOString().slice(0, 10); const raw = String(value ?? "").trim(); if (!raw) return ""; const date = new Date(raw); return Number.isNaN(date.getTime()) ? raw : date.toISOString().slice(0, 10); }
function normalizeGender(value: unknown): "male" | "female" { return /female|أنث|انث|girl|f/i.test(String(value ?? "")) ? "female" : "male"; }
function normalizeRow(raw: Record<string, unknown>): ImportRow {
  const mapped: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(raw)) { const field = aliases[key(name)] ?? name as keyof ImportRow; mapped[field] = value; }
  return { fullName: String(mapped.fullName ?? "").trim(), email: String(mapped.email ?? "").trim(), phone: String(mapped.phone ?? "").trim(), dateOfBirth: normalizeDate(mapped.dateOfBirth), gender: normalizeGender(mapped.gender), belt: String(mapped.belt ?? "White").trim() || "White", expectedWeight: Number(mapped.expectedWeight) };
}
function validate(rows: ImportRow[]) {
  const seen = new Set<string>();
  return rows.map(row => { const identity = `${key(row.fullName)}|${row.dateOfBirth}|${row.expectedWeight}`; const errors = [row.fullName.length < 2 ? "Name / الاسم مطلوب" : "", !row.dateOfBirth ? "Date of birth / تاريخ الميلاد مطلوب" : "", !Number.isFinite(row.expectedWeight) || row.expectedWeight <= 0 ? "Weight / الوزن غير صحيح" : "", seen.has(identity) ? "Duplicate / مكرر" : ""].filter(Boolean); seen.add(identity); return { ...row, error: errors.join(" · ") || undefined }; });
}
async function parseFile(file: File): Promise<ImportRow[]> {
  const buffer = await file.arrayBuffer();
  if (file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const rows: ImportRow[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) { const page = await pdf.getPage(pageNumber); const content = await page.getTextContent(); const text = content.items.map(item => "str" in item ? item.str : "").join(" "); for (const line of text.split(/\n|\s{2,}|\|/).map(item => item.trim()).filter(Boolean)) { const parts = line.split(/[,;\t]/).map(item => item.trim()); if (parts.length >= 4) rows.push(normalizeRow({ fullName: parts[0], dateOfBirth: parts[1], expectedWeight: parts[2], belt: parts[3], gender: parts[4] ?? "male", email: parts[5] ?? "", phone: parts[6] ?? "" })); } }
    return rows;
  }
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return (XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }) as Record<string, unknown>[]).map(normalizeRow);
}

export default function AthleteImportPanel({ onImport, disabled }: Props) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const validRows = useMemo(() => rows.filter(row => !row.error), [rows]);
  const handleFile = async (file?: File) => { if (!file) return; setBusy(true); setFileName(file.name); try { const parsed = validate(await parseFile(file)); setRows(parsed); if (!parsed.length) toast.error("No rows found / لم يتم العثور على صفوف"); else toast.success(`${parsed.length} rows loaded / تم تحميل الصفوف`); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not read file"); } finally { setBusy(false); } };
  const save = async () => { if (!validRows.length) return toast.error("Fix invalid rows first / أصلح الصفوف أولاً"); setBusy(true); try { await onImport(validRows); setRows([]); setFileName(""); } finally { setBusy(false); } };
  return <Card className="border-0 shadow-sm"><CardHeader><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Import athletes / استيراد اللاعبين</CardTitle><p className="mt-1 text-sm text-slate-500">Excel or PDF · Name, age/date, weight, belt, gender, contacts.</p></div><Badge className="w-fit bg-[#d7ff54] text-[#07111f]">{validRows.length}/{rows.length} valid</Badge></div></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">Upload roster / ارفع كشف اللاعبين</p><p className="text-xs text-slate-500">Recommended columns: name, dateOfBirth, weight, belt, gender.</p></div><Input type="file" accept=".xlsx,.xls,.csv,.pdf" disabled={busy || disabled} onChange={event => handleFile(event.target.files?.[0])} className="max-w-xs bg-white" /></div>{fileName && <p className="text-xs text-slate-500">{fileName} · {rows.length} rows parsed</p>}{rows.length > 0 && <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Date</th><th className="p-3">Weight</th><th className="p-3">Belt</th><th className="p-3">Gender</th><th className="p-3">Validation</th></tr></thead><tbody>{rows.slice(0, 100).map((row, index) => <tr key={`${row.fullName}-${index}`} className="border-t"><td className="p-3 font-semibold">{row.fullName || "—"}</td><td className="p-3">{row.dateOfBirth || "—"}</td><td className="p-3">{row.expectedWeight || "—"}</td><td className="p-3">{row.belt}</td><td className="p-3">{row.gender}</td><td className={`p-3 text-xs ${row.error ? "font-bold text-red-600" : "text-emerald-600"}`}>{row.error || "Ready / جاهز"}</td></tr>)}</tbody></table></div>}<Button onClick={save} disabled={busy || disabled || !validRows.length} className="bg-[#07111f]">{busy ? "Processing… / جارٍ التنفيذ" : `Import ${validRows.length} athletes / استيراد ${validRows.length} لاعب`}</Button></CardContent></Card>;
}
