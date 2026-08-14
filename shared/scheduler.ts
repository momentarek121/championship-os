export type SchedulerMatch = {
  id: number;
  categoryId: number;
  round: string;
  matchNumber: number;
  status?: "queued" | "called" | "live" | "finished" | "no_show";
  matId?: number | null;
};

export type ScheduledMatch = SchedulerMatch & {
  matIndex: number;
  schedulerOrder: number;
  scheduledAt: Date;
  durationMinutes: number;
  delayMinutes: number;
};

function pickCandidate(remaining: SchedulerMatch[], lastCategoryId: number | null) {
  return remaining.find(match => match.categoryId !== lastCategoryId) ?? remaining[0];
}

export function buildMatSchedule(matches: SchedulerMatch[], options: { matCount: number; startAt: Date; durationMinutes?: number; transitionMinutes?: number; lockedMatIds?: Record<number, number> }): ScheduledMatch[] {
  const matCount = Math.max(1, Math.floor(options.matCount));
  const durationMinutes = Math.max(1, Math.floor(options.durationMinutes ?? 6));
  const transitionMinutes = Math.max(0, Math.floor(options.transitionMinutes ?? 2));
  const remaining = [...matches].sort((a, b) => a.matchNumber - b.matchNumber || a.id - b.id);
  const lastCategory = Array.from({ length: matCount }, () => null as number | null);
  const matCounts = Array.from({ length: matCount }, () => 0);
  const output: ScheduledMatch[] = [];
  let order = 1;

  while (remaining.length) {
    for (let matIndex = 0; matIndex < matCount && remaining.length; matIndex += 1) {
      const lockedId = options.lockedMatIds?.[remaining[0].id];
      const preferredIndex = lockedId ? Math.max(0, Math.min(matCount - 1, lockedId - 1)) : matIndex;
      const candidates = remaining.filter(match => (options.lockedMatIds?.[match.id] ? options.lockedMatIds[match.id] === preferredIndex + 1 : true));
      if (!candidates.length) continue;
      const candidate = pickCandidate(candidates, lastCategory[preferredIndex]);
      const index = remaining.findIndex(match => match.id === candidate.id);
      remaining.splice(index, 1);
      const slot = matCounts[preferredIndex];
      const scheduledAt = new Date(options.startAt.getTime() + slot * (durationMinutes + transitionMinutes) * 60000);
      output.push({ ...candidate, matIndex: preferredIndex + 1, schedulerOrder: order, scheduledAt, durationMinutes, delayMinutes: 0 });
      lastCategory[preferredIndex] = candidate.categoryId;
      matCounts[preferredIndex] += 1;
      order += 1;
    }
    if (remaining.length && output.length === 0) break;
  }
  return output;
}

export function estimatedEndAt(match: Pick<ScheduledMatch, "scheduledAt" | "durationMinutes" | "delayMinutes">) {
  return new Date(match.scheduledAt.getTime() + (match.durationMinutes + match.delayMinutes) * 60000);
}
