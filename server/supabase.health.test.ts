import { describe, expect, it } from "vitest";

describe("Supabase REST health", () => {
  it("reaches the tournaments endpoint with the configured server credential", async () => {
    const baseUrl = process.env.VITE_SUPABASE_URL ?? "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    expect(baseUrl).toMatch(/^https:\/\/[^/]+\.supabase\.co\/?$/);
    expect(serviceRoleKey).toBeTruthy();

    const response = await fetch(`${baseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
  }, 15_000);
});
