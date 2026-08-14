import { describe, expect, it } from "vitest";
import net from "node:net";

function openTcpConnection(uri: string) {
  const parsed = new URL(uri);
  return new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host: parsed.hostname, port: Number(parsed.port || 5432), timeout: 5000 });
    socket.once("connect", () => { socket.destroy(); resolve(); });
    socket.once("timeout", () => { socket.destroy(); reject(new Error("Supabase pooler connection timed out")); });
    socket.once("error", error => { socket.destroy(); reject(error); });
  });
}

describe("Supabase PostgreSQL connection", () => {
  it("parses the secure URI and reaches the pooler endpoint", async () => {
    const uri = (process.env.SUPABASE_DATABASE_URL ?? "").trim().replace(/^['"]|['"]$/g, "");
    expect(uri).toMatch(/^postgres(?:ql):\/\/[^:]+:.+@[^:]+:\d+\/postgres/);
    const parsed = new URL(uri);
    expect(parsed.hostname).toContain("supabase.com");
    expect(parsed.port).toBe("6543");
    await openTcpConnection(uri);
  }, 15_000);
});
