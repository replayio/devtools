import { SourcesContext } from "@bvaughn/src/contexts/SourcesContext";
import { getSourceContentsHelper } from "@bvaughn/src/suspense/SourcesCache";
import { createContext, ReactNode, useContext, useEffect, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useSourceSearch, { Actions, State } from "./hooks/useSourceSearch";

export const SourceSearchContext = createContext<[State, Actions]>(null as any);

export function SourceSearchContextRoot({ children }: { children: ReactNode }) {
  const client = useContext(ReplayClientContext);
  const { focusedSourceId } = useContext(SourcesContext);

  const [state, actions] = useSourceSearch();

  const context = useMemo<[State, Actions]>(() => [state, actions], [state, actions]);

  // Keep source search state in sync with the focused source.
  useEffect(() => {
    async function updateSourceContents(
      focusedSourceId: string | null,
      setCode: (code: string) => void
    ) {
      if (focusedSourceId) {
        const { contents: code } = await getSourceContentsHelper(client, focusedSourceId);
        setCode(code);
      } else {
        setCode("");
      }
    }

    updateSourceContents(focusedSourceId, actions.setCode);
  }, [client, actions, focusedSourceId]);

  return <SourceSearchContext.Provider value={context}>{children}</SourceSearchContext.Provider>;
}
