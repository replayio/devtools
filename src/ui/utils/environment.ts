import { MockedResponse } from "@apollo/client/testing";
import { usesWindow } from "ssr";
import { extractIdAndSlug } from "./helpers";

export interface MockEnvironment {
  graphqlMocks: MockedResponse[];
  setOnSocketMessage(callback: (arg: { data: string }) => unknown): void;
  sendSocketMessage(str: string): void;
}

declare global {
  var __IS_RECORD_REPLAY_RUNTIME__: boolean;
  interface Window {
    mockEnvironment?: MockEnvironment;
    jsterm: any;
  }
}

export const url = usesWindow(win => {
  if (!win) return new URL("https://app.replay.io");

  return new URL(win.location.href);
});

export function isDevelopment() {
  return url.hostname == "localhost";
}

export function isFirefox() {
  return /firefox/i.test(navigator.userAgent);
}

export function isReplayBrowser() {
  return usesWindow(win => {
    return win ? "__IS_RECORD_REPLAY_RUNTIME__" in win : false;
  });
}

export function getTest() {
  return url.searchParams.get("test");
}

// Return whether we are running one of the tests in our e2e test suite.
// We will be connected to a live backend and testing debugging features.
export function isTest() {
  return isMock() || getTest() != null;
}

// Return whether we are running a mock test. The backend servers which we
// connect to will be mocked, and we can test behaviors we can't easily
// replicate when connected to a live backend.
export function isMock() {
  return !!url.searchParams.get("mock");
}

// Used when we are showing the replay devtools in another environment like the
// landing page (experimental)
export function isDemo() {
  return !!url.searchParams.get("demo");
}

export async function waitForMockEnvironment() {
  if (!isMock()) {
    return null;
  }
  // The mock test runner will install a "mockEnvironment" on the window.
  while (!window.mockEnvironment) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return window.mockEnvironment;
}

export function mockEnvironment() {
  if (!window.mockEnvironment) {
    throw new Error("Missing mock environment");
  }
  return window.mockEnvironment;
}

export function skipTelemetry() {
  return isTest() || isMock() || isDevelopment();
}

export function isDeployPreview() {
  return url.hostname.includes("replay-devtools.netlify.app");
}

// The loading param is currently used to wait for resources
// such as sourcemaps to load
export function hasLoadingParam() {
  return url.searchParams.get("loading") != null;
}

export function getRecordingId() {
  return usesWindow(win => {
    if (!win) return undefined;

    const parts = window.location.pathname.split("/");
    if (parts[0] === "recording") {
      return extractIdAndSlug(parts.slice(1)).id;
    }

    return undefined;
  });
}

export function getPausePointParams() {
  const pointParam = url.searchParams.get("point");
  const point = `${pointParam}`;

  const timeParam = url.searchParams.get("time");
  const time = timeParam ? +timeParam : 0;

  const hasFramesParam = url.searchParams.get("hasFrames");
  const hasFrames = hasFramesParam ? hasFramesParam == "true" : false;

  if (pointParam && timeParam) {
    return { point, time, hasFrames };
  }

  return null;
}

export function removeUrlParameters() {
  window.history.pushState({}, document.title, window.location.pathname);
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
export function getDisplayedUrl(url: string) {
  if (!url) return "";

  const urlObj = new URL(url);
  const { hostname, pathname } = urlObj;
  return `${hostname}${pathname}`;
}
