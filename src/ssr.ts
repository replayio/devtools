function requiresWindow(cb: (win: Window) => void) {
  if (typeof window !== "undefined") {
    return cb(window);
  }
}

function usesWindow<T>(cb: (win?: Window) => T) {
  return cb(typeof window !== "undefined" ? window : undefined);
}

export { requiresWindow, usesWindow };
