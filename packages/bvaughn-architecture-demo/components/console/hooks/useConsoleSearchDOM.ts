import useSearchDOM from "@bvaughn/src/hooks/useSearchDOM";
import type {
  Actions as SearchActions,
  State as SearchState,
} from "@bvaughn/src/hooks/useSearchDOM";
import { MutableRefObject, useMemo, useState } from "react";

import useFilteredMessagesDOM, { Loggable } from "./useFilteredMessagesDOM";

const EMPTY_ARRAY: any[] = [];

function search(
  query: string,
  loggables: Loggable[],
  listRef: MutableRefObject<HTMLElement | null>
): Loggable[] {
  const results: Loggable[] = [];
  const needle = query.toLocaleLowerCase();

  const list = listRef.current!;
  list.childNodes.forEach((node: ChildNode, index: number) => {
    const element = node as HTMLElement;
    // HACK This needs to match (or at least respect) the filtering in useFilteredMessagesDOM()
    if (element.style.display != "none") {
      const textContent = element.textContent?.toLocaleLowerCase();
      if (textContent?.includes(needle)) {
        const loggable = loggables[index];
        results.push(loggable);
      }
    }
  });

  return results;
}

export type Actions = SearchActions & {
  hide: () => void;
  show: () => void;
};

export type State = SearchState<Loggable> & {
  visible: boolean;
};

const INVISIBLE_STATE: State = {
  results: EMPTY_ARRAY,
  index: -1,
  query: "",
  visible: false,
};

export default function useConsoleSearchDOM(
  listRef: MutableRefObject<HTMLElement | null>
): [State, Actions] {
  const messages = useFilteredMessagesDOM(listRef);

  const [state, dispatch] = useSearchDOM<Loggable>(messages, search, listRef);
  const [visible, setVisible] = useState<boolean>(true);

  const externalActions = useMemo(
    () => ({
      ...dispatch,
      hide: () => setVisible(false),
      show: () => setVisible(true),
    }),
    [dispatch]
  );

  const externalState = useMemo(
    () =>
      visible
        ? {
            ...state,
            visible,
          }
        : INVISIBLE_STATE,
    [state, visible]
  );

  return [externalState, externalActions];
}
