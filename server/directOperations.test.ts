import { describe, expect, it } from "vitest";
import fs from "node:fs";

const home = fs.readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const operations = fs.readFileSync(new URL("../client/src/pages/OperationsHub.tsx", import.meta.url), "utf8");
const trpc = fs.readFileSync(new URL("./_core/trpc.ts", import.meta.url), "utf8");

 describe("direct tournament operations mode", () => {
  it("loads the organizer dashboard without an auth-enabled query gate", () => {
    expect(home).toContain("useQuery(undefined, { enabled: true");
    expect(home).not.toContain("if (!isAuthenticated) return");
    expect(home).toContain("dashboard.isLoading && !dashboard.data");
    expect(home).not.toContain("loading && dashboard.isLoading");
  });

  it("provides a retry state when dashboard data fails", () => {
    expect(home).toContain("dashboard.isError");
    expect(home).toContain("dashboard.refetch()");
    expect(home).toContain("dashboardTimedOut");
    expect(home).toContain("Connection taking too long");
    expect(home).toContain("/operations");
    expect(home).not.toContain("/register/portsaid-bjj-championship");
  });

  it("exposes the public operations hub and direct capability middleware", () => {
    expect(app).toContain("path={\"/operations\"}");
    expect(app).not.toContain("/register/:slug");
    expect(operations).toContain("Import athlete roster");
    expect(operations).toContain("استيراد قائمة اللاعبين");
    expect(trpc).toContain("directOperationsUser");
  });

  it("keeps the primary operating routes registered", () => {
    for (const path of ["/brackets", "/matches", "/mats", "/referee", "/staff"]) {
      expect(app).toContain(`path={\"${path}\"}`);
    }
  });
});
