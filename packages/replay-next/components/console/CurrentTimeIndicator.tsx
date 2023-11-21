import { useLayoutEffect } from "react";

import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";

import styles from "./CurrentTimeIndicator.module.css";

export default function CurrentTimeIndicator() {
  const { point } = useMostRecentLoadedPause() ?? {};

  useLayoutEffect(scrollCurrentTimeIndicatorIntoView, [point]);

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
