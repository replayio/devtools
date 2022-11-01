import useCurrentPause from "bvaughn-architecture-demo/src/hooks/useCurrentPause";
import { SourceId } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import styles from "./CurrentLineHighlight.module.css";
import { SourceSearchContext } from "./SourceSearchContext";

type Props = {
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
function CurrentLineHighlightSuspends({ lineNumber, sourceId }: Props) {
  const [sourceSearchState] = useContext(SourceSearchContext);

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

  const searchLineIndex =
    sourceSearchState.index < sourceSearchState.results.length
      ? sourceSearchState.results[sourceSearchState.index]
      : null;

  if (sourceSearchState.currentScopeId === sourceId && searchLineIndex === lineNumber - 1) {
    return (
      <div className={styles.CurrentSearchResult} data-test-name="CurrentSearchResultHighlight" />
    );
  }

  return null;
}
