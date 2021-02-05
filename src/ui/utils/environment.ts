const url = new URL(window.location.href);

export function isDevelopment() {
  return url.hostname == "localhost";
}

export function isFirefox() {
  return /firefox/i.test(navigator.userAgent);
}

export function getTest() {
  return url.searchParams.get("test");
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
