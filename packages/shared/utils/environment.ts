import { ExecutionPoint, TimeStampedPointRange } from "@replayio/protocol";

declare global {
  var __IS_RECORD_REPLAY_RUNTIME__: boolean;
}

function getURL(): URL {
  // It's not safe to read the window.location.href during module initialization,
  // because that relies on the order of modules being included,
  // and the module that mocks the environment for tests may be loaded after this one.
  return typeof window !== "undefined"
    ? new URL(window.location.href)
    : new URL("https://app.replay.io");
}

export function isDevelopment() {
  return getURL().hostname == "localhost";
}

export function isFirefox() {
  return /firefox/i.test(navigator.userAgent);
}

export function isReplayBrowser() {
  return typeof window !== "undefined" ? "__IS_RECORD_REPLAY_RUNTIME__" in window : false;
}

export function getTest() {
  return getURL().searchParams.get("test");
}

export function hasApiKey() {
  return !!getURL().searchParams.get("apiKey");
}

// Return whether we are running one of the tests in our e2e test suite.
// We will be connected to a live backend and testing debugging features.
export function isE2ETest() {
  if (getURL().searchParams.get("e2e")) {
    return true;
  }

  return getTest() != null;
}

export function isTest() {
  return isE2ETest();
}

export function skipTelemetry() {
  return isTest() || isDevelopment() || isDeployPreview();
}

export function isDeployPreview() {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
}

// The loading param is currently used to wait for resources
// such as sourcemaps to load
export function hasLoadingParam() {
  return getURL().searchParams.get("loading") != null;
}

export function getFocusWindow() {
  const url = getURL();
  const focusWindowParam = url.searchParams.get("focusWindow");
  return focusWindowParam ? (decodeBase64FromURL(focusWindowParam) as TimeStampedPointRange) : null;
}

export function getPausePointParams(): {
  focusWindow: TimeStampedPointRange | null;
  point: ExecutionPoint | null;
  time: number | null;
} {
  const url = getURL();

  const pointParam = url.searchParams.get("point");
  const point = pointParam ? `${pointParam}` : null;

  let time: number | null = null;
  const timeParam = url.searchParams.get("time");
  if (timeParam) {
    const maybeTime = +timeParam;
    if (!isNaN(maybeTime)) {
      time = maybeTime;
    }
  }

  const focusWindow = getFocusWindow();

  if (time != null && point != null) {
    return { focusWindow, point, time };
  } else {
    return { focusWindow, point: null, time: null };
  }
}

export function getParams() {
  const url = new URL(window.location.toString());
  return { q: url.searchParams.get("q") };
}

export function getUrlString(params: Record<string, string | null | undefined>) {
  const url = new URL(window.location.toString());

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

export function updateUrlWithParams(params: Record<string, string | null | undefined>) {
  const urlString = getUrlString(params);

  window.history.replaceState({}, "", urlString);
}

export function getLoginReferrerParam() {
  const url = getURL();
  const referrerParam = url.searchParams.get("login-referrer");
  return referrerParam === "first-browser-open" ? referrerParam : "default";
}

export function removeUrlParameters() {
  window.history.pushState({}, document.title, window.location.pathname);
}

export function encodeObjectToURL(obj: Object): string | undefined {
  try {
    return encodeURIComponent(btoa(JSON.stringify(obj)));
  } catch (e) {
    return undefined;
  }
}

export function decodeBase64FromURL(urlParam: string): Object | undefined {
  try {
    return JSON.parse(atob(decodeURIComponent(urlParam)));
  } catch (e) {
    return undefined;
  }
}

export function launchAndRecordUrl(url: string) {
  let autoRecordUrl = url;

  // replay: HTTP scheme is only supported on Mac atm
  if (navigator.userAgent.includes("Macintosh")) {
    autoRecordUrl = `replay:record?url=${url}`;
  }

  window.open(autoRecordUrl);
}

// Strip the URL of any query parameters
export function getDisplayedUrl(url: string | undefined) {
  if (!url) {
    return "";
  }

  try {
    const urlObj = new URL(url);
    const { hostname, pathname } = urlObj;
    return `${hostname}${pathname}`;
  } catch (e) {
    return "";
  }
}
