import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type BracketMatch = { id: number; round: string; matchNumber: number; athleteAId: number | null; athleteBId: number | null; status: string };

type Props = { tournamentName: string; mode: string; matches: BracketMatch[]; athleteName: (id: number | null) => string };

function safeFileName(value: string) { return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "tournament"; }
function xml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;"); }
function downloadBlob(content: BlobPart, fileName: string, type: string) { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; anchor.click(); URL.revokeObjectURL(url); }

export function buildBracketSvg({ tournamentName, mode, matches, athleteName }: Props) {
  const rounds = Array.from(new Set(matches.map(match => match.round)));
  const columns = rounds.map(round => ({ round, rows: matches.filter(match => match.round === round).sort((a, b) => a.matchNumber - b.matchNumber) }));
  const boxWidth = 245;
  const columnGap = 42;
  const boxHeight = 86;
  const rowGap = 18;
  const width = Math.max(900, columns.length * (boxWidth + columnGap) + 40);
  const height = Math.max(380, Math.min(2600, Math.max(...columns.map(column => column.rows.length), 1) * (boxHeight + rowGap) + 160));
  const header = `<rect width="100%" height="100%" rx="24" fill="#07111f"/><text x="32" y="40" fill="#d7ff54" font-family="Arial" font-size="18" font-weight="700">${xml(tournamentName || "Tournament")} · ${xml(mode === "nogi" ? "No-Gi" : mode === "gi" ? "GI" : "All modes")}</text><text x="32" y="66" fill="#cbd5e1" font-family="Arial" font-size="11">Final bracket tree · ${new Date().toLocaleString()}</text>`;
  const body = columns.map((column, columnIndex) => {
    const x = 24 + columnIndex * (boxWidth + columnGap);
    const title = `<text x="${x}" y="102" fill="#ffffff" font-family="Arial" font-size="14" font-weight="700">${xml(column.round)}</text>`;
    const cards = column.rows.map((match, rowIndex) => {
      const y = 116 + rowIndex * (boxHeight + rowGap);
      const a = xml(athleteName(match.athleteAId));
      const b = xml(athleteName(match.athleteBId));
      return `<g><rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="12" fill="#ffffff"/><text x="${x + 14}" y="${y + 19}" fill="#64748b" font-family="Arial" font-size="10">Match ${match.matchNumber} · ${xml(match.status)}</text><text x="${x + 14}" y="${y + 43}" fill="#0f172a" font-family="Arial" font-size="13" font-weight="700">${a}</text><text x="${x + 14}" y="${y + 66}" fill="#0f172a" font-family="Arial" font-size="13" font-weight="700">${b}</text></g>`;
    }).join("");
    return title + cards;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${header}${body}</svg>`;
}

async function svgToPng(svg: string, width: number, height: number) {
  const image = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Could not render bracket image")); image.src = url; });
    const canvas = document.createElement("canvas"); canvas.width = width * 2; canvas.height = height * 2;
    const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas is unavailable");
    context.fillStyle = "#07111f"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally { URL.revokeObjectURL(url); }
}

export default function BracketTreeExport(props: Props) {
  const disabled = props.matches.length === 0;
  const safeName = safeFileName(props.tournamentName || "tournament");
  const modeName = props.mode === "nogi" ? "nogi" : props.mode === "gi" ? "gi" : "all";
  const exportImage = async () => {
    try {
      const svg = buildBracketSvg(props); const width = Number(svg.match(/width="(\d+)"/)?.[1] ?? 1200); const height = Number(svg.match(/height="(\d+)"/)?.[1] ?? 800); const png = await svgToPng(svg, width, height); const response = await fetch(png); downloadBlob(await response.blob(), `${safeName}-${modeName}-brackets.png`, "image/png"); toast.success("Bracket image downloaded");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Bracket image export failed"); }
  };
  const exportPdf = async () => {
    try {
      const svg = buildBracketSvg(props); const width = Number(svg.match(/width="(\d+)"/)?.[1] ?? 1200); const height = Number(svg.match(/height="(\d+)"/)?.[1] ?? 800); const png = await svgToPng(svg, width, height); const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" }); const pageWidth = 281; const pageHeight = 194; const ratio = Math.min(pageWidth / width, pageHeight / height); pdf.addImage(png, "PNG", 5, 5, width * ratio, height * ratio); pdf.save(`${safeName}-${modeName}-brackets.pdf`); toast.success("Bracket PDF downloaded");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Bracket PDF export failed"); }
  };
  return <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={disabled} onClick={exportImage}><Download className="mr-2 h-4 w-4" /> PNG</Button><Button size="sm" variant="outline" disabled={disabled} onClick={exportPdf}><Download className="mr-2 h-4 w-4" /> PDF</Button></div>;
}
