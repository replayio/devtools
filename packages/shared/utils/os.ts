export function getOS() {
  if (typeof window !== "undefined") {
    const os = window.navigator.userAgent;
    if (os) {
      if (os.includes("Linux")) {
        return "Linux";
      } else if (os.includes("Windows")) {
        return "WINNT";
      } else if (os.includes("Mac")) {
        return "Darwin";
      }
    }
  }
  return "Unknown";
}

export function isMacOS() {
  return getOS() === "Darwin";
}

export function isWindowsOS() {
  return getOS() === "WINNT";
}
