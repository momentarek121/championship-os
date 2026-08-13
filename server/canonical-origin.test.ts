import { describe, expect, it } from "vitest";
import { getCanonicalAppOrigin } from "../client/src/const";

describe("canonical public origin configuration", () => {
  it("is an absolute HTTPS origin when configured", () => {
    const value = process.env.VITE_CANONICAL_APP_ORIGIN ?? "";
    expect(value).toMatch(/^https:\/\/[^/]+$/);
    expect(getCanonicalAppOrigin()).toBe(value);
  });
});
