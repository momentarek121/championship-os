import { z } from "zod";

export const importedAthleteRowSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1),
  gender: z.enum(["male", "female"]),
  belt: z.string().min(2),
  expectedWeight: z.number().positive(),
});

export const importedAthleteRowsSchema = z.array(importedAthleteRowSchema).min(1).max(500);
export type ImportedAthleteRow = z.infer<typeof importedAthleteRowSchema>;
