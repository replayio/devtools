import { SourcesContext } from "@bvaughn/src/contexts/SourcesContext";
import { getSourceContentsHelper } from "@bvaughn/src/suspense/SourcesCache";
import { createContext, ReactNode, useContext, useEffect, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useSourceSearch, { Actions, SetScope, State } from "./hooks/useSourceSearch";

export const SourceSearchContext = createContext<[State, Actions]>(null as any);

export function SourceSearchContextRoot({ children }: { children: ReactNode }) {
  const client = useContext(ReplayClientContext);
  const { focusedSourceId } = useContext(SourcesContext);

  const [state, actions] = useSourceSearch();

  const context = useMemo<[State, Actions]>(() => [state, actions], [state, actions]);

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

    updateSourceContents(focusedSourceId, actions.setScope);
  }, [client, actions, focusedSourceId]);

  return <SourceSearchContext.Provider value={context}>{children}</SourceSearchContext.Provider>;
}
