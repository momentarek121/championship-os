import { describe, expect, it } from "vitest";
import { __resolveStaticDirectoryForTests as resolveStaticDirectory } from "./_core/static";

describe("production static directory resolution", () => {
  it("prefers the root public directory used by Vercel filesystem routing", () => {
    const root = "/vercel/path0";
    const selected = resolveStaticDirectory(root, "/vercel/path0/dist/_core", candidate => candidate === `${root}/public`);
    expect(selected).toBe(`${root}/public`);
  });

  it("falls back to the generated dist/public directory when root public is absent", () => {
    const root = "/workspace/app";
    const selected = resolveStaticDirectory(root, "/workspace/app/dist/_core", candidate => candidate === `${root}/dist/public`);
    expect(selected).toBe(`${root}/dist/public`);
  });
});
