import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type RegistrationExportRow = {
  athleteName: string;
  belt: string;
  weight: string | number;
  category: string;
  gender: string;
  pool: string;
  status: string;
  payment: string;
  checkIn: string;
  accreditationCode: string;
};

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "tournament";
}

function downloadBlob(content: BlobPart, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function RegistrationListExport({ rows, tournamentName }: { rows: RegistrationExportRow[]; tournamentName: string }) {
  const fileBase = `${safeFileName(tournamentName || "tournament")}-registered-athletes`;
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows.map(row => ({
      "Athlete name": row.athleteName,
      Belt: row.belt,
      "Weight KG": row.weight,
      "Weight category": row.category,
      Gender: row.gender,
      Pool: row.pool,
      Status: row.status,
      Payment: row.payment,
      "Check-in": row.checkIn,
      "Accreditation code": row.accreditationCode,
    })));
    worksheet["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registered athletes");
    XLSX.writeFile(workbook, `${fileBase}.xlsx`);
    toast.success("Registered athletes Excel downloaded");
  };

  const exportPdf = () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const columns = ["#", "Athlete", "Belt", "Weight", "Category", "Gender", "Pool", "Status", "Payment", "Check-in"];
    const widths = [9, 48, 22, 18, 55, 20, 22, 23, 23, 23];
    let y = 18;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text(`${tournamentName || "Tournament"} — Registered Athletes`, 14, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(`${rows.length} athlete(s) · Generated ${new Date().toLocaleString()}`, 14, y);
    y += 7;
    const drawRow = (values: Array<string | number>, bold = false) => {
      let x = 10;
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(7.5);
      values.forEach((value, index) => {
        pdf.rect(x, y, widths[index], 8);
        pdf.text(String(value).slice(0, 28), x + 1.5, y + 5);
        x += widths[index];
      });
      y += 8;
    };
    drawRow(columns, true);
    rows.forEach((row, index) => {
      if (y > 190) { pdf.addPage(); y = 15; drawRow(columns, true); }
      drawRow([index + 1, row.athleteName, row.belt, row.weight, row.category, row.gender, row.pool, row.status, row.payment, row.checkIn]);
    });
    pdf.save(`${fileBase}.pdf`);
    toast.success("Registered athletes PDF downloaded");
  };

  return <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" disabled={rows.length === 0} onClick={exportExcel}><Download className="mr-2 h-4 w-4" /> Excel ({rows.length})</Button><Button size="sm" variant="outline" disabled={rows.length === 0} onClick={exportPdf}><Download className="mr-2 h-4 w-4" /> PDF ({rows.length})</Button></div>;
}
