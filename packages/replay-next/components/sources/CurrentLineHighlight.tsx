import { Frame, SourceId } from "@replayio/protocol";
import { Suspense, memo, useContext } from "react";

import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { framesCache, topFrameCache } from "replay-next/src/suspense/FrameCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import {
  getCorrespondingLocations,
  getCorrespondingSourceIds,
} from "replay-next/src/utils/sources";
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
    let showHighlight = false;
    // The 95% use case is that we'll be in the top frame. Start by fetching that.
    const topFrame = topFrameCache.read(client, pauseId);

    if (topFrame) {
      // Assuming there's at least a top frame, we can now see _which_ frame we're paused in.

      let selectedFrame: Frame | undefined = topFrame;
      if (selectedFrame?.frameId !== frameId) {
        // We must not be paused in the top frame. Get _all_ frames and find a match.
        // This is a more expensive request, so only fetch all frames if we have to.
        const allFrames = framesCache.read(client, pauseId);
        selectedFrame = allFrames?.find(frame => frame.frameId === frameId);
      }

      const sources = sourcesByIdCache.read(client);
      const correspondingSourceIds = getCorrespondingSourceIds(sources, sourceId);

      // Assuming we found a frame, check to see if there's a matching location for the frame.
      // If so, we should show the highlight line.
      showHighlight = !!selectedFrame?.location.find(location => {
        if (correspondingSourceIds.includes(location.sourceId)) {
          const correspondingLocations = getCorrespondingLocations(sources, location);
          return (
            correspondingLocations.findIndex(
              correspondingLocation =>
                correspondingLocation.line === lineNumber &&
                correspondingLocation.sourceId === sourceId
            ) >= 0
          );
        }
      });
    }

    if (showHighlight) {
      return (
        <div
          className={styles.CurrentExecutionPoint}
          data-test-name="CurrentExecutionPointLineHighlight"
        />
      );
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
