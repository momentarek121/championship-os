import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/lib/supabase.ts", import.meta.url), "utf8");

describe("Supabase OAuth provider guard", () => {
  it("checks the OAuth result before browser navigation", () => {
    expect(source).toContain("skipBrowserRedirect: true");
    expect(source).toContain("if (!result.error && result.data?.url) window.location.assign(result.data.url)");
  });
});
