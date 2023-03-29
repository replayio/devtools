import isEqual from "lodash/isEqual";
import { useDeferredValue, useLayoutEffect, useMemo, useReducer, useRef } from "react";

const EMPTY_ARRAY: any[] = [];

export type CachedScope<Item, Result, QueryData> = {
  items: Item[];
  results: Result[];
  query: string;
  queryData: QueryData | null;
};

export type ScopeId = string;

export type FindInitialIndexFunction<Result> = (results: Result[]) => number;

export type OnChangeDispatching<Result> = (currentResult: Result | null) => void;

export type SearchFunction<Item, Result, QueryData = never> = (
  query: string,
  items: Item[],
  queryData?: QueryData | null
) => Result[];

function defaultFindInitialIndex<Result>(results: Result[]): number {
  return results.length > 0 ? 0 : -1;
}

export type State<Item, Result, QueryData = never> = {
  cachedScopes: {
    [id: ScopeId]: CachedScope<Item, Result, QueryData>;
  };
  currentScopeId: ScopeId | null;

  // Global state (applies to all scopes)
  // If individual cached scope is out of sync (e.g. with query) then it needs to be re-searched
  enabled: boolean;
  query: string;
  queryData: QueryData | null;

  // Copied from the currently-active scope
  // so that callers don't need to be aware of State's shape
  index: number;
  results: Result[];
};

export type Action<Item, Result, QueryData = never> =
  | { type: "disable" }
  | { type: "enable" }
  | { type: "increment"; by: number }
  | { type: "updateCurrentScopeId"; scopeId: ScopeId | null }
  | { type: "updateItems"; items: Item[] }
  | { type: "updateQuery"; query: string; queryData: QueryData | null }
  | {
      type: "updateResults";
      index: number;
      results: Result[];
    };

export type Actions<QueryData = never> = {
  disable: () => void;
  enable: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
  search: (query: string, queryData?: QueryData) => void;
};

function reducer<Item, Result, QueryData = never>(
  state: State<Item, Result, QueryData>,
  action: Action<Item, Result, QueryData>
): State<Item, Result, QueryData> {
  switch (action.type) {
    case "disable": {
      return {
        ...state,
        enabled: false,
      };
    }
    case "enable": {
      return {
        ...state,
        enabled: true,
      };
    }
    case "increment": {
      const { by } = action;
      const { index, results } = state;

      let newIndex = index;
      if (by > 0) {
        newIndex = index + by < results.length ? index + by : 0;
      } else {
        newIndex = index + by >= 0 ? index + by : results.length - 1;
      }

      return {
        ...state,
        index: newIndex,
      };
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
          items: EMPTY_ARRAY,
          query: "",
          queryData: null,
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
        index: -1,
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
      const { query, queryData } = action;

      // This should only update the global query;
      // per-scope query should only be updated along with results

      if (query !== state.query || !isEqual(queryData, state.queryData)) {
        return {
          ...state,
          query,
          queryData,
        };
      } else {
        return state;
      }
    }
    case "updateResults": {
      const { index, results } = action;
      const { currentScopeId, query, queryData } = state;

      const cachedScopes = state.cachedScopes;
      if (currentScopeId !== null) {
        const currentScope = cachedScopes[currentScopeId];
        if (currentScope != null) {
          if (
            currentScope.query !== query ||
            currentScope.queryData !== queryData ||
            currentScope.results !== results
          ) {
            return {
              ...state,
              cachedScopes: {
                ...cachedScopes,
                [currentScopeId]: {
                  ...currentScope,
                  query,
                  queryData,
                  results,
                },
              },
              index,
              results,
            };
          }
        }
      }

      return state;
    }
  }
}

