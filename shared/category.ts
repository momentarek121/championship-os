export type CategoryInput = { age: number; gender: "male" | "female"; belt: string; weight: number; sport: string };

export function calculateAge(dateOfBirth: string | Date, now = new Date()) {
  const birth = typeof dateOfBirth === "string" ? new Date(`${dateOfBirth}T00:00:00Z`) : dateOfBirth;
  if (Number.isNaN(birth.getTime())) throw new Error("Invalid date of birth");
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

export function resolveCategory(input: CategoryInput) {
  const ageGroup = input.age < 13 ? "Kids" : input.age < 16 ? "Youth" : input.age < 18 ? "Teens" : input.age < 30 ? "Adult" : "Master";
  const weightLimit = input.gender === "male" ? (input.weight <= 77 ? 77 : input.weight <= 85 ? 85 : 94) : (input.weight <= 63 ? 63 : input.weight <= 70 ? 70 : 76);
  return { ageGroup, gender: input.gender === "male" ? "Male" : "Female", belt: input.belt, weightLimit, name: `${ageGroup} / ${input.gender === "male" ? "Male" : "Female"} / ${input.belt} / -${weightLimit} KG`, sport: input.sport };
}

export const POOL_SIZE = 4;

export function poolLabel(index: number) {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return `Pool ${label}`;
}

export function splitIntoPools<T>(rows: T[], poolSize = POOL_SIZE) {
  if (poolSize < 2) throw new Error("Pool size must be at least two");
  return Array.from({ length: Math.ceil(rows.length / poolSize) }, (_, index) => ({
    name: poolLabel(index),
    rows: rows.slice(index * poolSize, (index + 1) * poolSize),
  }));
}
