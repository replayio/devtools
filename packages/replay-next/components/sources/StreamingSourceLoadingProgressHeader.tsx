import { useSyncExternalStore } from "react";

import { StreamingParser } from "replay-next/src/suspense/SyntaxParsingCache";

import styles from "./StreamingSourceLoadingProgressHeader.module.css";

export default function StreamingSourceLoadingProgressHeader({
  streamingParser,
}: {
  streamingParser: StreamingParser;
}) {
  const rawTextPercentage = useSyncExternalStore(
    streamingParser.subscribe,
    () => streamingParser.rawTextPercentage,
    () => streamingParser.rawTextPercentage
  );

  const parsedTokensPercentage = useSyncExternalStore(
    streamingParser.subscribe,
    () => streamingParser.parsedTokensPercentage,
    () => streamingParser.parsedTokensPercentage
  );

  const loadedProgressBarWidth = Math.round(rawTextPercentage * 100);
  const parsedTokensPercentageBarWidth = Math.round(parsedTokensPercentage * 100);

  return (
    <div
      className={styles.Container}
      style={{
        // Collapse progress bar once loading has finished
        height: rawTextPercentage === 1 ? 0 : undefined,
      }}
    >
      <div className={styles.RawProgressBar} style={{ width: `${loadedProgressBarWidth}%` }} />
      <div
        className={styles.ParsedProgressBar}
        style={{
          // Show parsed progress bar once parsing has started
          opacity: parsedTokensPercentage > 0 ? 1 : 0,
          width: parsedTokensPercentage > 0 ? `${parsedTokensPercentageBarWidth}%` : 0,
        }}
      />
    </div>
  );
}
