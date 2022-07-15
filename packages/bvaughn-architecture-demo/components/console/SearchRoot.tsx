import { MutableRefObject, ReactNode, useMemo } from "react";

import { SearchContext } from "./SearchContext";
import useConsoleSearchDOM, { Actions, State } from "./hooks/useConsoleSearchDOM";

export default function SearchRoot({
  children,
  messageListRef,
}: {
  children: ReactNode;
  messageListRef: MutableRefObject<HTMLElement | null>;
}) {
  const [state, actions] = useConsoleSearchDOM(messageListRef);

  const context = useMemo<[State, Actions]>(() => [state, actions], [state, actions]);

  return <SearchContext.Provider value={context}>{children}</SearchContext.Provider>;
}
