import { Location, SourceId, SourceLocation } from "@replayio/protocol";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useMemo,
  useReducer,
  useTransition,
} from "react";

import { SourceLocationRange } from "shared/client/types";

const VISIBLE_LINES_BUCKET_SIZE = 100;

export type FindClosestFunctionName = (sourceId: string, location: SourceLocation) => string | null;

export type FocusedSource = {
  endLineIndex: number | null;
  sourceId: SourceId;
  startLineIndex: number | null;
  type: "search-result" | "view-source";
};

type SourcesContextType = {
  closeSource: (sourceId: SourceId) => void;
  currentSearchResultLocation: Location | null;
  focusedSource: FocusedSource | null;
  hoveredLineIndex: number | null;
  hoveredLineNode: HTMLElement | null;
  isPending: boolean;
  markPendingFocusUpdateProcessed: () => void;
  openSource: (sourceId: SourceId, lineIndex?: number) => void;
  openSourceIds: SourceId[];
  pendingFocusUpdate: boolean;
  setCurrentSearchResultLocation: (location: Location | null) => void;
  setHoveredLocation: (lineIndex: number | null, lineNode: HTMLElement | null) => void;
  setVisibleLines: (startIndex: number | null, stopIndex: number | null) => void;
  findClosestFunctionName: FindClosestFunctionName;

  // Tracking which lines are currently visible in the editor enables queries to be scoped
  // in a way that reduces the work required by the backend to analyze large source files.
  // In order to avoid triggering too many updates though (e.g. while scrolling),
  // these lines are automatically batched into buckets of 100.
  visibleLines: SourceLocationRange | null;
};

export type OpenSourcesState = {
  currentSearchResultLocation: Location | null;
  focusedSource: FocusedSource | null;
  hoveredLineIndex: number | null;
  hoveredLineNode: HTMLElement | null;
  openSourceIds: SourceId[];
  pendingFocusUpdate: boolean;
  visibleLinesBySourceId: { [key: SourceId]: SourceLocationRange };
};

const INITIAL_STATE: OpenSourcesState = {
  currentSearchResultLocation: null,
  focusedSource: null,
  hoveredLineIndex: null,
  hoveredLineNode: null,
  openSourceIds: [],
  pendingFocusUpdate: false,
  visibleLinesBySourceId: {},
};

type CloseSourceAction = { type: "close_source"; sourceId: SourceId };
type MarkFocusUpdateProcessedActions = { type: "mark_focus_update_processed" };
type MarkSearchResultUpdateProcessedActions = { type: "mark_search_result_update_processed" };
type OpenSourceAction = { type: "open_source"; sourceId: SourceId; lineIndex: number | null };
type SetCurrentSearchResultLocationAction = {
  type: "set_current_search_result_location";
  location: Location | null;
};
type SetHoveredLineAction = {
  type: "set_hovered_location";
  lineIndex: number | null;
  lineNode: HTMLElement | null;
};
type SetVisibleLines = {
  type: "set_visible_lines";
  startIndex: number | null;
  stopIndex: number | null;
};

type OpenSourcesAction =
  | CloseSourceAction
  | MarkFocusUpdateProcessedActions
  | MarkSearchResultUpdateProcessedActions
  | OpenSourceAction
  | SetCurrentSearchResultLocationAction
  | SetHoveredLineAction
  | SetVisibleLines;

