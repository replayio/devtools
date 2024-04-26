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
    if (token && !error) {
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
