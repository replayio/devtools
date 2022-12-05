import { ReactNode, createContext, useContext, useEffect, useMemo } from "react";

import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getStreamingSourceContentsHelper } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useSourceSearch, { Actions, SetScope, State } from "./hooks/useSourceSearch";

export type SearchModifiers = {
  caseSensitive: boolean;
  regex: boolean;
  wholeWord: boolean;
};

export type SearchContextType = [State, Actions];

export const SourceSearchContext = createContext<SearchContextType>(null as any);

export function SourceSearchContextRoot({ children }: { children: ReactNode }) {
  const client = useContext(ReplayClientContext);
  const { focusedSource, openSource, setCurrentSearchResultLocation } = useContext(SourcesContext);

  const focusedSourceId = focusedSource?.sourceId ?? null;

  const [state, dispatch] = useSourceSearch(lineIndex => {
    if (focusedSourceId === null || lineIndex === null) {
      setCurrentSearchResultLocation(null);
      return;
    }

    // Update the highlighted line when the current search result changes.
    setCurrentSearchResultLocation({ sourceId: focusedSourceId, line: lineIndex + 1, column: 0 });
    openSource(focusedSourceId, lineIndex);
  });

  const context = useMemo<SearchContextType>(() => [state, dispatch], [dispatch, state]);

  // Keep source search state in sync with the focused source.
  useEffect(() => {
    async function updateSourceContents(focusedSourceId: string | null, setScope: SetScope) {
      if (focusedSourceId) {
        const { resolver } = await getStreamingSourceContentsHelper(client, focusedSourceId);
        const { contents: code } = await resolver;
        setScope(focusedSourceId, code || "");
      } else {
        setScope(null, "");
      }
    }

    updateSourceContents(focusedSourceId, dispatch.setScope);
  }, [client, dispatch.setScope, focusedSourceId]);

  return <SourceSearchContext.Provider value={context}>{children}</SourceSearchContext.Provider>;
}
