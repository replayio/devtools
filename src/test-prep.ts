import { clear as clearAsyncStorage } from "devtools/shared/async-storage";

import { requiresWindow } from "./ssr";

requiresWindow(win => {
  const url = new URL(win.location.href);
  const test = url.searchParams.get("test");

  // During testing, make sure we clear local storage before importing
  // any code that might instantiate preferences from local storage.
  // If the url contains a "navigated" parameter, we assume this is the
  // second part of a test that contains a navigation and don't clear
  // local storage in that case.
  if (test && !url.searchParams.get("navigated")) {
    localStorage.clear();
    clearAsyncStorage();
  }
});
