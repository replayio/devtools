declare global {
  var __IS_RECORD_REPLAY_RUNTIME__: boolean;
}

const url = new URL(window.location.href);

export function isDevelopment() {
  return url.hostname == "localhost";
}

export function isFirefox() {
  return /firefox/i.test(navigator.userAgent);
}

export function isReplayBrowser() {
  return window.__IS_RECORD_REPLAY_RUNTIME__;
}

export function getTest() {
  return url.searchParams.get("test");
}

export function isOpenedFromEmail() {
  return url.searchParams.get("emailinvite");
}

export function isTest() {
  return getTest() != null;
}

export function skipTelemetry() {
  return isTest() || isDevelopment();
}

export function isDeployPreview() {
  return url.hostname.includes("replay-devtools.netlify.app");
}

// The loading param is currently used to wait for resources
// such as sourcemaps to load
export function hasLoadingParam() {
  return url.searchParams.get("loading") != null;
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
