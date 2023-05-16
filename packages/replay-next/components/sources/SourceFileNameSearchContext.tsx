import { ReactNode, createContext, useContext, useEffect, useMemo } from "react";

import { Source, sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useSourceFileNameSearch, { Actions, State } from "./hooks/useSourceFileNameSearch";

export const SourceFileNameSearchContext = createContext<[State, Actions]>(null as any);

export function SourceFileNameSearchContextRoot({ children }: { children: ReactNode }) {
  const client = useContext(ReplayClientContext);

  const [state, actions] = useSourceFileNameSearch();

  const context = useMemo<[State, Actions]>(() => [state, actions], [state, actions]);

  // Keep source search state in sync with the focused source.
  useEffect(() => {
    async function updateSources(setSources: (sources: Source[]) => void) {
      const sources = await sourcesCache.readAsync(client);
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
