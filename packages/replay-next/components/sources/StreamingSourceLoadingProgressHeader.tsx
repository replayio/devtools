import { useStreamingValue } from "suspense";

import { StreamingSourceContentsValue } from "replay-next/src/suspense/SourcesCache";
import { StreamingParser } from "replay-next/src/suspense/SyntaxParsingCache";

import styles from "./StreamingSourceLoadingProgressHeader.module.css";

export default function StreamingSourceLoadingProgressHeader({
  streamingParser,
  streamingSourceContents,
}: {
  streamingParser: StreamingParser;
  streamingSourceContents: StreamingSourceContentsValue;
}) {
  const { progress: rawTextPercentage = 0 } = useStreamingValue(streamingSourceContents);
  const { progress: parsedTokensPercentage = 0 } = useStreamingValue(streamingParser);

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
