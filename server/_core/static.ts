import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const candidates = [
    path.resolve(process.cwd(), "api", "public"),
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "..", "public"),
  ];
  const distPath = candidates.find(candidate => fs.existsSync(candidate)) ?? candidates[0];
  if (!fs.existsSync(distPath)) {
    console.error(`Could not find the build directory: ${distPath}`);
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => res.sendFile(path.resolve(distPath, "index.html")));
}
