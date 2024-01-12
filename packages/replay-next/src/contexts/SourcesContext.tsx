import { SourceId, SourceLocation } from "@replayio/protocol";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useTransition,
} from "react";

import { bucketVisibleLines } from "replay-next/src/utils/source";
import { SourceLocationRange } from "shared/client/types";

export type FindClosestFunctionName = (sourceId: string, location: SourceLocation) => string | null;

export type FocusedSourceMode = "search-result" | "view-source";

export type FocusedSource = {
  columnNumber: number | null;
  endLineIndex: number | null;
  mode: FocusedSourceMode;
  sourceId: SourceId;
  startLineIndex: number | null;
};

type SourcesContextType = {
  closeSource: (sourceId: SourceId) => void;
  cursorColumnIndex: number | null;
  cursorLineIndex: number | null;
  focusedSource: FocusedSource | null;
  hoveredLineIndex: number | null;
  isPending: boolean;
  markPendingFocusUpdateProcessed: () => void;
  openSource: (
    mode: FocusedSourceMode,
    sourceId: SourceId,
    startLineIndex?: number,
    endLineIndex?: number,
    columnNumber?: number,
    callSelectLocation?: boolean
  ) => void;
  activeSourceIds: SourceId[];
  pendingFocusUpdate: boolean;
  setCursorLocation: (lineIndex: number | null, columnIndex: number | null) => void;
  setHoveredLocation: (lineIndex: number | null) => void;
  setVisibleLines: (startIndex: number | null, stopIndex: number | null) => void;
  findClosestFunctionName: FindClosestFunctionName;

  // Tracking which lines are currently visible in the editor enables queries to be scoped
  // in a way that reduces the work required by the backend to analyze large source files.
  // In order to avoid triggering too many updates though (e.g. while scrolling),
  // these lines are automatically batched into buckets of 100.
  visibleLines: SourceLocationRange | null;
  preferredGeneratedSourceIds: SourceId[];
};

export type OpenSourcesState = {
  cursorColumnIndex: number | null;
  cursorLineIndex: number | null;
  focusedSource: FocusedSource | null;
  hoveredLineIndex: number | null;
  activeSourceIds: SourceId[];
  pendingFocusUpdate: boolean;
  visibleLinesBySourceId: { [key: SourceId]: SourceLocationRange };
};

const INITIAL_STATE: OpenSourcesState = {
  cursorColumnIndex: null,
  cursorLineIndex: null,
  focusedSource: null,
  hoveredLineIndex: null,
  activeSourceIds: [],
  pendingFocusUpdate: false,
  visibleLinesBySourceId: {},
};

type CloseSourceAction = { type: "close_source"; sourceId: SourceId };
type MarkFocusUpdateProcessedActions = { type: "mark_focus_update_processed" };
type MarkSearchResultUpdateProcessedActions = { type: "mark_search_result_update_processed" };

