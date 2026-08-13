export type RegistrationFlowRow = {
  id: number;
  status: "pending" | "approved" | "rejected";
  weighInStatus?: "pending" | "passed" | "overweight";
  categoryName?: string | null;
};

export function selectWeighInQueue<T extends RegistrationFlowRow>(rows: T[], categoryFilter = "all") {
  return rows.filter(row => row.status === "approved" && (categoryFilter === "all" || (row.categoryName ?? "Unassigned") === categoryFilter));
}

export function selectBracketEligible<T extends RegistrationFlowRow>(rows: T[]) {
  return rows.filter(row => row.status === "approved" && row.weighInStatus === "passed");
}
