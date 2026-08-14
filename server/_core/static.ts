import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function resolveStaticDirectory(
  cwd: string,
  moduleDir: string,
  exists: (candidate: string) => boolean = fs.existsSync,
) {
  const candidates = [
    path.resolve(cwd, "public"),
    path.resolve(cwd, "dist", "public"),
    path.resolve(moduleDir, "public"),
    path.resolve(moduleDir, "..", "public"),
    path.resolve(cwd, "api", "public"),
  ];
  return candidates.find(candidate => exists(candidate)) ?? candidates[0];
}

export function serveStatic(app: Express) {
  const distPath = resolveStaticDirectory(process.cwd(), import.meta.dirname);
  if (!fs.existsSync(distPath)) {
    console.error(`Could not find the build directory: ${distPath}`);
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => res.sendFile(path.resolve(distPath, "index.html")));
}

export { resolveStaticDirectory as __resolveStaticDirectoryForTests };

export default serveStatic;

// Keep the helper export explicit for unit tests without changing the runtime API.
