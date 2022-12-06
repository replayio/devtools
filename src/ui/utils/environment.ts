import { MockedResponse } from "@apollo/client/testing";
import { TimeStampedPointRange } from "@replayio/protocol";

import { injectCustomSocketSendMessageForTesting } from "protocol/socket";

export interface MockEnvironment {
  graphqlMocks?: MockedResponse[];
  setSocketDataHandler(callback: (data: string) => unknown): void;
  sendSocketMessage(str: string): void;
}

declare global {
  var __IS_RECORD_REPLAY_RUNTIME__: boolean;
  interface Window {
    // Injected by test runner during e2e tests.
    __mockEnvironmentForTesting?: MockEnvironment;
  }
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

// Return whether we are running one of the tests in our e2e test suite.
// We will be connected to a live backend and testing debugging features.
export function isE2ETest() {
  if (getURL().searchParams.get("e2e")) {
    return true;
  }

  return getTest() != null;
}

export function isTest() {
  return isMock() || isE2ETest();
}

// Return whether we are running a mock test.
// The backend servers which we connect to will be mocked,
// and we can test behaviors we can't easily replicate when connected to a live backend.
export function isMock() {
  return !!getURL().searchParams.get("mock");
}

// Helper method to retrieve the mock environment that was injected by a test runner.
export async function getMockEnvironmentForTesting(): Promise<MockEnvironment> {
  if (!isTest()) {
    throw Error("Not a mock/test environment");
  }

  // The mock test runner will install a "mockEnvironment" on the window.
  while (!window.__mockEnvironmentForTesting) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return window.__mockEnvironmentForTesting!;
}

// Helper method to retrieve GraphQL mock data that was injected by a test runner.
export async function getGraphqlMocksForTesting(): Promise<MockedResponse[]> {
  const mockEnvironment = await getMockEnvironmentForTesting();

  return mockEnvironment.graphqlMocks!;
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

export function getPausePointParams() {
  const url = getURL();

  const pointParam = url.searchParams.get("point");
  const point = `${pointParam}`;

  const timeParam = url.searchParams.get("time");
  const time = timeParam ? +timeParam : 0;

  const focusRegionParam = url.searchParams.get("focusRegion");
  const focusRegion = focusRegionParam
    ? (decodeBase64FromURL(focusRegionParam) as TimeStampedPointRange)
    : null;

  const testIndexParam = url.searchParams.get("testIndex");
  const testIndex = JSON.parse(`${testIndexParam}`);

  if (pointParam && timeParam) {
    return { point, time, focusRegion, testIndex };
  }

  return null;
}

export function getParams() {
  const url = new URL(window.location.toString());
  return { q: url.searchParams.get("q") };
}

export function updateUrlWithParams(params: Record<string, string | null | undefined>) {
  const url = new URL(window.location.toString());

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  window.history.replaceState({}, "", url.toString());
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

  const urlObj = new URL(url);
  const { hostname, pathname } = urlObj;
  return `${hostname}${pathname}`;
}

export function getSystemColorSchemePreference() {
  const prefersDarkTheme = window.matchMedia("(prefers-color-scheme:dark)").matches;

  return prefersDarkTheme ? "dark" : "light";
}

export async function configureMockEnvironmentForTesting() {
  const mockEnvironment = await getMockEnvironmentForTesting();

  // Configure the protocol to use our mock WebSocket message method.
  const { flushQueuedMessages, responseDataHandler } = injectCustomSocketSendMessageForTesting(
    mockEnvironment.sendSocketMessage
  );

  // Configure the protocol's default socket message handler to receive messages from the mocked WebSocket.
  mockEnvironment.setSocketDataHandler(responseDataHandler);

  // Now that the mock environment has been configured, flush any pending messages.
  flushQueuedMessages();
}
