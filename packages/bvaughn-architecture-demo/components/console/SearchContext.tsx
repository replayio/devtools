import { createContext, MutableRefObject, ReactNode, useMemo } from "react";

import useConsoleSearchDOM, { Actions, State } from "./hooks/useConsoleSearchDOM";

export const SearchContext = createContext<[State, Actions]>(null as any);

export function SearchContextRoot({
  children,
  messageListRef,
  showSearchInputByDefault,
}: {
  children: ReactNode;
  messageListRef: MutableRefObject<HTMLElement | null>;
  showSearchInputByDefault: boolean;
}) {
  const [state, actions] = useConsoleSearchDOM(messageListRef, showSearchInputByDefault);

  const context = useMemo<[State, Actions]>(() => [state, actions], [state, actions]);

  return <SearchContext.Provider value={context}>{children}</SearchContext.Provider>;
}
