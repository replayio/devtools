export function setUserInBrowserPrefs(user?: { id: string } | null) {
  const _user = user == null ? "" : user;
  window.dispatchEvent(
    new window.CustomEvent("WebChannelMessageToChrome", {
      detail: JSON.stringify({
        id: "record-replay",
        message: { user: _user },
      }),
    })
  );
}
