import { SourceId } from "@replayio/protocol";
import { Suspense, memo, useContext } from "react";

import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { getFramesSuspense } from "replay-next/src/suspense/FrameCache";
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
  const { focusedSource } = useContext(SourcesContext);

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

  if (focusedSource !== null) {
    const { endLineIndex, mode, startLineIndex, sourceId } = focusedSource;

    if (endLineIndex !== null && startLineIndex !== null) {
      const lineIndex = lineNumber - 1;

      if (
        sourceId === sourceSearchState.currentScopeId &&
        lineIndex <= endLineIndex &&
        lineIndex >= startLineIndex
      ) {
        switch (mode) {
          case "search-result": {
            return (
              <div
                className={styles.CurrentSearchResult}
                data-test-name="CurrentSearchResultHighlight"
              />
            );
          }
          case "view-source": {
            return (
              <div className={styles.ViewSourceHighlight} data-test-name="ViewSourceHighlight" />
            );
          }
        }
      }
    }
  }

  return null;
}
