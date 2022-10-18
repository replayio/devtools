import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { useContext, useLayoutEffect, useRef } from "react";

import { useShowRewindForNUX } from "./hooks/useShowRewindForNUX";

import styles from "./CurrentTimeIndicator.module.css";

export default function CurrentTimeIndicator() {
  const { executionPoint } = useContext(TimelineContext);

  // Check to see if we would be showing the hover button for
  // the last message in the list for NUX purposes
  const shouldShowRewindForNUX = useShowRewindForNUX(true);

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const div = ref.current!;
    if (!shouldShowRewindForNUX) {
      // If we're showing the hover button on the last message,
      // _don't_ scroll to the time indicator - we want to scroll
      // to that message instead.
      div.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [executionPoint, shouldShowRewindForNUX]);

  return (
    <div
      ref={ref}
      className={styles.CurrentTimeIndicator}
      data-test-id="Console-CurrentTimeIndicator"
    />
  );
}
