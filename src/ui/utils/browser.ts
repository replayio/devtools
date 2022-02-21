import { User } from "@auth0/auth0-react";

export function setUserInBrowserPrefs(user: User | null) {
  const _user = user === null ? "" : user;
  window.dispatchEvent(
    new window.CustomEvent("WebChannelMessageToChrome", {
      detail: JSON.stringify({
        id: "record-replay",
        message: { user: _user },
      }),
    })
  );
}

export function setAccessTokenInBrowserPrefs(token: string | null) {
  window.dispatchEvent(
    new window.CustomEvent("WebChannelMessageToChrome", {
      detail: JSON.stringify({
        id: "record-replay-token",
        message: { token },
      }),
    })
  );
}

export function listenForAccessToken(callback: (accessToken: string) => void) {
  window.addEventListener("WebChannelMessageToContent", (ev: any) => {
    const token = ev.detail?.message?.token;
    if (token) {
      callback(token);
    }
  });

  window.dispatchEvent(
    new window.CustomEvent("WebChannelMessageToChrome", {
      detail: JSON.stringify({
        id: "record-replay-token",
        message: { type: "connect" },
      }),
    })
  );
}
