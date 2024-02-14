import { unstable_Activity as Activity, ReactNode, useEffect, useRef } from "react";

// Wrapper around the Activity API that defers rendering the Activity tree initially,
// until it's been explicitly marked as "visible".
//
// This allows UIs that make heavy use of Suspense (such as the Object Inspector)
// to avoid sending a flood of protocol requests when initially mounted.
export default function LazyActivity({
  children,
  mode,
}: {
  children: ReactNode;
  mode: "hidden" | "visible";
}) {
  const hasBeenVisibleRef = useRef(false);
  const hasBeenVisible = hasBeenVisibleRef.current;

  useEffect(() => {
    if (mode === "visible") {
      hasBeenVisibleRef.current = true;
    }
  });

  if (mode === "hidden" && !hasBeenVisible) {
    return null;
  }

  return <Activity children={children} mode={mode} />;
}
