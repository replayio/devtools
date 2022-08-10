import { Loggable, LoggablesContext } from "@bvaughn/components/console/LoggablesContext";
import useSearchDOM from "@bvaughn/src/hooks/useSearchDOM";
import type {
  Actions as SearchActions,
  State as SearchState,
} from "@bvaughn/src/hooks/useSearchDOM";
import { MutableRefObject, useContext, useMemo, useState } from "react";

const EMPTY_ARRAY: any[] = [];

function search(
  query: string,
  loggables: Loggable[],
  listRef: MutableRefObject<HTMLElement | null>
): Loggable[] {
  const results: Loggable[] = [];
  const needle = query.toLocaleLowerCase();

  const list = listRef.current!;
  list.childNodes.forEach((node: ChildNode) => {
    const element = node as HTMLElement;

    // HACK Must be compatible with the style used by <LoggablesContextRoot>
    if (element.hasAttribute("data-search-index") && element.style.display != "none") {
      const textContent = element.textContent?.toLocaleLowerCase();
      if (textContent?.includes(needle)) {
        const index = parseInt(element.getAttribute("data-search-index")!, 10);
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
  listRef: MutableRefObject<HTMLElement | null>,
  defaultVisible: boolean = true
): [State, Actions] {
  const loggables = useContext(LoggablesContext);

  const [state, dispatch] = useSearchDOM<Loggable>(loggables, search, listRef);
  const [visible, setVisible] = useState<boolean>(defaultVisible);

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
