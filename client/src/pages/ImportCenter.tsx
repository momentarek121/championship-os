import { Link } from "wouter";
import { ArrowLeft, FileSpreadsheet, Languages } from "lucide-react";
import AthleteImportPanel from "@/components/AthleteImportPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportCenter() {
  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d7ff54] text-[#07111f]"><FileSpreadsheet className="h-6 w-6" /></div>
            <div><p className="font-black tracking-tight">Championship OS</p><p className="text-sm text-slate-300">Import Center · مركز استيراد اللاعبين</p></div>
          </div>
          <Button variant="outline" className="border-white/20 bg-transparent text-white" onClick={() => document.documentElement.dir = document.documentElement.dir === "rtl" ? "ltr" : "rtl"}><Languages className="mr-2 h-4 w-4" />العربية / English</Button>
        </header>
        <Card className="mb-5 border-white/10 bg-white/[.08] text-white shadow-2xl">
          <CardHeader><CardTitle className="text-3xl font-black">Import the roster and place every athlete automatically</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-slate-300"><p>ارفع ملف Excel أو CSV للاعبين. ستظهر المعاينة أولًا، ثم يتم تسكين كل لاعب تلقائيًا حسب العمر والجنس والحزام والوزن ونوع المنافسة.</p><p className="text-sm">Current event: Port Said BJJ Championship · GI + No-Gi pools remain separate.</p></CardContent>
        </Card>
        <AthleteImportPanel tournamentId={7} competitionMode="both" onImported={() => undefined} />
        <div className="mt-6 flex flex-wrap gap-3"><Link href="/operations"><Button variant="outline" className="border-white/20 bg-transparent text-white"><ArrowLeft className="mr-2 h-4 w-4" />Operations hub</Button></Link><Link href="/brackets"><Button className="bg-[#d7ff54] text-[#07111f]">Open brackets</Button></Link></div>
      </div>
    </main>
  );
}
