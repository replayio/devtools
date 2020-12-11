const url = new URL(window.location.href);

export function isDevelopment() {
  return url.hostname == "localhost";
}

export function isFirefox() {
  return /firefox/i.test(navigator.userAgent);
}

export function isTest() {
  return url.searchParams.get("test") != null;
}

export function isDeployPreview() {
  return url.hostname.includes("replay-devtools.netlify.app");
}

// The loading param is currently used to wait for resources
// such as sourcemaps to load
export function hasLoadingParam() {
  return url.searchParams.get("loading") != null;
}
