export type RegistrationListFilters = {
  search?: string;
  belt?: string;
  weightCategory?: string;
  category?: string;
};

export function filterRegistrationRows(
  registrations: any[],
  athletes: any[],
  filters: RegistrationListFilters,
) {
  const query = (filters.search ?? "").trim().toLocaleLowerCase();
  return registrations.filter(row => {
    const athlete = athletes.find(item => item.id === row.athleteId);
    const name = String(athlete?.fullName ?? "").toLocaleLowerCase();
    const belt = String(athlete?.belt ?? "");
    const weight = String(row.categoryName ?? row.categoryWeightLimit ?? "");
    const category = String(row.categoryName ?? "Unassigned");
    return (!query || name.includes(query))
      && (!filters.belt || filters.belt === "all" || belt === filters.belt)
      && (!filters.weightCategory || filters.weightCategory === "all" || weight === filters.weightCategory)
      && (!filters.category || filters.category === "all" || category === filters.category);
  });
}

export function buildRegistrationExportRows(registrations: any[], athletes: any[]) {
  return registrations.map(row => {
    const athlete = athletes.find(item => item.id === row.athleteId);
    return {
      athleteName: athlete?.fullName ?? `Athlete #${row.athleteId}`,
      belt: athlete?.belt ?? "—",
      weight: athlete?.expectedWeight ?? row.categoryWeightLimit ?? "—",
      category: row.categoryName ?? "Unassigned",
      gender: athlete?.gender ?? "—",
      pool: row.pool ?? "Unassigned",
      status: row.status ?? "—",
      payment: row.paymentStatus ?? "—",
      checkIn: row.checkInStatus ?? "—",
      accreditationCode: row.accreditationCode ?? "—",
    };
  });
}
