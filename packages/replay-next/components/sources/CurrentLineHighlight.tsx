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
  breakableColumnIndices: number[];
  lineNumber: number;
  plainText: string | null;
  showBreakpointMarkers: boolean;
  sourceId: SourceId;
};

export default memo(function CurrentLineHighlight(props: Props) {
  return (
    <Suspense>
      <CurrentLineHighlightSuspends {...props} />
    </Suspense>
  );
});

function CurrentLineHighlightSuspends({
  breakableColumnIndices,
  lineNumber,
  plainText,
  showBreakpointMarkers,
  sourceId,
}: Props) {
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
          data-test-type="preview-location"
        />
      );
    }
    return null;
  }

  const frameId = selectedPauseAndFrameId?.frameId || null;
  const pauseId = selectedPauseAndFrameId?.pauseId || null;

  if (pauseId !== null && frameId !== null) {
    let highlightColumnBegin = -1;
    let highlightColumnEnd = -1;
    let columnBreakpointIndex = -1;

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
      const match = selectedFrame?.location.find(location => {
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
      if (match != null) {
        highlightColumnBegin = match.column;

        columnBreakpointIndex = breakableColumnIndices.findIndex(
          column => column === highlightColumnBegin
        );
        if (columnBreakpointIndex >= 0) {
          if (columnBreakpointIndex < breakableColumnIndices.length - 1) {
            highlightColumnEnd = breakableColumnIndices[columnBreakpointIndex + 1] - 1;
          } else if (plainText !== null) {
            highlightColumnEnd = plainText.length - 1;
          }
        }
      }
    }

    if (highlightColumnBegin > 0 && highlightColumnEnd > 0) {
      return (
        <div
          className={styles.CurrentExecutionPoint}
          data-test-name="CurrentExecutionPointLineHighlight"
          data-test-type="view-source"
        >
          <div
            className={styles.CurrentExecutionPointColumn}
            style={{
              // @ts-ignore
              ["--highlight-char-offset"]: `${highlightColumnBegin}ch`,
              ["--highlight-char-length"]: `${highlightColumnEnd - highlightColumnBegin}ch`,
              ["--highlight-num-breakpoint-toggles"]: showBreakpointMarkers
                ? columnBreakpointIndex + 1
                : 0,
            }}
          />
        </div>
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
                data-test-type="search-result"
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
