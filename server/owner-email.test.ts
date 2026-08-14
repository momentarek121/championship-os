import { describe, expect, it } from "vitest";

describe("independent organizer identity", () => {
  it("has a configured owner email for Supabase Auth admin mapping", () => {
    expect(process.env.OWNER_EMAIL).toBe("tmomen521@gmail.com");
  });
});

export {};

