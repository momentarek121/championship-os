export type TournamentRole = "user" | "admin" | "organizer" | "registration_staff" | "weighin_staff" | "referee" | "mat_manager" | "athlete";
export type RoleCapability = "dashboard" | "registration" | "weigh_in" | "brackets" | "scoring" | "athlete_portal";

const capabilities: Record<TournamentRole, readonly RoleCapability[]> = {
  user: [],
  admin: ["dashboard", "registration", "weigh_in", "brackets", "scoring"],
  organizer: ["dashboard", "registration", "weigh_in", "brackets", "scoring"],
  registration_staff: ["dashboard", "registration"],
  weighin_staff: ["dashboard", "weigh_in"],
  referee: ["dashboard", "scoring"],
  mat_manager: ["dashboard", "brackets", "scoring"],
  athlete: ["athlete_portal"],
};

export function canRole(role: string | null | undefined, capability: RoleCapability) {
  return Boolean(role && (capabilities[role as TournamentRole] ?? []).includes(capability));
}

export function roleCapabilities(role: string | null | undefined) {
  return role ? [...(capabilities[role as TournamentRole] ?? [])] : [];
}
