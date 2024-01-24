declare global {
  var __IS_RECORD_REPLAY_RUNTIME__: boolean;
}

export type ReadOnlyURLParams = {
  apiKey: string | null;
  e2e: boolean;
  referrer: string | null;
};

export function decodeBase64FromURL(urlParam: string): Object | undefined {
  try {
    return JSON.parse(atob(decodeURIComponent(urlParam))) as any;
  } catch (e) {
    return undefined;
  }
}

export function encodeObjectToURL(obj: Object): string | undefined {
  try {
    return encodeURIComponent(btoa(JSON.stringify(obj)));
  } catch (e) {
    return undefined;
  }
}

// Strip the URL of any query parameters
export function getDisplayedUrl(url: string | undefined) {
  if (!url) {
    return "";
  }

  try {
    const { hostname, pathname } = new URL(url);
    return `${hostname}${pathname}`;
  } catch (error) {
    return "";
  }
}

// This method returns a subset of URL parameters, onces that do not change during a session;
// Parameters that change (e.g. values stored in Redux) are managed by ui/setup/dynamic/url
export function getReadOnlyParamsFromURL(): ReadOnlyURLParams {
  const { searchParams } = getURL();

  return {
    apiKey: searchParams.get("apiKey"),

    // Presumably the "test" param is a legacy one
    // https://github.com/replayio/devtools/commit/8dd02c0055fe33e714a88e0a3aa19d1fc181bbc9
    // The newer param is "e2e"
    // https://github.com/replayio/devtools/commit/bcc9f735258fec7afb951713d8b14d31d900df09
    e2e: !!searchParams.get("e2e") || !!searchParams.get("test"),

    // This was original added as "login-referrer"
    // https://github.com/replayio/devtools/commit/4352083de6bc1ed7b24c16c684f7650292f61658
    referrer: searchParams.get("referrer") ?? searchParams.get("login-referrer"),
  };
}

export function getURL(): URL {
  const url = typeof window !== "undefined" ? window.location.href : "https://app.replay.io";
  return new URL(url);
}

export function hasApiKey() {
  return !!getReadOnlyParamsFromURL().apiKey;
}

export function isDevelopment() {
  return getURL().hostname == "localhost";
}

// Return whether we are running one of the tests in our e2e test suite.
// We will be connected to a live backend and testing debugging features.
export function isTest() {
  return getReadOnlyParamsFromURL().e2e;
}

export function isFirefox() {
  return /firefox/i.test(navigator.userAgent);
}

export function isReplayBrowser() {
  return typeof window !== "undefined" ? "__IS_RECORD_REPLAY_RUNTIME__" in window : false;
}

export function launchAndRecordUrl(url: string) {
  let autoRecordUrl = url;

  // replay: HTTP scheme is only supported on Mac atm
  if (navigator.userAgent.includes("Macintosh")) {
    autoRecordUrl = `replay:record?url=${url}`;
  }

  window.open(autoRecordUrl);
}

export function removeUrlParameters() {
  window.history.pushState({}, document.title, window.location.pathname);
}

export function skipTelemetry() {
  const isDeployPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

  return isTest() || isDevelopment() || isDeployPreview;
}
