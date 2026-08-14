import { jsPDF } from "jspdf";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type StandingsRow = { academy: string; wins: number; gold: number; silver: number; bronze: number; matches: number };

function downloadBlob(content: BlobPart, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export default function AcademyStandingsExport({ standings, tournamentName }: { standings: StandingsRow[]; tournamentName: string }) {
  const safeName = (tournamentName || "tournament").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "tournament";
  const exportCsv = () => {
    const header = ["Rank", "Academy", "Wins", "Gold", "Silver", "Bronze", "Matches"];
    const rows = standings.map((row, index) => [index + 1, row.academy, row.wins, row.gold, row.silver, row.bronze, row.matches]);
    downloadBlob([header, ...rows].map(row => row.map(value => escapeCsv(value)).join(",")).join("\n"), `${safeName}-academy-standings.csv`, "text/csv;charset=utf-8");
    toast.success("Academy standings CSV downloaded");
  };
  const exportPdf = () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.setFontSize(18);
    pdf.text(`${tournamentName || "Tournament"} — Academy Standings`, 14, 18);
    pdf.setFontSize(9);
    pdf.text(`Generated ${new Date().toLocaleString()}`, 14, 25);
    const columns = ["Rank", "Academy", "Wins", "Gold", "Silver", "Bronze", "Matches"];
    const widths = [15, 90, 25, 25, 25, 25, 25];
    let y = 35;
    const drawRow = (values: Array<string | number>, bold = false) => {
      let x = 14;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      values.forEach((value, index) => { pdf.text(String(value), x + 2, y + 6); pdf.rect(x, y, widths[index], 10); x += widths[index]; });
      y += 10;
    };
    drawRow(columns, true);
    standings.forEach((row, index) => { if (y > 185) { pdf.addPage(); y = 18; drawRow(columns, true); } drawRow([index + 1, row.academy, row.wins, row.gold, row.silver, row.bronze, row.matches]); });
    pdf.save(`${safeName}-academy-standings.pdf`);
    toast.success("Academy standings PDF downloaded");
  };
  return <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={standings.length === 0} onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> CSV</Button><Button size="sm" variant="outline" disabled={standings.length === 0} onClick={exportPdf}><Download className="mr-2 h-4 w-4" /> PDF</Button></div>;
}
