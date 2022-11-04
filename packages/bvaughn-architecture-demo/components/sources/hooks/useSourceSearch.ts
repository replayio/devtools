import { SourceId } from "@replayio/protocol";
import escapeRegExp from "lodash/escapeRegExp";
import isEqual from "lodash/isEqual";
import { useMemo, useState } from "react";

import { NEW_LINE_REGEX } from "bvaughn-architecture-demo/src/utils/string";

import useSearch from "./useSearch";
import type { Actions as SearchActions, State as SearchState } from "./useSearch";

type Scope = {
  code: string;
  sourceId: SourceId | null;
};

type SearchModifiers = {
  caseSensitive: boolean;
  regex: boolean;
  wholeWord: boolean;
};

type SetModifiers = (modifiers: SearchModifiers) => void;

export type SetScope = (sourceId: SourceId | null, code: string) => void;

function search(
  query: string,
  lines: string[],
  modifiers: SearchModifiers | null = null
): number[] {
  const { caseSensitive = false, regex = false, wholeWord = false } = modifiers || {};

  const results: number[] = [];

  let flags;
  if (!caseSensitive) {
    flags = "i";
  }

  if (!regex) {
    query = escapeRegExp(query);
  }
  if (wholeWord) {
    query = `\\b${query}\\b`;
  }

  const regExp = new RegExp(query, flags);

  lines.forEach((line, index) => {
    if (line.match(regExp)) {
      results.push(index);
    }
  });

  return results;
}

export type Actions = SearchActions<SearchModifiers> & {
  setModifiers: SetModifiers;
  setScope: SetScope;
};

export type State = SearchState<string, number, SearchModifiers> & {
  modifiers: SearchModifiers;
};

export default function useSourceSearch(): [State, Actions] {
  const [scope, setScope] = useState<Scope>({
    code: "",
    sourceId: null,
  });

  const [modifiers, setModifiers] = useState<SearchModifiers>({
    caseSensitive: false,
    regex: false,
    wholeWord: false,
  });

  const lines = useMemo(() => scope.code.split(NEW_LINE_REGEX), [scope.code]);

  const [state, dispatch] = useSearch<string, number, SearchModifiers>(
    lines,
    search,
    scope.sourceId
  );

  const memoizedActions = useMemo<Actions>(
    () => ({
      ...dispatch,
      search: (query: string) => dispatch.search(query, modifiers),
      setModifiers: (newModifiers: SearchModifiers) => {
        if (isEqual(modifiers, newModifiers)) {
          return;
        }

        setModifiers(newModifiers);
        dispatch.search(state.query, newModifiers);
      },
      setScope: (sourceId: SourceId | null, code: string) => setScope({ code, sourceId }),
    }),
    [dispatch, modifiers, state.query]
  );
  const memoizedState = useMemo<State>(() => ({ ...state, modifiers }), [state, modifiers]);

  return [memoizedState, memoizedActions];
}
