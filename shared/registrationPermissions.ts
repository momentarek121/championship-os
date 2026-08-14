import type { TournamentRole } from "./roles";

export type RegistrationUpdateFields = {
  paymentStatus?: string;
  checkInStatus?: string;
  weighInStatus?: string;
  weighInNotes?: string;
  seed?: number | null;
  status?: string;
};

export function canUpdateRegistrationFields(role: TournamentRole | string, fields: RegistrationUpdateFields) {
  if (role === "admin" || role === "organizer") return true;
  const keys = Object.keys(fields).filter(key => fields[key as keyof RegistrationUpdateFields] !== undefined);
  if (role === "registration_staff") return keys.every(key => ["paymentStatus", "checkInStatus", "status"].includes(key));
  if (role === "weighin_staff") return keys.length > 0 && keys.every(key => ["weighInStatus", "weighInNotes"].includes(key));
  return false;
}
