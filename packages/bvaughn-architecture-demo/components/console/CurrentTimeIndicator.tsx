import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { useContext, useLayoutEffect, useRef } from "react";

import styles from "./CurrentTimeIndicator.module.css";

export default function CurrentTimeIndicator() {
  const { executionPoint } = useContext(TimelineContext);

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const div = ref.current!;
    div.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [executionPoint]);

  return <div ref={ref} className={styles.CurrentTimeIndicator} />;
}
