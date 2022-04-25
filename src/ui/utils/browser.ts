export function setUserInBrowserPrefs(user: { sub: string } | null) {
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
    const { error, token } = ev.detail?.message || {};
    if (!error) {
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

export function requestBrowserLogin() {
  window.dispatchEvent(
    new window.CustomEvent("WebChannelMessageToChrome", {
      detail: JSON.stringify({
        id: "record-replay-token",
        message: { type: "login" },
      }),
    })
  );
}
