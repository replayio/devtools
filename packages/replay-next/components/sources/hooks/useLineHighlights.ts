import { Frame, SourceId } from "@replayio/protocol";
import { useContext, useEffect, useState } from "react";

import { SourceSearchContext } from "replay-next/components/sources/SourceSearchContext";
import { SelectedFrameContext } from "replay-next/src/contexts/SelectedFrameContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { framesCache, topFrameCache } from "replay-next/src/suspense/FrameCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import {
  getCorrespondingLocations,
  getCorrespondingSourceIds,
} from "replay-next/src/utils/sources";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

export type ExecutionPointLineHighlight = {
  columnIndex: number;
  lineIndex: number;
  type: "execution-point";
};
export type SearchResultLineHighlight = {
  columnIndex: number;
  lineIndex: number;
  type: "search-result";
};
export type ViewSourceLineHighlight = {
  columnIndex: number;
  lineIndex: number;
  type: "view-source";
};
export type LineHighlight =
  | ExecutionPointLineHighlight
  | SearchResultLineHighlight
  | ViewSourceLineHighlight;

export function useLineHighlights(sourceId: SourceId): {
  executionPointLineHighlight: ExecutionPointLineHighlight | null;
  searchResultLineHighlight: SearchResultLineHighlight | null;
  viewSourceLineHighlight: ViewSourceLineHighlight | null;
} {
  const client = useContext(ReplayClientContext);
  const [sourceSearchState] = useContext(SourceSearchContext);
  const { selectedPauseAndFrameId, previewLocation } = useContext(SelectedFrameContext);
  const { focusedSource, visibleLines } = useContext(SourcesContext);

  const [executionPointLineHighlight, setExecutionPointLineHighlight] =
    useState<ExecutionPointLineHighlight | null>(null);
  const [searchResultLineHighlight, setSearchResultLineHighlight] =
    useState<SearchResultLineHighlight | null>(null);
  const [viewSourceLineHighlight, setViewSourceLineHighlight] =
    useState<ViewSourceLineHighlight | null>(null);

  // Destructure effect dependencies
  const { currentScopeId: searchSourceId } = sourceSearchState;
  const { frameId: selectedFrameId, pauseId: selectedPauseId } = selectedPauseAndFrameId ?? {};
  const visibleLineIndexStart = visibleLines?.start.line ?? null;
  const visibleLineIndexEnd = visibleLines?.end.line ?? null;
  const {
    columnNumber: focusedColumnNumber,
    startLineIndex: focusedLineIndex,
    sourceId: focusedSourceId,
  } = focusedSource ?? {};
  const {
    column: previewColumnIndex,
    line: previewLineNumber,
    sourceId: previewSourceId,
  } = previewLocation ?? {};

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      if (
        visibleLineIndexEnd == null ||
        visibleLineIndexStart == null ||
        focusedSourceId != sourceId
      ) {
        setExecutionPointLineHighlight(null);
        setSearchResultLineHighlight(null);
        setViewSourceLineHighlight(null);
        return;
      }

      if (previewSourceId === focusedSourceId && previewLineNumber != null) {
        setExecutionPointLineHighlight({
          columnIndex: previewColumnIndex ?? 0,
          lineIndex: previewLineNumber - 1,
          type: "execution-point",
        });
      }

      if (selectedFrameId != null && selectedPauseId != null) {
        // The 95% use case is that we'll be in the top frame. Start by fetching that.
        const topFrame = await topFrameCache.readAsync(client, selectedPauseId);
        if (abortController.signal.aborted) {
          return;
        }

        if (topFrame) {
          // Assuming there's at least a top frame, we can now see _which_ frame we're paused in.
          let selectedFrame: Frame | undefined = topFrame;
          if (selectedFrame?.frameId !== selectedFrameId) {
            // We must not be paused in the top frame. Get _all_ frames and find a match.
            // This is a more expensive request, so only fetch all frames if we have to.
            const allFrames = await framesCache.readAsync(client, selectedPauseId);
            if (abortController.signal.aborted) {
              return;
            }

            selectedFrame = allFrames?.find(frame => frame.frameId === selectedFrameId);
          }

          const sources = await sourcesByIdCache.readAsync(client);
          if (abortController.signal.aborted) {
            return;
          }

          const correspondingSourceIds = getCorrespondingSourceIds(sources, sourceId);

          // Assuming we found a frame, check to see if there's a matching location for the frame.
          // If so, we should show the highlight line.
          const frame = selectedFrame?.location.find(location => {
            if (correspondingSourceIds.includes(location.sourceId)) {
              const correspondingLocations = getCorrespondingLocations(sources, location);
              return (
                correspondingLocations.findIndex(
                  correspondingLocation =>
                    correspondingLocation.line >= visibleLineIndexStart &&
                    correspondingLocation.line <= visibleLineIndexEnd &&
                    correspondingLocation.sourceId === sourceId
                ) >= 0
              );
            }
          });

          if (frame) {
            setExecutionPointLineHighlight({
              columnIndex: frame.column,
              lineIndex: frame.line - 1,
              type: "execution-point",
            });
          }
        }
      }

      if (searchSourceId === sourceId && focusedLineIndex != null) {
        // TODO Search result?
        setViewSourceLineHighlight({
          columnIndex: focusedColumnNumber != null ? focusedColumnNumber - 1 : 0,
          lineIndex: focusedLineIndex,
          type: "view-source",
        });
      }
    }

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [
    client,
    focusedColumnNumber,
    focusedLineIndex,
    focusedSourceId,
    previewColumnIndex,
    previewLineNumber,
    previewSourceId,
    searchSourceId,
    selectedFrameId,
    selectedPauseId,
    sourceId,
    visibleLineIndexEnd,
    visibleLineIndexStart,
  ]);

  return {
    executionPointLineHighlight,
    searchResultLineHighlight,
    viewSourceLineHighlight,
  };
}
