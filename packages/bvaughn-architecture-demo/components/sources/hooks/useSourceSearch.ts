import { useMemo, useState } from "react";
import useSearch from "./useSearch";

import type { Actions as SearchActions, State as SearchState } from "./useSearch";

function search(query: string, lines: string[]): number[] {
  const results: number[] = [];

  const needle = query.toLocaleLowerCase();
  lines.forEach((line, index) => {
    if (line.toLocaleLowerCase().includes(needle)) {
      results.push(index);
    }
  });

  return results;
}

export type Actions = SearchActions & {
  hide: () => void;
  setCode: (code: string) => void;
  show: () => void;
};

export type State = SearchState<number> & {
  visible: boolean;
};

export default function useSourceSearch(): [State, Actions] {
  const [code, setCode] = useState<string>("");
  const lines = useMemo(() => code.split("\n"), [code]);
  const [state, dispatch] = useSearch<string, number>(lines, search);

  const [visible, setVisible] = useState<boolean>(false);

  const externalActions = useMemo(
    () => ({
      ...dispatch,
      hide: () => setVisible(false),
      setCode: setCode,
      show: () => setVisible(true),
    }),
    [dispatch]
  );

  const externalState = useMemo(
    () => ({
      ...state,
      visible,
    }),
    [state, visible]
  );

  return [externalState, externalActions];
}
