import { useContext, useLayoutEffect } from "react";

import { TimelineContext } from "replay-next/src/contexts/TimelineContext";

import styles from "./CurrentTimeIndicator.module.css";

export default function CurrentTimeIndicator() {
  const { executionPoint } = useContext(TimelineContext);

  useLayoutEffect(scrollCurrentTimeIndicatorIntoView, [executionPoint]);

  return (
    <div className={styles.CurrentTimeIndicator} data-test-id="Console-CurrentTimeIndicator" />
  );
}

export function scrollCurrentTimeIndicatorIntoView() {
  const indicator = document.querySelector(`[data-test-id="Console-CurrentTimeIndicator"]`);
  if (indicator) {
    indicator.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}
