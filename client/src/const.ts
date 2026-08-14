import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
export function buildLoginUrl(input: { oauthPortalUrl: string; appId: string; redirectUri: string; nonce: string }) {
  const state = encodeOAuthState({ redirectUri: input.redirectUri, nonce: input.nonce });
  const url = new URL(`${input.oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", input.appId);
  url.searchParams.set("redirectUri", input.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  return url.toString();
}

export const getCanonicalAppOrigin = () => import.meta.env.VITE_CANONICAL_APP_ORIGIN || window.location.origin;
export const getPublicAppOrigin = () => import.meta.env.VITE_PUBLIC_APP_ORIGIN || "https://egyptbjj.vercel.app";

export const startLogin = () => {
  const canonicalOrigin = getCanonicalAppOrigin().replace(/\/$/, "");
  if (window.location.origin !== canonicalOrigin) {
    window.location.assign(`${canonicalOrigin}${window.location.pathname}${window.location.search}`);
    return;
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${canonicalOrigin}/api/oauth/callback`;
  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  window.location.href = buildLoginUrl({ oauthPortalUrl, appId, redirectUri, nonce });
};
