import { build } from "esbuild";
await build({ entryPoints: ["api/index.ts"], bundle: true, platform: "node", format: "esm", outfile: ".vercel-api-test.mjs", packages: "external" });
process.env.NODE_ENV = "production";
process.env.VERCEL = "1";
await import("../.vercel-api-test.mjs");
console.log("Vercel handler imported successfully");
