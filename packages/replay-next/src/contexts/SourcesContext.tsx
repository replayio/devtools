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

import { SourceLocationRange } from "shared/client/types";

const VISIBLE_LINES_BUCKET_SIZE = 100;

export type FindClosestFunctionName = (sourceId: string, location: SourceLocation) => string | null;

export type FocusedSourceMode = "search-result" | "view-source";

export type FocusedSource = {
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
  hoveredLineNode: HTMLElement | null;
  isPending: boolean;
  markPendingFocusUpdateProcessed: () => void;
  openSource: (
    mode: FocusedSourceMode,
    sourceId: SourceId,
    startLineIndex?: number,
    endLineIndex?: number
  ) => void;
  openSourceIds: SourceId[];
  pendingFocusUpdate: boolean;
  setCursorLocation: (lineIndex: number | null, columnIndex: number | null) => void;
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
  cursorColumnIndex: number | null;
  cursorLineIndex: number | null;
  focusedSource: FocusedSource | null;
  hoveredLineIndex: number | null;
  hoveredLineNode: HTMLElement | null;
  openSourceIds: SourceId[];
  pendingFocusUpdate: boolean;
  visibleLinesBySourceId: { [key: SourceId]: SourceLocationRange };
};

const INITIAL_STATE: OpenSourcesState = {
  cursorColumnIndex: null,
  cursorLineIndex: null,
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
        hoveredLineNode: prevHoveredLineNode,
        openSourceIds,
        visibleLinesBySourceId: prevVisibleLinesBySourceId,
      } = state;

      const index = openSourceIds.indexOf(sourceId);
      if (index > -1) {
        let cursorColumnIndex = prevCursorColumnIndex;
        let cursorLineIndex = prevCursorLineIndex;
        let focusedSource = prevFocusedSource;
        let hoveredLineIndex = prevHoveredLine;
        let hoveredLineNode = prevHoveredLineNode;
        if (prevFocusedSource?.sourceId === sourceId) {
          cursorColumnIndex = null;
          cursorLineIndex = null;
          focusedSource = null;
          hoveredLineIndex = null;
          hoveredLineNode = null;

          if (index > 0) {
            focusedSource = {
              endLineIndex: null,
              mode: "view-source",
              sourceId: openSourceIds[index - 1],
              startLineIndex: null,
            };
          } else if (index < openSourceIds.length - 1) {
            focusedSource = {
              endLineIndex: null,
              mode: "view-source",
              sourceId: openSourceIds[index + 1],
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
          hoveredLineNode,
          openSourceIds: [...openSourceIds.slice(0, index), ...openSourceIds.slice(index + 1)],
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
        openSourceIds: prevOpenSourceIds,
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
          focusedSource.endLineIndex === prevFocusedSource?.endLineIndex
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
      if (prevOpenSourceIds.indexOf(focusedSource.sourceId) === -1) {
        openSourceIds = [...prevOpenSourceIds, focusedSource.sourceId];
      }

      return {
        ...state,
        cursorColumnIndex,
        cursorLineIndex,
        focusedSource,
        hoveredLineIndex: null,
        hoveredLineNode: null,
        openSourceIds,
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
}>;

export function SourcesContextRoot({
  children,
  findClosestFunctionName = defaultFindClosestFunctionByName,
  selectLocation = defaultSelectLocation,
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
      endLineIndex: number | null = null
    ) => {
      startTransition(() => {
        dispatch({
          type: "open_source",
          focusedSource: {
            endLineIndex,
            mode,
            sourceId,
            startLineIndex,
          },
        });

        const selectLocation = selectLocationRef.current;
        if (selectLocation) {
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
      cursorColumnIndex: state.cursorColumnIndex,
      cursorLineIndex: state.cursorLineIndex,
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
      setCursorLocation,
      setHoveredLocation,
      setVisibleLines,
      findClosestFunctionName,
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
    ]
  );

  return <SourcesContext.Provider value={context}>{children}</SourcesContext.Provider>;
}