function reducer(state: OpenSourcesState, action: OpenSourcesAction): OpenSourcesState {
  switch (action.type) {
    case "close_source": {
      const { sourceId } = action;
      const {
        focusedSource: prevFocusedSource,
        hoveredLineIndex: prevHoveredLine,
        hoveredLineNode: prevHoveredLineNode,
        openSourceIds,
        visibleLinesBySourceId: prevVisibleLinesBySourceId,
      } = state;

      const index = openSourceIds.indexOf(sourceId);
      if (index > -1) {
        let focusedSource = prevFocusedSource;
        let hoveredLineIndex = prevHoveredLine;
        let hoveredLineNode = prevHoveredLineNode;
        if (prevFocusedSource?.sourceId === sourceId) {
          focusedSource = null;
          hoveredLineIndex = null;
          hoveredLineNode = null;

          if (index > 0) {
            focusedSource = {
              endLineIndex: null,
              sourceId: openSourceIds[index - 1],
              startLineIndex: null,
              type: "view-source",
            };
          } else if (index < openSourceIds.length - 1) {
            focusedSource = {
              endLineIndex: null,
              sourceId: openSourceIds[index + 1],
              startLineIndex: null,
              type: "view-source",
            };
          }
        }

        const visibleLinesBySourceId = { ...prevVisibleLinesBySourceId };
        delete visibleLinesBySourceId[sourceId];

        return {
          ...state,
          focusedSource,
          hoveredLineIndex,
          hoveredLineNode,
          openSourceIds: [...openSourceIds.slice(0, index), ...openSourceIds.slice(index + 1)],
          visibleLinesBySourceId,
        };
      } else {
        return state;
      }
    }
    case "mark_focus_update_processed": {
      return {
        ...state,
        pendingFocusUpdate: false,
      };
    }
    case "open_source": {
      // TODO [FE-1009] Support focused line range and type
      const { lineIndex, sourceId } = action;
      const startLineIndex = lineIndex ?? null;
      const endLineIndex = lineIndex ?? null;
      const type = "view-source";

      const {
        focusedSource: prevFocusedSource,
        openSourceIds: prevOpenSourceIds,
        pendingFocusUpdate: prevPendingFocusUpdate,
        visibleLinesBySourceId: prevVisibleLinesBySourceId,
      } = state;

      if (sourceId === prevFocusedSource?.sourceId) {
        // If sources are equal we may be able to bail out.
        if (
          lineIndex === null ||
          (startLineIndex === prevFocusedSource?.startLineIndex &&
            endLineIndex === prevFocusedSource?.endLineIndex)
        ) {
          // If the same line was specified (or no line) we may be able to bail out.
          if (prevPendingFocusUpdate) {
            // Only bail out if pendingFocusUpdate is also true;
            // This ensures we re-scroll to a focused line if the user has scrolled away.
            return state;
          }
        }
      }

      let openSourceIds = prevOpenSourceIds;
      if (prevOpenSourceIds.indexOf(sourceId) === -1) {
        openSourceIds = [...prevOpenSourceIds, sourceId];
      }

      return {
        ...state,
        focusedSource: {
          endLineIndex,
          sourceId,
          startLineIndex,
          type,
        },
        hoveredLineIndex: null,
        hoveredLineNode: null,
        openSourceIds,
        pendingFocusUpdate: true,
        visibleLinesBySourceId: prevVisibleLinesBySourceId,
      };
    }
    case "set_current_search_result_location": {
      // TODO [FE-1009] Replace with focusedSource
      const { location } = action;
      const { currentSearchResultLocation: prevCurrentSearchResultLocation } = state;
      if (prevCurrentSearchResultLocation === location) {
        return state;
      } else {
        return {
          ...state,
          currentSearchResultLocation: location,
        };
      }
      break;
    }
    case "set_hovered_location": {
      const { lineIndex, lineNode } = action;
      const { hoveredLineIndex: prevHoveredLineIndex, hoveredLineNode: prevHoveredLineNode } =
        state;

      if (lineIndex === prevHoveredLineIndex && lineNode === prevHoveredLineNode) {
        return state;
      } else {
        return {
          ...state,
          hoveredLineIndex: lineIndex,
          hoveredLineNode: lineNode,
        };
      }
    }
    case "set_visible_lines": {
      const { startIndex, stopIndex } = action;
      const { focusedSource, visibleLinesBySourceId: prevVisibleLinesBySourceId } = state;

      if (focusedSource === null) {
        return state;
      }

      let prevStartIndex = null;
      let prevStopIndex = null;
      const prevVisibleLines = prevVisibleLinesBySourceId[focusedSource.sourceId];
      if (prevVisibleLines != null) {
        prevStartIndex = prevVisibleLines.start.line;
        prevStopIndex = prevVisibleLines.start.line;
      }

      // Automatically bucket lines to avoid triggering too many updates.
      let bucketedStartIndex = null;
      let bucketedStopIndex = null;
      if (startIndex !== null && stopIndex !== null) {
        const startBucket = Math.floor(startIndex / VISIBLE_LINES_BUCKET_SIZE);
        const stopBucket = Math.floor(stopIndex / VISIBLE_LINES_BUCKET_SIZE) + 1;

        bucketedStartIndex = startBucket * VISIBLE_LINES_BUCKET_SIZE;
        bucketedStopIndex = stopBucket * VISIBLE_LINES_BUCKET_SIZE - 1;
      }

      if (prevStartIndex === bucketedStartIndex && prevStopIndex === bucketedStopIndex) {
        return state;
      } else {
        if (bucketedStartIndex === null || bucketedStopIndex === null) {
          return state;
        } else {
          return {
            ...state,
            visibleLinesBySourceId: {
              ...prevVisibleLinesBySourceId,
              [focusedSource.sourceId]: {
                start: {
                  line: bucketedStartIndex,
                  column: 0,
                },
                end: {
                  line: bucketedStopIndex,
                  column: Number.MAX_SAFE_INTEGER,
                },
              },
            },
          };
        }
      }
    }
    default: {
      throw new Error("unknown Accordion action");
    }
  }
}

