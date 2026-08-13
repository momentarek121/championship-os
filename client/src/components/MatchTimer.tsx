import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pause, Play, RotateCcw } from "lucide-react";

export default function MatchTimer({ defaultMinutes = 5 }: { defaultMinutes?: number }) {
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [secondsLeft, setSecondsLeft] = useState(defaultMinutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSecondsLeft(value => {
      if (value <= 1) { setRunning(false); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const display = useMemo(() => `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`, [secondsLeft]);
  const reset = () => { setRunning(false); setSecondsLeft(Math.max(1, minutes) * 60); };
  const applyDuration = (value: string) => { const next = Math.max(1, Math.min(60, Number(value) || 1)); setMinutes(next); setRunning(false); setSecondsLeft(next * 60); };

  return <div className="rounded-2xl bg-[#07111f] p-5 text-white"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#d7ff54]">Digital match timer</p><p className={`mt-2 font-mono text-5xl font-black tabular-nums ${secondsLeft <= 30 ? "text-rose-300" : "text-white"}`}>{display}</p></div><div className="w-24"><label className="text-[10px] uppercase text-slate-400">Minutes</label><Input className="mt-1 h-8 border-white/20 bg-white/10 text-white" type="number" min="1" max="60" value={minutes} onChange={event => applyDuration(event.target.value)} /></div></div><div className="mt-5 flex flex-wrap gap-2"><Button size="sm" className="bg-[#d7ff54] text-[#07111f]" onClick={() => setRunning(value => !value)}>{running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{running ? "Pause" : secondsLeft === 0 ? "Start again" : "Start"}</Button><Button size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button></div></div>;
}
