import { useDeferredValue, useMemo, useReducer, useState } from "react";

const EMPTY_ARRAY: any[] = [];

export type CachedScope<Result> = {
  index: number;
  results: Result[];
  query: string;
};

export type ScopeId = string;

export type State<Result> = {
  cachedScopes: {
    [id: ScopeId]: CachedScope<Result>;
  };
  currentScopeId: ScopeId | null;
  enabled: boolean;
  index: number;
  query: string;
  results: Result[];
};

export type Action<Result> =
  | { type: "enable" }
  | { type: "disable" }
  | { type: "goToNext" }
  | { type: "goToPrevious" }
  | { type: "updateCurrentScopeId"; scopeId: ScopeId | null }
  | { type: "updateQuery"; query: string }
  | { type: "updateResults"; index: number; results: Result[] };

export type Actions = {
  enable: () => void;
  disable: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
  search: (query: string) => void;
};

function reducer<Result>(state: State<Result>, action: Action<Result>): State<Result> {
  switch (action.type) {
    case "enable": {
      return {
        ...state,
        enabled: true,
      };
    }
    case "disable": {
      return {
        ...state,
        enabled: false,
      };
    }
    case "goToNext": {
      const { currentScopeId, index, query, results } = state;

      const newIndex = index < results.length - 1 ? index + 1 : 0;

      let cachedScopes = state.cachedScopes;
      if (currentScopeId !== null) {
        cachedScopes = {
          ...state.cachedScopes,
          [currentScopeId]: {
            index: newIndex,
            results,
            query,
          },
        };
      }

      return {
        ...state,
        cachedScopes,
        index: newIndex,
      };
    }
    case "goToPrevious": {
      const { currentScopeId, index, query, results } = state;

      const newIndex = index < results.length - 1 ? index + 1 : 0;

      let cachedScopes = state.cachedScopes;
      if (currentScopeId !== null) {
        cachedScopes = {
          ...state.cachedScopes,
          [currentScopeId]: {
            index: newIndex,
            results,
            query,
          },
        };
      }

      return {
        ...state,
        cachedScopes,
        index: newIndex,
      };
    }
    case "updateCurrentScopeId": {
      const { scopeId } = action;

      return {
        ...state,
        currentScopeId: scopeId,
      };
    }
    case "updateQuery": {
      return {
        ...state,
        query: action.query,
      };
    }
    case "updateResults": {
      const { index, results } = action;
      const { currentScopeId, query } = state;

      let cachedScopes = state.cachedScopes;
      if (currentScopeId !== null) {
        cachedScopes = {
          ...state.cachedScopes,
          [currentScopeId]: {
            index,
            results,
            query,
          },
        };
      }

      return {
        ...state,
        cachedScopes,
        index,
        results,
      };
    }
  }
}

export default function useSearch<Item, Result>(
  items: Item[],
  stableSearch: (query: string, items: Item[]) => Result[],
  scopeId: ScopeId | null = "default"
): [State<Result>, Actions] {
  const [state, dispatch] = useReducer<React.Reducer<State<Result>, Action<Result>>>(reducer, {
    cachedScopes: {},
    currentScopeId: null,
    enabled: false,
    index: -1,
    query: "",
    results: [],
  });

  // Let React update search text at high priority and results at lower priority;
  // this keeps the search text input updating quick and feeling responsive to user input.
  const deferredQuery = useDeferredValue(state.query);

  // TRICKY
  // Store previous values in State; do not store them in a Ref.
  // It's technically not safe to read or write to a Ref during render.
  // If React bails out before committing an update, the Ref value will have already been mutated when the component later renders.
  // That means the render-phase state update (re-running search) will be skipped.
  const [prevValues, setPrevValues] = useState<{
    items: Item[] | null;
    query: string | null;
    scopeId: ScopeId | null;
  }>({
    items: null,
    query: null,
    scopeId: null,
  });

  // Any time our search inputs change, re-run the search function.
  if (
    prevValues.items !== items ||
    prevValues.query !== deferredQuery ||
    prevValues.scopeId !== scopeId
  ) {
    setPrevValues({ items, query: deferredQuery, scopeId });

    dispatch({ type: "updateCurrentScopeId", scopeId });

    if (scopeId !== null) {
      const cachedScope = state.cachedScopes[scopeId];

      const prevResults = cachedScope == null ? EMPTY_ARRAY : cachedScope.results;
      let prevIndex = cachedScope == null ? -1 : cachedScope.index;

      if (cachedScope == null || cachedScope.query !== deferredQuery) {
        const results = deferredQuery ? stableSearch(deferredQuery, items) : EMPTY_ARRAY;

        let index = -1;

        // Update the selected index based on the new results.
        if (results.length > 0) {
          const prevItem =
            prevIndex >= 0 && prevIndex < prevResults.length ? prevResults[prevIndex] : null;
          if (prevItem) {
            index = results.indexOf(prevItem);
          }

          if (index < 0) {
            index = 0;
          }
        }

        dispatch({ type: "updateResults", index, results });
      } else {
        dispatch({ type: "updateResults", index: cachedScope.index, results: cachedScope.results });
      }
    }
  }

  const actions = useMemo<Actions>(
    () => ({
      enable: () => dispatch({ type: "enable" }),
      disable: () => dispatch({ type: "disable" }),
      goToNext: () => dispatch({ type: "goToNext" }),
      goToPrevious: () => dispatch({ type: "goToPrevious" }),
      search: (query: string) => dispatch({ type: "updateQuery", query }),
    }),
    []
  );

  const externalState = useMemo<State<Result>>(() => state, [state]);

  return [externalState, actions];
}
