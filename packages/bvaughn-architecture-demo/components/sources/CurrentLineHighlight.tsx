import { SourceId } from "@replayio/protocol";
import { Suspense, memo, useContext } from "react";

import { getFramesSuspense } from "bvaughn-architecture-demo/src/suspense/FrameCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { SelectedFrameContext } from "../../src/contexts/SelectedFrameContext";
import { SourceSearchContext } from "./SourceSearchContext";
import styles from "./CurrentLineHighlight.module.css";

type Props = {
  lineNumber: number;
  sourceId: SourceId;
};

export default memo(function CurrentLineHighlight(props: Props) {
  return (
    <Suspense>
      <CurrentLineHighlightSuspends {...props} />
    </Suspense>
  );
});

function CurrentLineHighlightSuspends({ lineNumber, sourceId }: Props) {
  const client = useContext(ReplayClientContext);
  const [sourceSearchState] = useContext(SourceSearchContext);

  const { selectedPauseAndFrameId, previewLocation } = useContext(SelectedFrameContext);

  if (previewLocation?.sourceId === sourceId) {
    if (previewLocation.line === lineNumber) {
      return (
        <div
          className={styles.CurrentExecutionPoint}
          data-test-name="CurrentExecutionPointLineHighlight"
        />
      );
    }
    return null;
  }

  const frameId = selectedPauseAndFrameId?.frameId || null;
  const pauseId = selectedPauseAndFrameId?.pauseId || null;

  if (pauseId !== null && frameId !== null) {
    const frames = getFramesSuspense(client, pauseId);
    if (frames) {
      const correspondingSourceIds = client.getCorrespondingSourceIds(sourceId);
      const selectedFrame = frames.find(frame => frame.frameId === frameId);
      if (selectedFrame) {
        if (
          selectedFrame.location.find(location => {
            if (correspondingSourceIds.includes(location.sourceId)) {
              const correspondingLocations = client.getCorrespondingLocations(location);
              return (
                correspondingLocations.findIndex(
                  correspondingLocation =>
                    correspondingLocation.line === lineNumber &&
                    correspondingLocation.sourceId === sourceId
                ) >= 0
              );
            }
          })
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
