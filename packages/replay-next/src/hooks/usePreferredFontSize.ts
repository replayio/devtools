import { useLayoutEffect } from "react";

export default function usePreferredFontSize(enableLargeText: boolean): void {
  useLayoutEffect(() => {
    const size = enableLargeText ? "large" : "default";

    const root = document.body.parentElement!;
    root.classList.add(`prefers-${size}-font-size`);
    return () => {
      root.classList.remove(`prefers-${size}-font-size`);
    };
  }, [enableLargeText]);
}
