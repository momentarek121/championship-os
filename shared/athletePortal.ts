export type PortalMatch = { matchNumber: number; status: string };

export function selectNextMatch<T extends PortalMatch>(matches: T[]) {
  return [...matches].sort((a, b) => a.matchNumber - b.matchNumber).find(match => match.status !== "finished" && match.status !== "no_show");
}
