export type CategoryInput = { age: number; gender: "male" | "female"; belt: string; weight: number; sport: string };

export function resolveCategory(input: CategoryInput) {
  const ageGroup = input.age < 18 ? "Juvenile" : input.age < 30 ? "Adult" : "Master";
  const weightLimit = input.gender === "male" ? (input.weight <= 77 ? 77 : input.weight <= 85 ? 85 : 94) : (input.weight <= 63 ? 63 : input.weight <= 70 ? 70 : 76);
  return { ageGroup, gender: input.gender === "male" ? "Male" : "Female", belt: input.belt, weightLimit, name: `${ageGroup} / ${input.gender === "male" ? "Male" : "Female"} / ${input.belt} / -${weightLimit} KG`, sport: input.sport };
}
