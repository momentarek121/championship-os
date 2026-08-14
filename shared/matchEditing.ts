export type EditableMatchStatus = "queued" | "called" | "live" | "finished" | "no_show";

export function canEditMatchSlots(status: EditableMatchStatus) {
  return status !== "finished";
}

export function validateMatchSlots(athleteAId: number | null, athleteBId: number | null) {
  if (athleteAId !== null && athleteAId === athleteBId) {
    return { ok: false as const, reason: "A match cannot contain the same athlete twice" };
  }
  return { ok: true as const };
}
