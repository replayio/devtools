import { SourceId } from "@replayio/protocol";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useMemo,
  useReducer,
  useTransition,
} from "react";
import { SourceLocationRange } from "shared/client/types";

const VISIBLE_LINES_BUCKET_SIZE = 100;

type SourcesContextType = {
  closeSource: (sourceId: SourceId) => void;
  focusedSourceId: SourceId | null;
  hoveredLineIndex: number | null;
  hoveredLineNode: HTMLElement | null;
  isPending: boolean;
  openSource: (sourceId: SourceId) => void;
  openSourceIds: SourceId[];
  setHoveredLocation: (lineIndex: number | null, lineNode: HTMLElement | null) => void;
  setVisibleLines: (startIndex: number | null, stopIndex: number | null) => void;

  // Tracking which lines are currently visible in the editor enables queries to be scoped
  // in a way that reduces the work required by the backend to analyze large source files.
  // In order to avoid triggering too many updates though (e.g. while scrolling),
  // these lines are automatically batched into buckets of 100.
  visibleLines: SourceLocationRange | null;
};

export type OpenSourcesState = {
  focusedSourceId: SourceId | null;
  hoveredLineIndex: number | null;
  hoveredLineNode: HTMLElement | null;
  openSourceIds: SourceId[];
  visibleLinesBySourceId: { [key: SourceId]: SourceLocationRange };
};

const INITIAL_STATE: OpenSourcesState = {
  focusedSourceId: null,
  hoveredLineIndex: null,
  hoveredLineNode: null,
  openSourceIds: [],
  visibleLinesBySourceId: {},
};

type CloseSourceAction = { type: "close_source"; sourceId: SourceId };
type OpenSourceAction = { type: "open_source"; sourceId: SourceId };
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
  | OpenSourceAction
  | SetHoveredLineAction
  | SetVisibleLines;

function reducer(state: OpenSourcesState, action: OpenSourcesAction): OpenSourcesState {
  switch (action.type) {
    case "close_source": {
      const { sourceId } = action;
      const {
        focusedSourceId: prevFocusedSourceId,
        hoveredLineIndex: prevHoveredLine,
        hoveredLineNode: prevHoveredLineNode,
        openSourceIds,
        visibleLinesBySourceId: prevVisibleLinesBySourceId,
      } = state;

      const index = openSourceIds.indexOf(sourceId);
      if (index > -1) {
        let focusedSourceId = prevFocusedSourceId;
        let hoveredLineIndex = prevHoveredLine;
        let hoveredLineNode = prevHoveredLineNode;
        if (prevFocusedSourceId === sourceId) {
          hoveredLineIndex = null;
          hoveredLineNode = null;

          if (index > 0) {
            focusedSourceId = openSourceIds[index - 1];
          } else if (index < openSourceIds.length - 1) {
            focusedSourceId = openSourceIds[index + 1];
          } else {
            focusedSourceId = null;
          }
        }

        const visibleLinesBySourceId = { ...prevVisibleLinesBySourceId };
        delete visibleLinesBySourceId[sourceId];

        return {
          focusedSourceId,
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
      const { sourceId } = action;
      const {
        focusedSourceId: prevFocusedSourceId,
        openSourceIds: prevOpenSourceIds,
        visibleLinesBySourceId: prevVisibleLinesBySourceId,
      } = state;

      if (sourceId === prevFocusedSourceId) {
        return state;
      }

      let openSourceIds = prevOpenSourceIds;
      if (prevOpenSourceIds.indexOf(sourceId) === -1) {
        openSourceIds = [...prevOpenSourceIds, sourceId];
      }

      return {
        focusedSourceId: sourceId,
        hoveredLineIndex: null,
        hoveredLineNode: null,
        openSourceIds,
        visibleLinesBySourceId: prevVisibleLinesBySourceId,
      };
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
      const { focusedSourceId, visibleLinesBySourceId: prevVisibleLinesBySourceId } = state;

      if (focusedSourceId === null) {
        return state;
      }

      let prevStartIndex = null;
      let prevStopIndex = null;
      const prevVisibleLines = prevVisibleLinesBySourceId[focusedSourceId];
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
              [focusedSourceId]: {
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

export function SourcesContextRoot({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const [isPending, startTransition] = useTransition();

  const closeSource = useCallback((sourceId: SourceId) => {
    startTransition(() => {
      dispatch({ type: "close_source", sourceId });
    });
  }, []);

  const openSource = useCallback((sourceId: SourceId) => {
    startTransition(() => {
      dispatch({ type: "open_source", sourceId });
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
      focusedSourceId: state.focusedSourceId,
      hoveredLineIndex: state.hoveredLineIndex,
      hoveredLineNode: state.hoveredLineNode,
      openSourceIds: state.openSourceIds,
      visibleLines: state.focusedSourceId
        ? state.visibleLinesBySourceId[state.focusedSourceId] || null
        : null,

      closeSource,
      isPending,
      openSource,
      setHoveredLocation,
      setVisibleLines,
    }),
    [closeSource, isPending, openSource, setHoveredLocation, setVisibleLines, state]
  );

  return <SourcesContext.Provider value={context}>{children}</SourcesContext.Provider>;
}