type OpenSourceAction = {
  type: "open_source";
  focusedSource: FocusedSource;
};
type SetCursorLocationAction = {
  type: "set_cursor_location";
  columnIndex: number | null;
  lineIndex: number | null;
};
type SetHoveredLineAction = {
  type: "set_hovered_location";
  lineIndex: number | null;
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
  | SetCursorLocationAction
  | SetHoveredLineAction
  | SetVisibleLines;

function reducer(state: OpenSourcesState, action: OpenSourcesAction): OpenSourcesState {
  switch (action.type) {
    case "close_source": {
      const { sourceId } = action;
      const {
        cursorColumnIndex: prevCursorColumnIndex,
        cursorLineIndex: prevCursorLineIndex,
        focusedSource: prevFocusedSource,
        hoveredLineIndex: prevHoveredLine,
        activeSourceIds,
        visibleLinesBySourceId: prevVisibleLinesBySourceId,
      } = state;

      const index = activeSourceIds.indexOf(sourceId);
      if (index > -1) {
        let cursorColumnIndex = prevCursorColumnIndex;
        let cursorLineIndex = prevCursorLineIndex;
        let focusedSource = prevFocusedSource;
        let hoveredLineIndex = prevHoveredLine;
        if (prevFocusedSource?.sourceId === sourceId) {
          cursorColumnIndex = null;
          cursorLineIndex = null;
          focusedSource = null;
          hoveredLineIndex = null;

          if (index > 0) {
            focusedSource = {
              columnNumber: null,
              endLineIndex: null,
              mode: "view-source",
              sourceId: activeSourceIds[index - 1],
              startLineIndex: null,
            };
          } else if (index < activeSourceIds.length - 1) {
            focusedSource = {
              columnNumber: null,
              endLineIndex: null,
              mode: "view-source",
              sourceId: activeSourceIds[index + 1],
              startLineIndex: null,
            };
          }
        }

        const visibleLinesBySourceId = { ...prevVisibleLinesBySourceId };
        delete visibleLinesBySourceId[sourceId];

        return {
          ...state,
          cursorColumnIndex,
          cursorLineIndex,
          focusedSource,
          hoveredLineIndex,
          activeSourceIds: [
            ...activeSourceIds.slice(0, index),
            ...activeSourceIds.slice(index + 1),
          ],
          visibleLinesBySourceId,
        };
      } else {
        return state;
      }
    }
    case "open_source": {
      const { focusedSource } = action;

      const {
        cursorColumnIndex: prevCursorColumnIndex,
        cursorLineIndex: prevCursorLineIndex,
        focusedSource: prevFocusedSource,
        activeSourceIds: prevActiveSourceIds,
        pendingFocusUpdate: prevPendingFocusUpdate,
        visibleLinesBySourceId: prevVisibleLinesBySourceId,
      } = state;

      let cursorColumnIndex = prevCursorColumnIndex;
      let cursorLineIndex = prevCursorLineIndex;
      if (focusedSource?.sourceId !== prevFocusedSource?.sourceId) {
        cursorColumnIndex = null;
        cursorLineIndex = null;
      }

      if (focusedSource?.sourceId === prevFocusedSource?.sourceId) {
        // If sources are equal we may be able to bail out.
        if (
          focusedSource.startLineIndex === prevFocusedSource?.startLineIndex &&
          focusedSource.endLineIndex === prevFocusedSource?.endLineIndex &&
          focusedSource.columnNumber === prevFocusedSource?.columnNumber
        ) {
          // If the same line was specified (or no line) we may be able to bail out.
          if (prevPendingFocusUpdate) {
            // Only bail out if pendingFocusUpdate is also true;
            // This ensures we re-scroll to a focused line if the user has scrolled away.
            return state;
          }
        }
      }

      let activeSourceIds = prevActiveSourceIds;
      if (prevActiveSourceIds.indexOf(focusedSource.sourceId) === -1) {
        activeSourceIds = [...prevActiveSourceIds, focusedSource.sourceId];
      }

      return {
        ...state,
        cursorColumnIndex,
        cursorLineIndex,
        focusedSource,
        hoveredLineIndex: null,
        activeSourceIds,
        pendingFocusUpdate: true,
        visibleLinesBySourceId: prevVisibleLinesBySourceId,
      };
    }
    case "mark_focus_update_processed": {
      return {
        ...state,
        pendingFocusUpdate: false,
      };
    }
    case "set_cursor_location": {
      const { columnIndex, lineIndex } = action;
      const { cursorColumnIndex: prevCursorColumnIndex, cursorLineIndex: prevCursorLineIndex } =
        state;

      if (columnIndex === prevCursorColumnIndex && lineIndex === prevCursorLineIndex) {
        return state;
      } else {
        return {
          ...state,
          cursorColumnIndex: columnIndex,
          cursorLineIndex: lineIndex,
        };
      }
    }
    case "set_hovered_location": {
      const { lineIndex } = action;
      const { hoveredLineIndex: prevHoveredLineIndex } = state;

      if (lineIndex === prevHoveredLineIndex) {
        return state;
      } else {
        return {
          ...state,
          hoveredLineIndex: lineIndex,
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

      // We need to fetch hit counts as a user scrolls,
      // but naively fetching each line individually would result in a lot of requests,
      // so we batch requests up into chunks of 100 lines.
      let bucketedStartIndex = null;
      let bucketedStopIndex = null;
      if (startIndex !== null && stopIndex !== null) {
        const bucket = bucketVisibleLines(startIndex, stopIndex);
        bucketedStartIndex = bucket[0];
        bucketedStopIndex = bucket[1];
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

type PartialLocation = {
  column?: number | undefined;
  line?: number | undefined;
  sourceId: SourceId;
  sourceUrl?: string | undefined;
};
type SelectLocationFunction = (location: PartialLocation | null) => void;

const defaultFindClosestFunctionByName = () => null;
const defaultSelectLocation = () => {};

export type SourcesContextRootProps = PropsWithChildren<{
  findClosestFunctionName?: FindClosestFunctionName;
  selectLocation?: SelectLocationFunction;
  preferredGeneratedSourceIds?: SourceId[];
}>;

export function SourcesContextRoot({
  children,
  findClosestFunctionName = defaultFindClosestFunctionByName,
  selectLocation = defaultSelectLocation,
  preferredGeneratedSourceIds = [],
}: SourcesContextRootProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const [isPending, startTransition] = useTransition();

  const selectLocationRef = useRef<SelectLocationFunction>(selectLocation);
  useLayoutEffect(() => {
    selectLocationRef.current = selectLocation;
  });

  useLayoutEffect(() => {
    if (state.focusedSource === null) {
      const selectLocation = selectLocationRef.current;
      if (selectLocation) {
        selectLocation(null);
      }
    }
  }, [state.focusedSource]);

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

  const openSource = useCallback(
    (
      mode: FocusedSourceMode,
      sourceId: SourceId,
      startLineIndex: number | null = null,
      endLineIndex: number | null = null,
      columnNumber: number | null = null,
      callSelectLocation = true
    ) => {
      startTransition(() => {
        dispatch({
          type: "open_source",
          focusedSource: {
            columnNumber,
            endLineIndex,
            mode,
            sourceId,
            startLineIndex,
          },
        });

        const selectLocation = selectLocationRef.current;
        if (selectLocation && callSelectLocation) {
          selectLocation({
            line: startLineIndex !== null ? startLineIndex + 1 : undefined,
            sourceId,
          });
        }
      });
    },
    []
  );

  const setCursorLocation = useCallback((lineIndex: number | null, columnIndex: number | null) => {
    startTransition(() => {
      dispatch({ type: "set_cursor_location", columnIndex, lineIndex });
    });
  }, []);

  const setHoveredLocation = useCallback((lineIndex: number | null) => {
    startTransition(() => {
      dispatch({ type: "set_hovered_location", lineIndex });
    });
  }, []);

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
      cursorColumnIndex: state.cursorColumnIndex,
      cursorLineIndex: state.cursorLineIndex,
      focusedSource: state.focusedSource,
      hoveredLineIndex: state.hoveredLineIndex,
      activeSourceIds: state.activeSourceIds,
      pendingFocusUpdate: state.pendingFocusUpdate,
      visibleLines: state.focusedSource?.sourceId
        ? state.visibleLinesBySourceId[state.focusedSource?.sourceId] || null
        : null,

      closeSource,
      isPending,
      markPendingFocusUpdateProcessed,
      openSource,
      setCursorLocation,
      setHoveredLocation,
      setVisibleLines,
      findClosestFunctionName,
      preferredGeneratedSourceIds,
    }),
    [
      closeSource,
      isPending,
      markPendingFocusUpdateProcessed,
      openSource,
      setCursorLocation,
      setHoveredLocation,
      setVisibleLines,
      state,
      findClosestFunctionName,
      preferredGeneratedSourceIds,
    ]
  );

  return <SourcesContext.Provider value={context}>{children}</SourcesContext.Provider>;
}
