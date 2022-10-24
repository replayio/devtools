import { SourceId } from "@replayio/protocol";
import { useMemo, useState } from "react";

import useSearch from "./useSearch";
import type { Actions as SearchActions, State as SearchState } from "./useSearch";

type Scope = {
  code: string;
  sourceId: SourceId | null;
};

export type SetScope = (sourceId: SourceId | null, code: string) => void;

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
  setScope: SetScope;
};

export type State = SearchState<number>;

export default function useSourceSearch(): [State, Actions] {
  const [scope, setScope] = useState<Scope>({
    code: "",
    sourceId: null,
  });

  const lines = useMemo(() => scope.code.split("\n"), [scope.code]);

  const [state, dispatch] = useSearch<string, number>(lines, search, scope.sourceId);

  const externalActions = useMemo(
    () => ({
      ...dispatch,
      setScope: (sourceId: SourceId | null, code: string) => setScope({ code, sourceId }),
    }),
    [dispatch]
  );

  return [state, externalActions];
}
