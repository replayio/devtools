import { useStreamingValue } from "suspense";

import { StreamingSourceContentsValue } from "replay-next/src/suspense/SourcesCache";
import { StreamingParser } from "replay-next/src/suspense/SyntaxParsingCache";

import styles from "./StreamingSourceLoadingProgressHeader.module.css";

// In case the initial source contents request hangs,
// render some minimal amount of progress so that the source viewer isn't empty
const STREAMING_IN_PROGRESS_MIN_LOADING_PERCENTAGE = 0.05;

export default function StreamingSourceLoadingProgressHeader({
  streamingParser,
  streamingSourceContents,
}: {
  streamingParser: StreamingParser;
  streamingSourceContents: StreamingSourceContentsValue;
}) {
  const { progress: rawTextPercentage = STREAMING_IN_PROGRESS_MIN_LOADING_PERCENTAGE } =
    useStreamingValue(streamingSourceContents);
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
