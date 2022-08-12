import { SourceId } from "@replayio/protocol";
import { createContext, PropsWithChildren, useCallback, useMemo, useReducer } from "react";

type SourcesContextType = {
  closeSource: (sourceId: SourceId) => void;
  focusedSourceId: SourceId | null;
  openSource: (sourceId: SourceId) => void;
  openSourceIds: SourceId[];
};

export type OpenSourcesState = {
  focusedSourceId: SourceId | null;
  openSourceIds: SourceId[];
};

const INITIAL_STATE: OpenSourcesState = {
  focusedSourceId: null,
  openSourceIds: [],
};

type CloseSourceAction = { type: "close_source"; sourceId: SourceId };
type OpenSourceAction = { type: "open_source"; sourceId: SourceId };

type OpenSourcesAction = CloseSourceAction | OpenSourceAction;

function reducer(state: OpenSourcesState, action: OpenSourcesAction): OpenSourcesState {
  switch (action.type) {
    case "close_source": {
      const { sourceId } = action;
      const { focusedSourceId: prevFocusedSourceId, openSourceIds } = state;

      const index = openSourceIds.indexOf(sourceId);
      if (index > -1) {
        let focusedSourceId = prevFocusedSourceId;
        if (prevFocusedSourceId === sourceId) {
          if (index > 0) {
            focusedSourceId = openSourceIds[index - 1];
          } else if (index < openSourceIds.length - 1) {
            focusedSourceId = openSourceIds[index + 1];
          } else {
            focusedSourceId = null;
          }
        }

        return {
          focusedSourceId,
          openSourceIds: [...openSourceIds.slice(0, index), ...openSourceIds.slice(index + 1)],
        };
      } else {
        return state;
      }
    }
    case "open_source": {
      const { sourceId } = action;
      const { openSourceIds } = state;

      const index = openSourceIds.indexOf(sourceId);
      if (index === -1) {
        return {
          focusedSourceId: sourceId,
          openSourceIds: [...openSourceIds, sourceId],
        };
      } else {
        return {
          focusedSourceId: sourceId,
          openSourceIds,
        };
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

  const closeSource = useCallback((sourceId: SourceId) => {
    dispatch({ type: "close_source", sourceId });
  }, []);

  const openSource = useCallback((sourceId: SourceId) => {
    dispatch({ type: "open_source", sourceId });
  }, []);

  const context = useMemo<SourcesContextType>(
    () => ({
      ...state,
      closeSource,
      openSource,
    }),
    [closeSource, openSource, state]
  );

  return <SourcesContext.Provider value={context}>{children}</SourcesContext.Provider>;
}
