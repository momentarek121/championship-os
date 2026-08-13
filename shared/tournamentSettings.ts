export type TournamentSettingsInput = {
  organizationName: string;
  weighInMode: "ibjjf" | "custom";
  weighInTolerance: string;
  scaleNotes: string;
};

export function normalizeTournamentSettings(input: TournamentSettingsInput): TournamentSettingsInput {
  const organizationName = input.organizationName.trim();
  const weighInTolerance = input.weighInTolerance.trim() || "0.00";
  if (organizationName.length < 2) throw new Error("Organization name is required");
  if (!/^\d+(\.\d{1,2})?$/.test(weighInTolerance)) throw new Error("Invalid weigh-in tolerance");
  return {
    organizationName,
    weighInMode: input.weighInMode,
    weighInTolerance,
    scaleNotes: input.scaleNotes.trim(),
  };
}

export function setupChecklistReady(settings: TournamentSettingsInput) {
  return Boolean(settings.organizationName.trim() && settings.weighInMode && /^\d+(\.\d{1,2})?$/.test(settings.weighInTolerance));
}
