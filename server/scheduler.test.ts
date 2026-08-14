import { describe, expect, it } from "vitest";
import { buildMatSchedule, estimatedEndAt } from "@shared/scheduler";

describe("mat scheduler", () => {
  const matches = [1, 2, 3, 4, 5, 6].map((id, index) => ({ id, categoryId: index % 3, round: "Round of 16", matchNumber: id }));

  it("balances work across mats and avoids immediate category repetition when possible", () => {
    const result = buildMatSchedule(matches, { matCount: 2, startAt: new Date("2026-08-14T10:00:00Z"), durationMinutes: 6, transitionMinutes: 2 });
    expect(result.filter(match => match.matIndex === 1)).toHaveLength(3);
    expect(result.filter(match => match.matIndex === 2)).toHaveLength(3);
    const matOne = result.filter(match => match.matIndex === 1);
    expect(matOne[0].categoryId).not.toBe(matOne[1].categoryId);
  });

  it("assigns exact sequential timestamps per mat", () => {
    const result = buildMatSchedule(matches.slice(0, 4), { matCount: 2, startAt: new Date("2026-08-14T10:00:00Z"), durationMinutes: 10, transitionMinutes: 5 });
    const matOne = result.filter(match => match.matIndex === 1);
    expect(matOne[1].scheduledAt.toISOString()).toBe("2026-08-14T10:15:00.000Z");
  });

  it("honors a manual mat lock", () => {
    const result = buildMatSchedule(matches.slice(0, 2), { matCount: 2, startAt: new Date("2026-08-14T10:00:00Z"), lockedMatIds: { 1: 2 } });
    expect(result.find(match => match.id === 1)?.matIndex).toBe(2);
  });

  it("includes delay in estimated end time", () => {
    const match = buildMatSchedule(matches.slice(0, 1), { matCount: 1, startAt: new Date("2026-08-14T10:00:00Z"), durationMinutes: 6 })[0];
    match.delayMinutes = 4;
    expect(estimatedEndAt(match).toISOString()).toBe("2026-08-14T10:10:00.000Z");
  });
});