export default function useSearch<Item, Result, QueryData = never>(
  items: Item[],
  stableSearch: SearchFunction<Item, Result, QueryData>,
  findInitialIndex: FindInitialIndexFunction<Result> = defaultFindInitialIndex,
  scopeId?: ScopeId | null,
  onChangeDispatching?: OnChangeDispatching<Result>
): [State<Item, Result, QueryData>, Actions<QueryData>] {
  if (scopeId == null) {
    scopeId = "default";
  }

  const [state, dispatch] = useReducer<
    React.Reducer<State<Item, Result, QueryData>, Action<Item, Result, QueryData>>
  >(reducer, {
    cachedScopes: {},
    currentScopeId: null,
    enabled: false,
    index: -1,
    query: "",
    queryData: null,
    results: [],
  });

  const onChangeDispatchingRef = useRef<OnChangeDispatching<Result> | null>(
    onChangeDispatching || null
  );
  const stateRef = useRef<State<Item, Result, QueryData>>(state);
  useLayoutEffect(() => {
    onChangeDispatchingRef.current = onChangeDispatching || null;
    stateRef.current = state;
  });

  const { cachedScopes, currentScopeId, index: prevIndex, query, queryData } = state;

  // Let React update search text at high priority and results at lower priority;
  // this keeps the search text input updating quick and feeling responsive to user input.
  const deferredQuery = useDeferredValue(query);
  const deferredQueryData = useDeferredValue(queryData);

  const currentScope = scopeId !== null ? cachedScopes[scopeId] : null;
  const prevResults = currentScope != null ? currentScope.results : EMPTY_ARRAY;
  const itemsChanged = currentScope == null || currentScope.items !== items;
  const queryChanged = currentScope == null || currentScope.query !== deferredQuery;
  const queryDataChanged =
    currentScope == null || !isEqual(currentScope.queryData, deferredQueryData);
  const scopeIdChanged = currentScopeId !== scopeId;

  // State will not update within the scope of the rest of this function,
  // so don't read any more values from it after dispatch.

  if (scopeIdChanged) {
    dispatch({ type: "updateCurrentScopeId", scopeId });
  }

  // Any time our search inputs change, re-run the search function.
  if (itemsChanged || queryChanged || queryDataChanged) {
    if (itemsChanged) {
      dispatch({ type: "updateItems", items });
    }

    if (queryChanged || queryDataChanged) {
      dispatch({ type: "updateQuery", query: deferredQuery, queryData: deferredQueryData });
    }

    const results = deferredQuery
      ? stableSearch(deferredQuery, items, deferredQueryData)
      : EMPTY_ARRAY;

    let index = -1;
    if (!scopeIdChanged) {
      // Update the selected index based on the new results.
      if (results.length > 0) {
        const prevItem =
          prevIndex >= 0 && prevIndex < prevResults.length ? prevResults[prevIndex] : null;
        if (prevItem) {
          index = results.indexOf(prevItem);
        }

        if (index < 0) {
          index = findInitialIndex(results);
        }
      }
    }

    dispatch({ type: "updateResults", index, results });

    if (!scopeIdChanged) {
      // Refine the selected result (within the current search) as a user types.
      const onChangeDispatching = onChangeDispatchingRef.current;
      if (onChangeDispatching) {
        onChangeDispatching(results[index]);
      }
    }
  }

  const actions = useMemo<Actions<QueryData>>(
    () => ({
      disable: () => {
        const onChangeDispatching = onChangeDispatchingRef.current;
        if (onChangeDispatching) {
          onChangeDispatching(null);
        }

        dispatch({ type: "disable" });
      },
      enable: () => dispatch({ type: "enable" }),
      goToNext: () => {
        const onChangeDispatching = onChangeDispatchingRef.current;
        if (onChangeDispatching) {
          const { index, results } = stateRef.current;
          const newIndex = index + 1 < results.length ? index + 1 : 0;
          onChangeDispatching(results[newIndex] || null);
        }

        dispatch({ type: "increment", by: 1 });
      },
      goToPrevious: () => {
        const onChangeDispatching = onChangeDispatchingRef.current;
        if (onChangeDispatching) {
          const { index, results } = stateRef.current;
          const newIndex = index > 0 ? index - 1 : results.length - 1;
          onChangeDispatching(results[newIndex] || null);
        }

        dispatch({ type: "increment", by: -1 });
      },
      search: (query: string, queryData?: QueryData) =>
        dispatch({ type: "updateQuery", query, queryData: queryData || null }),
    }),
    []
  );

  const externalState = useMemo<State<Item, Result, QueryData>>(() => state, [state]);

  return [externalState, actions];
}
