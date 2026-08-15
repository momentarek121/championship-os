import { Link } from "wouter";
import { ArrowLeft, ClipboardList, Gavel, LayoutGrid, ListOrdered, Scale, Swords, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const tools = [
  { href: "/", icon: LayoutGrid, en: "Organizer workspace", ar: "لوحة المنظم", detailEn: "Registration, weigh-in, approvals, results", detailAr: "التسجيل والميزان والاعتماد والنتائج" },
  { href: "/brackets", icon: Swords, en: "Brackets", ar: "البراكت", detailEn: "GI / No-Gi rounds and opponent slots", detailAr: "أدوار GI وNo-Gi وتسكن الخصوم" },
  { href: "/matches", icon: ListOrdered, en: "Match queue", ar: "قائمة المباريات", detailEn: "Next match, opponent, round, and status", detailAr: "المباراة التالية والخصم والدور والحالة" },
  { href: "/mats", icon: Scale, en: "Mats and pools", ar: "المطّات والبولات", detailEn: "Ordered queues and drag-and-drop assignment", detailAr: "قوائم مرتبة وتوزيع بالسحب والإفلات" },
  { href: "/referee", icon: Gavel, en: "Referee desk", ar: "واجهة الحكم", detailEn: "Timer, points, penalties, and winner advancement", detailAr: "التايمر والنقاط والعقوبات وترقية الفائز" },
  { href: "/staff", icon: Users, en: "Staff operations", ar: "تشغيل الموظفين", detailEn: "Registration, weigh-in, mat, and bracket handoff", detailAr: "التسجيل والميزان والمطّات وتسليم البراكت" },
  { href: "/", icon: ClipboardList, en: "Import athlete roster", ar: "استيراد قائمة اللاعبين", detailEn: "Excel, PDF, or CSV upload with automatic placement", detailAr: "رفع Excel أو PDF أو CSV مع تسكين تلقائي" },
  { href: "/rankings", icon: Trophy, en: "Rankings and results", ar: "الترتيب والنتائج", detailEn: "Public standings and published outcomes", detailAr: "الترتيب العام والنتائج المنشورة" },
];

export default function OperationsHub() {
  const { language, setLanguage, t } = useLanguage();
  const isArabic = language === "ar";
  return <div className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-8"><div className="mx-auto max-w-7xl space-y-6"><header className="rounded-3xl bg-[#07111f] p-6 text-white sm:p-8"><div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#d7ff54]"><ArrowLeft className="h-4 w-4" /> {isArabic ? "العودة للوحة الرئيسية" : "Back to organizer"}</Link><Badge className="mt-5 bg-[#d7ff54] text-[#07111f]">CHAMPIONSHIP OS</Badge><h1 className="mt-3 text-4xl font-black">{isArabic ? "مركز تشغيل البطولة" : "Tournament operations hub"}</h1><p className="mt-2 max-w-3xl text-slate-300">{isArabic ? "كل واجهة في مكانها: المنظم، البراكت، المباريات، المطّات، الحكم، واللاعب." : "Every operating view in one place: organizer, brackets, matches, mats, referee, and athlete."}</p></div><Button variant="outline" className="border-white/20 bg-transparent text-white" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>{t("language")}</Button></div></header><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tools.map(tool => { const Icon = tool.icon; return <Link key={tool.href} href={tool.href}><Card className="h-full cursor-pointer border-0 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><CardHeader><div className="flex items-center justify-between"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d7ff54] text-[#07111f]"><Icon className="h-5 w-5" /></div><span className="text-xs font-bold text-slate-400">OPEN</span></div><CardTitle className="mt-3">{isArabic ? tool.ar : tool.en}</CardTitle></CardHeader><CardContent className="pt-0 text-sm leading-6 text-slate-500">{isArabic ? tool.detailAr : tool.detailEn}</CardContent></Card></Link>; })}</div></div></div>;
}
