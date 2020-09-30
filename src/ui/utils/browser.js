export function setUserInBrowserPrefs(user) {
  user = user === null ? "" : user;
  window.dispatchEvent(
    new window.CustomEvent("WebChannelMessageToChrome", {
      detail: JSON.stringify({
        id: "record-replay",
        message: { user },
      }),
    })
  );
}
