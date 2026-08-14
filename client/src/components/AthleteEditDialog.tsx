import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

type Athlete = { id: number; fullName: string; email?: string | null; phone?: string | null; dateOfBirth?: Date | string | null; gender: "male" | "female"; belt: string; expectedWeight?: string | number | null };
type Registration = { id: number; status: "pending" | "approved" | "rejected"; paymentStatus: "unpaid" | "pending" | "paid" | "refunded"; checkInStatus: "not_checked_in" | "checked_in" };

export default function AthleteEditDialog({ athlete, registration, onSaved }: { athlete: Athlete; registration: Registration; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: athlete.fullName, email: athlete.email ?? "", phone: athlete.phone ?? "", dateOfBirth: athlete.dateOfBirth ? new Date(athlete.dateOfBirth).toISOString().slice(0, 10) : "", gender: athlete.gender, belt: athlete.belt, expectedWeight: String(athlete.expectedWeight ?? ""), status: registration.status });
  const updateAthlete = trpc.tournament.updateAthlete.useMutation();
  const updateRegistration = trpc.tournament.updateRegistration.useMutation();
  const save = async () => {
    await updateAthlete.mutateAsync({ athleteId: athlete.id, fullName: form.fullName, email: form.email, phone: form.phone, dateOfBirth: form.dateOfBirth, gender: form.gender, belt: form.belt, expectedWeight: Number(form.expectedWeight) });
    await updateRegistration.mutateAsync({ id: registration.id, status: form.status });
    setOpen(false); onSaved?.();
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="mr-2 h-4 w-4" /> Edit</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit athlete</DialogTitle></DialogHeader><div className="grid gap-3"><Input value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} placeholder="Full name" /><Input value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="Email" /><Input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="Phone" /><Input type="date" value={form.dateOfBirth} onChange={event => setForm({ ...form, dateOfBirth: event.target.value })} /><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Select value={form.gender} onValueChange={gender => setForm({ ...form, gender: gender as "male" | "female" })}><SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select><Select value={form.belt} onValueChange={belt => setForm({ ...form, belt })}><SelectTrigger><SelectValue placeholder="Belt" /></SelectTrigger><SelectContent>{["No belt", "White", "Grey", "Yellow", "Orange", "Green", "Blue", "Purple", "Brown", "Black"].map(belt => <SelectItem key={belt} value={belt}>{belt}</SelectItem>)}</SelectContent></Select></div><Input type="number" min="0" step="0.01" value={form.expectedWeight} onChange={event => setForm({ ...form, expectedWeight: event.target.value })} placeholder="Expected weight KG" /><Select value={form.status} onValueChange={status => setForm({ ...form, status: status as Registration["status"] })}><SelectTrigger><SelectValue placeholder="Registration status" /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select><Button onClick={save} disabled={updateAthlete.isPending || updateRegistration.isPending} className="w-full bg-[#07111f]">Save changes</Button></div></DialogContent></Dialog>;
}
