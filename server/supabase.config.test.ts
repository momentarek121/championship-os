import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("uses a Supabase project URL rather than a key in VITE_SUPABASE_URL", () => {
    const url = process.env.VITE_SUPABASE_URL ?? "";
    expect(url).toMatch(/^https:\/\/[^/]+\.supabase\.co\/?$/);
  });
});
