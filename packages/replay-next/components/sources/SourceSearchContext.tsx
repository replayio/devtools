import { ReactNode, createContext, useContext, useEffect, useMemo } from "react";

import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { streamingSourceContentsCache } from "replay-next/src/suspense/SourcesCache";
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
  const { focusedSource, openSource } = useContext(SourcesContext);

  const focusedSourceId = focusedSource?.sourceId ?? null;

  const [state, dispatch] = useSourceSearch(result => {
    if (focusedSourceId != null && result != null) {
      // Update the highlighted line when the current search result changes.
      openSource(
        "search-result",
        focusedSourceId,
        result.lineIndex,
        result.lineIndex,
        result.columnIndex
      );
    }
  });

  const context = useMemo<SearchContextType>(() => [state, dispatch], [dispatch, state]);

  // Keep source search state in sync with the focused source.
  useEffect(() => {
    async function updateSourceContents(focusedSourceId: string | null, setScope: SetScope) {
      if (focusedSourceId) {
        const streaming = streamingSourceContentsCache.stream(client, focusedSourceId);
        if (!streaming.complete) {
          // It may take a while to stream this code, so update the search scope beforehand.
          setScope(focusedSourceId, "");
        }
        await streaming.resolver;
        setScope(focusedSourceId, streaming.value!);
      } else {
        setScope(null, "");
      }
    }

    updateSourceContents(focusedSourceId, dispatch.setScope);
  }, [client, dispatch.setScope, focusedSourceId]);

  return <SourceSearchContext.Provider value={context}>{children}</SourceSearchContext.Provider>;
}
