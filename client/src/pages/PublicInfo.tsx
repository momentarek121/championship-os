import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

const content: Record<string, { title: string; eyebrow: string; text: string }> = {
  rankings: { title: "Rankings", eyebrow: "Athlete performance", text: "Official standings will appear here as completed match results are recorded by tournament organizers." },
  athletes: { title: "Athletes", eyebrow: "Public directory", text: "Athlete profiles and tournament history will be published here from approved registrations." },
  membership: { title: "Membership", eyebrow: "Federation access", text: "Membership plans and federation access settings will be published here by the organization." },
  news: { title: "News", eyebrow: "Tournament updates", text: "Announcements, schedules, and event updates will be published here by the organizer." },
  regulations: { title: "Regulations", eyebrow: "Rules and standards", text: "Rulesets, weigh-in standards, and competition policies will be published here for athletes and referees." },
};

export default function PublicInfo({ section }: { section: keyof typeof content }) {
  const page = content[section];
  return <div className="min-h-screen bg-[#0b0d0f] text-white"><header className="border-b border-white/10 bg-[#050607] px-5 py-5"><div className="mx-auto flex max-w-[1200px] items-center justify-between"><Link href="/"><span className="flex items-center gap-3 font-black tracking-widest"><span className="grid h-10 w-10 rotate-45 place-items-center border-2 border-[#d7ff54] text-[#d7ff54]"><span className="-rotate-45 text-xs">OS</span></span>CHAMPIONSHIP OS</span></Link><Link href="/" className="text-sm text-white/55 hover:text-[#d7ff54]">Back to home</Link></div></header><main className="mx-auto flex min-h-[calc(100vh-90px)] max-w-[1200px] items-center px-5 py-20"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.3em] text-[#d7ff54]">{page.eyebrow}</p><h1 className="mt-5 text-5xl font-black md:text-7xl">{page.title}</h1><p className="mt-6 text-lg leading-8 text-white/55">{page.text}</p><div className="mt-10 flex items-center gap-3 border border-white/10 bg-[#111315] p-5 text-sm text-white/65"><Shield className="h-5 w-5 text-[#d7ff54]" />This public section is ready for live tournament data from the Championship OS operations workspace.</div><Link href="/"><ButtonBack /></Link></div></main></div>;
}

function ButtonBack() { return <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#d7ff54]"><ArrowLeft className="h-4 w-4" /> Open operations home</span>; }
