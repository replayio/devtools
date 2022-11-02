import { ReactNode, createContext, useContext, useEffect, useMemo } from "react";

import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getSourceContentsHelper } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
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
  const { focusedSourceId } = useContext(SourcesContext);

  const [state, dispatch] = useSourceSearch();

  const context = useMemo<SearchContextType>(() => [state, dispatch], [dispatch, state]);

  // Keep source search state in sync with the focused source.
  useEffect(() => {
    async function updateSourceContents(focusedSourceId: string | null, setScope: SetScope) {
      if (focusedSourceId) {
        const { contents: code } = await getSourceContentsHelper(client, focusedSourceId);
        setScope(focusedSourceId, code);
      } else {
        setScope(null, "");
      }
    }

    updateSourceContents(focusedSourceId, dispatch.setScope);
  }, [client, dispatch.setScope, focusedSourceId]);

  return <SourceSearchContext.Provider value={context}>{children}</SourceSearchContext.Provider>;
}
