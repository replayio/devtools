import { ProtocolSourceContents } from "@bvaughn/src/suspense/SourcesCache";
import { createContext, ReactNode, useMemo } from "react";

import useSourceSearch, { Actions, State } from "./hooks/useSourceSearch";

export const SourceSearchContext = createContext<[State, Actions]>(null as any);

export function SourceSearchContextRoot({
  children,
  sourceContents,
}: {
  children: ReactNode;
  sourceContents: ProtocolSourceContents;
}) {
  const [state, actions] = useSourceSearch(sourceContents.contents);

  const context = useMemo<[State, Actions]>(() => [state, actions], [state, actions]);

  return <SourceSearchContext.Provider value={context}>{children}</SourceSearchContext.Provider>;
}
