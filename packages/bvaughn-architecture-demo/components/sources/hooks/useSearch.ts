import { useDeferredValue, useMemo, useReducer } from "react";

const EMPTY_ARRAY: any[] = [];

export type CachedScope<Item, Result> = {
  index: number;
  items: Item[];
  results: Result[];
  query: string;
};

export type ScopeId = string;

export type SearchFunction<Item, Result> = (query: string, items: Item[]) => Result[];

export type State<Item, Result> = {
  cachedScopes: {
    [id: ScopeId]: CachedScope<Item, Result>;
  };
  currentScopeId: ScopeId | null;

  // Global state (applies to all scopes)
  // If individual cached scope is out of sync (e.g. with query) then it needs to be re-searched
  enabled: boolean;
  query: string;

  // Copied from the currently-active scope
  // so that callers don't need to be aware of State's shape
  index: number;
  results: Result[];
};

export type Action<Item, Result> =
  | { type: "enable" }
  | { type: "disable" }
  | { type: "increment"; by: number }
  | { type: "updateCurrentScopeId"; scopeId: ScopeId | null }
  | { type: "updateItems"; items: Item[] }
  | { type: "updateQuery"; query: string }
  | { type: "updateResults"; index: number; results: Result[] };

export type Actions = {
  enable: () => void;
  disable: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
  search: (query: string) => void;
};

function reducer<Item, Result>(
  state: State<Item, Result>,
  action: Action<Item, Result>
): State<Item, Result> {
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
    case "increment": {
      const { by } = action;
      const { currentScopeId, index, results } = state;

      let newIndex = index;
      if (by > 0) {
        newIndex = index + by < results.length ? index + by : 0;
      } else {
        newIndex = index + by >= 0 ? index + by : results.length - 1;
      }

      const cachedScopes = state.cachedScopes;
      if (currentScopeId !== null) {
        const currentScope = cachedScopes[currentScopeId];
        if (currentScope != null && currentScope.index !== newIndex) {
          return {
            ...state,
            cachedScopes: {
              ...cachedScopes,
              [currentScopeId]: {
                ...currentScope,
                index: newIndex,
              },
            },
            index: newIndex,
          };
        }
      }

      return state;
    }
    case "updateCurrentScopeId": {
      const { scopeId } = action;
      const { currentScopeId } = state;

      if (scopeId === null) {
        return {
          ...state,
          currentScopeId: null,
          index: -1,
          results: EMPTY_ARRAY,
        };
      } else if (scopeId === currentScopeId) {
        return state;
      }

      const cachedScopes = state.cachedScopes;

      let cachedScope = cachedScopes[scopeId];
      if (cachedScope == null) {
        cachedScope = {
          index: -1,
          items: EMPTY_ARRAY,
          query: "",
          results: EMPTY_ARRAY,
        };
      }

      return {
        ...state,
        cachedScopes: {
          ...cachedScopes,
          [scopeId]: cachedScope,
        },
        currentScopeId: scopeId,
        index: cachedScope.index,
        results: cachedScope.results,
      };
    }
    case "updateItems": {
      const { items } = action;
      const { currentScopeId } = state;

      const cachedScopes = state.cachedScopes;
      if (currentScopeId !== null) {
        const currentScope = cachedScopes[currentScopeId];
        if (currentScope != null && currentScope.items !== items) {
          return {
            ...state,
            cachedScopes: {
              ...cachedScopes,
              [currentScopeId]: {
                ...currentScope,
                items,
              },
            },
          };
        }
      }

      return state;
    }
    case "updateQuery": {
      const { query } = action;

      // This should only update the global query;
      // per-scope query should only be updated along with results

      if (query !== state.query) {
        return {
          ...state,
          query,
        };
      } else {
        return state;
      }
    }
    case "updateResults": {
      const { index, results } = action;
      const { currentScopeId, query } = state;

      const cachedScopes = state.cachedScopes;
      if (currentScopeId !== null) {
        const currentScope = cachedScopes[currentScopeId];
        if (currentScope != null && currentScope.results !== results) {
          return {
            ...state,
            cachedScopes: {
              ...cachedScopes,
              [currentScopeId]: {
                ...currentScope,
                index,
                query,
                results,
              },
            },
            index,
            results,
          };
        }
      }

      return state;
    }
  }
}

export default function useSearch<Item, Result>(
  items: Item[],
  stableSearch: SearchFunction<Item, Result>,
  scopeId?: ScopeId | null
): [State<Item, Result>, Actions] {
  if (scopeId == null) {
    scopeId = "default";
  }

  const [state, dispatch] = useReducer<React.Reducer<State<Item, Result>, Action<Item, Result>>>(
    reducer,
    {
      cachedScopes: {},
      currentScopeId: null,
      enabled: false,
      index: -1,
      query: "",
      results: [],
    }
  );

  const { cachedScopes, currentScopeId, query } = state;

  // Let React update search text at high priority and results at lower priority;
  // this keeps the search text input updating quick and feeling responsive to user input.
  const deferredQuery = useDeferredValue(query);

  const currentScope = scopeId !== null ? cachedScopes[scopeId] : null;
  const prevResults = currentScope != null ? currentScope.results : EMPTY_ARRAY;
  const itemsChanged = currentScope == null || currentScope.items !== items;
  const queryChanged = currentScope == null || currentScope.query !== deferredQuery;

  // State will not update within the scope of the rest of this function,
  // so don't read any more values from it after dispatch.

  if (currentScopeId !== scopeId) {
    dispatch({ type: "updateCurrentScopeId", scopeId });
  }

  // Any time our search inputs change, re-run the search function.
  if (itemsChanged || queryChanged) {
    if (itemsChanged) {
      dispatch({ type: "updateItems", items });
    }

    if (queryChanged) {
      dispatch({ type: "updateQuery", query: deferredQuery });
    }

    const results = deferredQuery ? stableSearch(deferredQuery, items) : EMPTY_ARRAY;

    let prevIndex = currentScope?.index ?? -1;
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
  }

  const actions = useMemo<Actions>(
    () => ({
      enable: () => dispatch({ type: "enable" }),
      disable: () => dispatch({ type: "disable" }),
      goToNext: () => dispatch({ type: "increment", by: 1 }),
      goToPrevious: () => dispatch({ type: "increment", by: -1 }),
      search: (query: string) => dispatch({ type: "updateQuery", query }),
    }),
    []
  );

  const externalState = useMemo<State<Item, Result>>(() => state, [state]);

  return [externalState, actions];
}
