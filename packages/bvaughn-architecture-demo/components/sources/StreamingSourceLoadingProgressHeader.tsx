import { useSyncExternalStore } from "react";

import { StreamingParser } from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";

import styles from "./StreamingSourceLoadingProgressHeader.module.css";

export default function StreamingSourceLoadingProgressHeader({
  streamingParser,
}: {
  streamingParser: StreamingParser;
}) {
  const rawProgress = useSyncExternalStore(
    streamingParser.subscribe,
    () => streamingParser.rawProgress,
    () => streamingParser.rawProgress
  );

  const parsedProgress = useSyncExternalStore(
    streamingParser.subscribe,
    () => streamingParser.parsedProgress,
    () => streamingParser.parsedProgress
  );

  const loadedProgressBarWidth = Math.round(rawProgress * 100);
  const parsedProgressBarWidth = Math.round(parsedProgress * 100);

  return (
    <div
      className={styles.Container}
      style={{
        // Collapse progress bar once loading has finished
        height: rawProgress === 1 ? 0 : undefined,
      }}
    >
      <div className={styles.RawProgressBar} style={{ width: `${loadedProgressBarWidth}%` }} />
      <div
        className={styles.ParsedProgressBar}
        style={{
          // Show parsed progress bar once parsing has started
          opacity: parsedProgress > 0 ? 1 : 0,
          width: parsedProgress > 0 ? `${parsedProgressBarWidth}%` : 0,
        }}
      />
    </div>
  );
}
