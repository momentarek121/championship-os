import { jsPDF } from "jspdf";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type StandingsRow = { academy: string; wins: number; gold: number; silver: number; bronze: number; matches: number };
type CategoryResult = { label: string; gold: string; silver: string; bronze: string };

function downloadBlob(content: BlobPart, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "tournament";
}

function escapeCsv(value: string | number) { return `"${String(value).replace(/"/g, '""')}"`; }

export default function AcademyStandingsExport({ standings, tournamentName, categoryResults }: { standings: StandingsRow[]; tournamentName: string; categoryResults: CategoryResult[] }) {
  const safeName = safeFileName(tournamentName || "tournament");
  const exportCsv = () => {
    const header = ["Rank", "Academy", "Wins", "Gold", "Silver", "Bronze", "Matches"];
    const rows = standings.map((row, index) => [index + 1, row.academy, row.wins, row.gold, row.silver, row.bronze, row.matches]);
    downloadBlob([header, ...rows].map(row => row.map(value => escapeCsv(value)).join(",")).join("\n"), `${safeName}-academy-standings.csv`, "text/csv;charset=utf-8");
    toast.success("Academy standings CSV downloaded");
  };
  const exportPdf = () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.setFontSize(18); pdf.text(`${tournamentName || "Tournament"} — Academy Standings`, 14, 18);
    pdf.setFontSize(9); pdf.text(`Generated ${new Date().toLocaleString()}`, 14, 25);
    const columns = ["Rank", "Academy", "Wins", "Gold", "Silver", "Bronze", "Matches"]; const widths = [15, 90, 25, 25, 25, 25, 25]; let y = 35;
    const drawRow = (values: Array<string | number>, bold = false) => { let x = 14; pdf.setFontSize(10); pdf.setFont("helvetica", bold ? "bold" : "normal"); values.forEach((value, index) => { pdf.text(String(value), x + 2, y + 6); pdf.rect(x, y, widths[index], 10); x += widths[index]; }); y += 10; };
    drawRow(columns, true); standings.forEach((row, index) => { if (y > 185) { pdf.addPage(); y = 18; drawRow(columns, true); } drawRow([index + 1, row.academy, row.wins, row.gold, row.silver, row.bronze, row.matches]); });
    pdf.save(`${safeName}-academy-standings.pdf`); toast.success("Academy standings PDF downloaded");
  };
  const exportCategoryPdf = (result: CategoryResult) => {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.setFontSize(18); pdf.text(tournamentName || "Tournament", 14, 18); pdf.setFontSize(13); pdf.text(`Results — ${result.label}`, 14, 28);
    pdf.setFontSize(11); pdf.text(`Gold: ${result.gold || "—"}`, 18, 48); pdf.text(`Silver: ${result.silver || "—"}`, 18, 62); pdf.text(`Bronze: ${result.bronze || "—"}`, 18, 76);
    pdf.setFontSize(9); pdf.text(`Generated ${new Date().toLocaleString()}`, 14, 95); pdf.save(`${safeName}-${safeFileName(result.label)}-results.pdf`); toast.success("Category results PDF downloaded");
  };
  return <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" disabled={standings.length === 0} onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> CSV</Button><Button size="sm" variant="outline" disabled={standings.length === 0} onClick={exportPdf}><Download className="mr-2 h-4 w-4" /> PDF</Button>{categoryResults.map(result => <Button key={result.label} size="sm" variant="outline" disabled={!result.label} onClick={() => exportCategoryPdf(result)}><Download className="mr-2 h-4 w-4" /> PDF · {result.label}</Button>)}</div>;
}
