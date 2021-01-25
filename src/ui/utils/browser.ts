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
