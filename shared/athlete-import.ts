import { z } from "zod";
import { calculateAge, poolLabel, resolveCategory } from "./category";

export const athleteImportRowSchema = z.object({
  fullName: z.string().trim().min(2),
  dateOfBirth: z.string().trim().min(1),
  gender: z.enum(["male", "female"]),
  belt: z.string().trim().min(1),
  expectedWeight: z.number().positive().max(500),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

export type AthleteImportRow = z.infer<typeof athleteImportRowSchema>;
export type AthleteImportPreview = AthleteImportRow & { age: number; categoryName: string; weightLimit: number; pool: string };

const aliases: Record<string, keyof AthleteImportRow> = { name: "fullName", fullname: "fullName", "full name": "fullName", الاسم: "fullName", "اسم اللاعب": "fullName", dob: "dateOfBirth", birthdate: "dateOfBirth", "date of birth": "dateOfBirth", الميلاد: "dateOfBirth", "تاريخ الميلاد": "dateOfBirth", gender: "gender", sex: "gender", النوع: "gender", belt: "belt", الحزام: "belt", weight: "expectedWeight", expectedweight: "expectedWeight", "expected weight": "expectedWeight", الوزن: "expectedWeight", الميزان: "expectedWeight", email: "email", البريد: "email", phone: "phone", الهاتف: "phone" };
function key(value: unknown) { return String(value ?? "").trim().toLowerCase().replace(/[\u064B-\u065F]/g, "").replace(/[_-]+/g, " ").replace(/\s+/g, " "); }
function normalizeGender(value: unknown): "male" | "female" { const normalized = key(value); return /female|woman|girl|انثى|أنثى|بنت|نساء/.test(normalized) ? "female" : "male"; }
function normalizeDate(value: unknown) { if (value instanceof Date) return value.toISOString().slice(0, 10); const raw = String(value ?? "").trim(); if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(raw)) return raw; const parsed = new Date(raw); if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid date: ${raw}`); return parsed.toISOString().slice(0, 10); }
export function normalizeAthleteImportRow(raw: Record<string, unknown>): AthleteImportRow { const normalized: Partial<AthleteImportRow> = {}; for (const [rawKey, value] of Object.entries(raw)) { const mapped = aliases[key(rawKey)]; if (mapped) normalized[mapped] = value as never; } return athleteImportRowSchema.parse({ ...normalized, gender: normalizeGender(normalized.gender), expectedWeight: Number(normalized.expectedWeight), dateOfBirth: normalizeDate(normalized.dateOfBirth), email: normalized.email ? String(normalized.email).trim() : "", phone: normalized.phone ? String(normalized.phone).trim() : "" }); }
export function previewAthleteImport(rows: AthleteImportRow[], competitionMode: "gi" | "nogi" | "both" = "gi"): AthleteImportPreview[] { return rows.map((row, index) => { const age = calculateAge(row.dateOfBirth); const category = resolveCategory({ age, gender: row.gender, belt: row.belt, weight: row.expectedWeight, sport: "Brazilian Jiu-Jitsu", competitionMode }); return { ...row, age, categoryName: category.name, weightLimit: category.weightLimit, pool: poolLabel(Math.floor(index / 4)) }; }); }
