export type EditableMatchStatus = "queued" | "called" | "live" | "finished" | "no_show";

export function canEditMatchSlots(status: EditableMatchStatus) {
  return status !== "finished";
}

export function validateMatchSlots(athleteAId: number | null, athleteBId: number | null, allowedAthleteIds?: ReadonlySet<number>) {
  if (athleteAId !== null && athleteAId === athleteBId) {
    return { ok: false as const, reason: "A match cannot contain the same athlete twice" };
  }
  if (allowedAthleteIds) {
    for (const athleteId of [athleteAId, athleteBId]) {
      if (athleteId !== null && !allowedAthleteIds.has(athleteId)) return { ok: false as const, reason: "Athlete must belong to the match category and competition mode" };
    }
  }
  return { ok: true as const };
}
