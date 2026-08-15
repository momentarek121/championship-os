import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

describe("public registration fallback", () => {
  it("ships a real form action for no-React boot states", () => {
    expect(html).toContain('id="fallback-registration-form"');
    expect(html).toContain('action="/api/trpc/publicRegistration.submit?batch=1"');
    expect(html).not.toContain('href="https://egyptbjj.vercel.app/register/portsaid-bjj-championship"');
  });
});
