import { setAccessTokenInBrowserPrefs } from "./browser";

export function getAuthHost() {
  return process.env.NEXT_PUBLIC_AUTH_HOST || "webreplay.us.auth0.com";
}

export function getAuthClientId() {
  return process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || "4FvFnJJW4XlnUyrXQF8zOLw6vNAH1MAo";
}

export function login(returnTo = location.pathname + location.search) {
  location.href = `/login?${new URLSearchParams({ origin: location.origin, returnTo })}`;
}

export function logout() {
  // clear the access token cookie
  document.cookie = "replay:access-token=; expires=-1; Max-Age=-99999999; path=/;";

  if (window.__IS_RECORD_REPLAY_RUNTIME__) {
    setAccessTokenInBrowserPrefs(null);
    location.replace("/login");
  } else {
    location.replace(
      `/api/auth/logout?${new URLSearchParams({ origin: location.origin, returnTo: "/login" })}`
    );
  }
}
