import { SourceId } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import { getPauseDataSuspense } from "bvaughn-architecture-demo/src/suspense/PauseCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { SelectedFrameContext } from "../../src/contexts/SelectedFrameContext";
import { SourceSearchContext } from "./SourceSearchContext";
import styles from "./CurrentLineHighlight.module.css";

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
  const client = useContext(ReplayClientContext);
  const [sourceSearchState] = useContext(SourceSearchContext);

  const { selectedPauseAndFrameId } = useContext(SelectedFrameContext);
  const frameId = selectedPauseAndFrameId?.frameId || null;
  const pauseId = selectedPauseAndFrameId?.pauseId || null;

  if (pauseId !== null && frameId !== null) {
    const pauseData = getPauseDataSuspense(client, pauseId);
    if (pauseData !== null && pauseData.frames) {
      const selectedFrame = pauseData.frames.find(frame => frame.frameId === frameId);
      if (selectedFrame) {
        if (
          selectedFrame.location.find(
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
