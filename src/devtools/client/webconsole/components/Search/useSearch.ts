import { useDeferredValue, useMemo, useReducer, useRef } from "react";

const EMPTY_ARRAY: any[] = [];

export type State<Item> = {
  index: number;
  query: string;
  results: Item[];
};

export type Action<Item> =
  | { type: "goToNext" }
  | { type: "goToPrevious" }
  | { type: "updateQuery"; query: string }
  | { type: "updateResults"; index: number; results: Item[] };

export type Actions<Item> = {
  goToNext: () => void;
  goToPrevious: () => void;
  search: (query: string) => void;
};

function reducer<Item>(state: State<Item>, action: Action<Item>): State<Item> {
  switch (action.type) {
    case "goToNext": {
      const { index, results } = state;
      return {
        ...state,
        index: index < results.length - 1 ? index + 1 : 0,
      };
    }
    case "goToPrevious": {
      const { index, results } = state;
      return {
        ...state,
        index: index > 0 ? index - 1 : results.length - 1,
      };
    }
    case "updateQuery": {
      return {
        ...state,
        query: action.query,
      };
    }
    case "updateResults": {
      return {
        ...state,
        index: action.index,
        results: action.results,
      };
    }
  }
}

export default function useSearch<Item>(
  items: Item[],
  stableSearch: (query: string, items: Item[]) => Item[]
): [State<Item>, Actions<Item>] {
  const [state, dispatch] = useReducer<React.Reducer<State<Item>, Action<Item>>>(reducer, {
    index: -1,
    results: [],
    query: "",
  });

  // Let React update search text at high priority and results at lower priority;
  // this keeps the search text input updating quick and feeling responsive to user input.
  const deferredQuery = useDeferredValue(state.query);

  const prevItemsRef = useRef<Item[] | null>(null);
  const prevQueryRef = useRef<string | null>(null);

  // Any time our search inputs change, re-run the search function.
  if (prevItemsRef.current !== items || prevQueryRef.current !== deferredQuery) {
    const prevResults = state.results;
    const results = deferredQuery ? stableSearch(deferredQuery, items) : EMPTY_ARRAY;

    prevItemsRef.current = items;
    prevQueryRef.current = deferredQuery;

    let prevIndex = state.index;
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

  const actions = useMemo<Actions<Item>>(
    () => ({
      goToNext: () => dispatch({ type: "goToNext" }),
      goToPrevious: () => dispatch({ type: "goToPrevious" }),
      search: (query: string) => dispatch({ type: "updateQuery", query }),
    }),
    []
  );

  const externalState = useMemo<State<Item>>(
    () => ({
      index: state.index,
      query: state.query,
      results: state.results,
    }),
    [state]
  );

  return [externalState, actions];
}
