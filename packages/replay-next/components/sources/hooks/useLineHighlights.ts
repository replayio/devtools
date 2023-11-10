import { SourceId } from "@replayio/protocol";
import { useContext } from "react";
import { useImperativeCacheValue } from "suspense";

import { SelectedFrameContext } from "replay-next/src/contexts/SelectedFrameContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { SourceSearchContext } from "../SourceSearchContext";

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
  const { focusedSource } = useContext(SourcesContext);
  const { currentScopeId: searchSourceId } = sourceSearchState;
  const { frameId: selectedFrameId, pauseId: selectedPauseId } = selectedPauseAndFrameId ?? {};
  const { status: framesStatus, value: frames } = useImperativeCacheValue(
    framesCache,
    client,
    selectedPauseId
  );
  const {
    columnNumber: focusedColumnNumber,
    mode: focusedSourceMode,
    startLineIndex: focusedLineIndex,
    sourceId: focusedSourceId,
  } = focusedSource ?? {};
  const {
    column: previewColumnIndex,
    line: previewLineNumber,
    sourceId: previewSourceId,
  } = previewLocation ?? {};

  let executionPointLineHighlight: ExecutionPointLineHighlight | null = null;
  if (previewSourceId === focusedSourceId && previewLineNumber != null) {
    executionPointLineHighlight = {
      columnIndex: previewColumnIndex ?? 0,
      lineIndex: previewLineNumber - 1,
      type: "execution-point",
    };
  }
  if (selectedFrameId != null && selectedPauseId != null && framesStatus === "resolved" && frames) {
    const selectedFrame = frames.find(frame => frame.frameId === selectedFrameId);
    if (selectedFrame) {
      const location = selectedFrame.location.find(location => location.sourceId === sourceId);
      if (location) {
        executionPointLineHighlight = {
          columnIndex: location.column,
          lineIndex: location.line - 1,
          type: "execution-point",
        };
      }
    }
  }

  let searchResultLineHighlight: SearchResultLineHighlight | null = null;
  let viewSourceLineHighlight: ViewSourceLineHighlight | null = null;
  if (searchSourceId === sourceId && focusedLineIndex != null) {
    switch (focusedSourceMode) {
      case "search-result": {
        searchResultLineHighlight = {
          columnIndex: focusedColumnNumber != null ? focusedColumnNumber - 1 : 0,
          lineIndex: focusedLineIndex,
          type: "search-result",
        };
        break;
      }
      case "view-source": {
        viewSourceLineHighlight = {
          columnIndex: focusedColumnNumber != null ? focusedColumnNumber - 1 : 0,
          lineIndex: focusedLineIndex,
          type: "view-source",
        };
        break;
      }
    }
  }

  return {
    executionPointLineHighlight,
    searchResultLineHighlight,
    viewSourceLineHighlight,
  };
}
