import { ReactNode, useMemo } from "react";

import { SearchContext } from "./SearchContext";
import useConsoleSearch, { Actions, State } from "./hooks/useConsoleSearch";

export default function SearchRoot({ children }: { children: ReactNode }) {
  const [state, actions] = useConsoleSearch();

  const context = useMemo<[State, Actions]>(() => [state, actions], [state, actions]);

  return <SearchContext.Provider value={context}>{children}</SearchContext.Provider>;
}
