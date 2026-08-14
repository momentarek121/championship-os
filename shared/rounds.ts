export function roundLabel(matchCount: number) {
  if (matchCount >= 8) return "Round of 16";
  if (matchCount >= 4) return "Quarterfinal";
  if (matchCount >= 2) return "Semifinal";
  return "Final";
}

export function nextRoundLabel(round: string) {
  const labels = ["Round of 16", "Quarterfinal", "Semifinal", "Final"];
  const index = labels.indexOf(round);
  return index >= 0 && index < labels.length - 1 ? labels[index + 1] : null;
}

export function nextMatchNumber(matchNumber: number) {
  return Math.ceil(matchNumber / 2);
}
