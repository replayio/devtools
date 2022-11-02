import { MutableRefObject, ReactNode, createContext, useMemo } from "react";

import useConsoleSearchDOM, { Actions, State } from "./hooks/useConsoleSearchDOM";

export const ConsoleSearchContext = createContext<[State, Actions]>(null as any);

export function ConsoleSearchContextRoot({
  children,
  messageListRef,
  searchInputRef,
  showSearchInputByDefault,
}: {
  children: ReactNode;
  messageListRef: MutableRefObject<HTMLElement | null>;
  searchInputRef: MutableRefObject<HTMLInputElement | null>;
  showSearchInputByDefault: boolean;
}) {
  const [state, actions] = useConsoleSearchDOM(
    messageListRef,
    searchInputRef,
    showSearchInputByDefault
  );

  const context = useMemo<[State, Actions]>(() => [state, actions], [state, actions]);

  return <ConsoleSearchContext.Provider value={context}>{children}</ConsoleSearchContext.Provider>;
}