export const SourcesContext = createContext<SourcesContextType>(null as any);

const defaultFindClosestFunctionByName = () => null;

export type SourcesContextRootProps = PropsWithChildren<{
  findClosestFunctionName?: FindClosestFunctionName;
}>;

export function SourcesContextRoot({
  children,
  findClosestFunctionName = defaultFindClosestFunctionByName,
}: SourcesContextRootProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const [isPending, startTransition] = useTransition();

  const closeSource = useCallback((sourceId: SourceId) => {
    startTransition(() => {
      dispatch({ type: "close_source", sourceId });
    });
  }, []);

  const markPendingFocusUpdateProcessed = useCallback(() => {
    startTransition(() => {
      dispatch({ type: "mark_focus_update_processed" });
    });
  }, []);

  const openSource = useCallback((sourceId: SourceId, lineIndex: number | undefined) => {
    startTransition(() => {
      dispatch({
        type: "open_source",
        lineIndex: lineIndex === undefined ? null : lineIndex,
        sourceId,
      });
    });
  }, []);

  const setCurrentSearchResultLocation = useCallback((location: Location | null) => {
    startTransition(() => {
      dispatch({ type: "set_current_search_result_location", location });
    });
  }, []);

  const setHoveredLocation = useCallback(
    (lineIndex: number | null, lineNode: HTMLElement | null) => {
      startTransition(() => {
        dispatch({ type: "set_hovered_location", lineIndex, lineNode });
      });
    },
    []
  );

  const setVisibleLines = useCallback((startIndex: number | null, stopIndex: number | null) => {
    startTransition(() => {
      dispatch({
        type: "set_visible_lines",
        startIndex,
        stopIndex,
      });
    });
  }, []);

  const context = useMemo<SourcesContextType>(
    () => ({
      currentSearchResultLocation: state.currentSearchResultLocation,
      focusedSource: state.focusedSource,
      hoveredLineIndex: state.hoveredLineIndex,
      hoveredLineNode: state.hoveredLineNode,
      openSourceIds: state.openSourceIds,
      pendingFocusUpdate: state.pendingFocusUpdate,
      visibleLines: state.focusedSource?.sourceId
        ? state.visibleLinesBySourceId[state.focusedSource?.sourceId] || null
        : null,

      closeSource,
      isPending,
      markPendingFocusUpdateProcessed,
      openSource,
      setCurrentSearchResultLocation,
      setHoveredLocation,
      setVisibleLines,
      findClosestFunctionName,
    }),
    [
      closeSource,
      isPending,
      markPendingFocusUpdateProcessed,
      openSource,
      setCurrentSearchResultLocation,
      setHoveredLocation,
      setVisibleLines,
      state,
      findClosestFunctionName,
    ]
  );

  return <SourcesContext.Provider value={context}>{children}</SourcesContext.Provider>;
}
