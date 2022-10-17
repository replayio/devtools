import { getSourcesHelper } from "@bvaughn/src/suspense/SourcesCache";
import { newSource as ProtocolSource } from "@replayio/protocol";
import { createContext, ReactNode, useContext, useEffect, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useSourceFileNameSearch, { Actions, State } from "./hooks/useSourceFileNameSearch";

export const SourceFileNameSearchContext = createContext<[State, Actions]>(null as any);

export function SourceFileNameSearchContextRoot({ children }: { children: ReactNode }) {
  const client = useContext(ReplayClientContext);

  const [state, actions] = useSourceFileNameSearch();

  const context = useMemo<[State, Actions]>(() => [state, actions], [state, actions]);

  // Keep source search state in sync with the focused source.
  useEffect(() => {
    async function updateSources(setSources: (sources: ProtocolSource[]) => void) {
      const sources = await getSourcesHelper(client);
      setSources(sources);
    }

    updateSources(actions.setSources);
  }, [client, actions]);

  return (
    <SourceFileNameSearchContext.Provider value={context}>
      {children}
    </SourceFileNameSearchContext.Provider>
  );
}
