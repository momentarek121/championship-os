import { describe, expect, it } from "vitest";
import { decodeOAuthState } from "@shared/const";
import { buildLoginUrl } from "@/const";

describe("OAuth login initiation", () => {
  it("builds a callback-safe Manus app-auth URL", () => {
    const redirectUri = "https://egyptbjj.vercel.app/api/oauth/callback";
    const nonce = "test-login-nonce";
    const url = new URL(buildLoginUrl({
      oauthPortalUrl: "https://oauth.example.test",
      appId: "championship-os-test",
      redirectUri,
      nonce,
    }));

    expect(url.origin).toBe("https://oauth.example.test");
    expect(url.pathname).toBe("/app-auth");
    expect(url.searchParams.get("appId")).toBe("championship-os-test");
    expect(url.searchParams.get("redirectUri")).toBe(redirectUri);
    expect(url.searchParams.get("type")).toBe("signIn");
    expect(decodeOAuthState(url.searchParams.get("state") ?? "")).toMatchObject({ redirectUri, nonce });
  });
});
