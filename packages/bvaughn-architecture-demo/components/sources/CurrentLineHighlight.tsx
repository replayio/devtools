import useCurrentPause from "@bvaughn/src/hooks/useCurrentPause";
import { SourceId } from "@replayio/protocol";
import { Suspense } from "react";

import styles from "./CurrentLineHighlight.module.css";

type Props = {
  currentSearchResultLineIndex: number | null;
  lineNumber: number;
  sourceId: SourceId;
};

export default function CurrentLineHighlight(props: Props) {
  return (
    <Suspense>
      <CurrentLineHighlightSuspends {...props} />
    </Suspense>
  );
}
function CurrentLineHighlightSuspends({
  currentSearchResultLineIndex,
  lineNumber,
  sourceId,
}: Props) {
  const pauseData = useCurrentPause();
  if (pauseData !== null && pauseData.data && pauseData.data.frames) {
    // TODO [source viewer]
    // Top frame is not necessarily the selected frame.
    // Look at Holger's new SelectedFrameContext (PR 7987)
    const topFrame = pauseData.data.frames[0];
    if (topFrame) {
      if (
        topFrame.location.find(
          location => location.line === lineNumber && location.sourceId === sourceId
        )
      ) {
        return (
          <div
            className={styles.CurrentExecutionPoint}
            data-test-name="CurrentExecutionPointLineHighlight"
          />
        );
      }
    }
  }

  if (currentSearchResultLineIndex !== null && currentSearchResultLineIndex + 1 === lineNumber) {
    return (
      <div className={styles.CurrentSearchResult} data-test-name="CurrentSearchResultHighlight" />
    );
  }

  return null;
}
