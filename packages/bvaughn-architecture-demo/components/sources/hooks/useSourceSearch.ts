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
  setCode: (code: string) => void;
};

export type State = SearchState<number>;

export default function useSourceSearch(): [State, Actions] {
  const [code, setCode] = useState<string>("");
  const lines = useMemo(() => code.split("\n"), [code]);
  const [state, dispatch] = useSearch<string, number>(lines, search);

  const externalActions = useMemo(
    () => ({
      ...dispatch,
      setCode: setCode,
    }),
    [dispatch]
  );

  return [state, externalActions];
}
