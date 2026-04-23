import { clearAdAttribution, readAdAttribution } from "./adAttribution";
import { setAccessTokenInBrowserPrefs } from "./browser";

export function getAuthHost() {
  return process.env.NEXT_PUBLIC_AUTH_HOST || "webreplay.us.auth0.com";
}

export function getAuthClientId() {
  return process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || "4FvFnJJW4XlnUyrXQF8zOLw6vNAH1MAo";
}

export function login(returnTo = location.pathname + location.search) {
  const params: Record<string, string> = {
    origin: location.origin,
    returnTo,
  };

  // forward any captured ad attribution to the dashboard's /login handler,
  // which forwards it into auth0 authorizationParams so the post-login
  // action can pass it to ensureUserForAuth.
  const attribution = readAdAttribution();
  if (attribution) {
    if (attribution.li_fat_id) params.li_fat_id = attribution.li_fat_id;
    if (attribution.twclid) params.twclid = attribution.twclid;
    if (attribution.rdt_cid) params.rdt_cid = attribution.rdt_cid;
    if (attribution.utm_source) params.utm_source = attribution.utm_source;
    if (attribution.utm_medium) params.utm_medium = attribution.utm_medium;
    if (attribution.utm_campaign) params.utm_campaign = attribution.utm_campaign;
    if (attribution.utm_content) params.utm_content = attribution.utm_content;
    if (attribution.utm_term) params.utm_term = attribution.utm_term;
  }

  location.href = `/login?${new URLSearchParams(params)}`;
}

export function logout() {
  // clear the access token cookie
  document.cookie = "replay:access-token=; expires=-1; Max-Age=-99999999; path=/;";

  // drop any cached ad attribution so a later signup from a different
  // user on the same browser doesn't inherit the previous user's click IDs.
  clearAdAttribution();

  if (window.__IS_RECORD_REPLAY_RUNTIME__) {
    setAccessTokenInBrowserPrefs(null);
    location.replace("/login");
  } else {
    location.replace(
      `/api/auth/logout?${new URLSearchParams({ origin: location.origin, returnTo: "/login" })}`
    );
  }
}
