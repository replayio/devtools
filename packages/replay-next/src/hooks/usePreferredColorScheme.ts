import { useLayoutEffect, useSyncExternalStore } from "react";

function getMediaQueryList(): MediaQueryList | null {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme:dark)");
  }

  return null;
}

function getURLOverride(): string | null {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get("theme") || null;
}

export default function usePreferredColorScheme(): void {
  const colorScheme = useSyncExternalStore(
    function subscribe(onStoreChange: () => void) {
      const mediaQueryList = getMediaQueryList();
      if (mediaQueryList) {
        mediaQueryList.addEventListener("change", onStoreChange);
        return function unsubscribe() {
          mediaQueryList.removeEventListener("change", onStoreChange);
        };
      } else {
        return function unsubscribe() {};
      }
    },
    function getSnapshot() {
      const urlOverride = getURLOverride();
      if (urlOverride !== null) {
        return urlOverride;
      }

      const mediaQueryList = getMediaQueryList();
      return mediaQueryList?.matches ? "dark" : "light";
    },
    function getServerSnapshot() {
      return "light";
    }
  );

  useLayoutEffect(() => {
    const root = document.body.parentElement!;
    root.classList.add(`theme-${colorScheme}`);
    return () => {
      root.classList.remove(`theme-${colorScheme}`);
    };
  }, [colorScheme]);
}
