import { useDeferredValue, useMemo, useReducer, useState } from "react";

const EMPTY_ARRAY: any[] = [];

export type State<Result> = {
  index: number;
  query: string;
  results: Result[];
};

export type Action<Result> =
  | { type: "goToNext" }
  | { type: "goToPrevious" }
  | { type: "updateQuery"; query: string }
  | { type: "updateResults"; index: number; results: Result[] };

export type Actions = {
  goToNext: () => void;
  goToPrevious: () => void;
  search: (query: string) => void;
};

function reducer<Result>(state: State<Result>, action: Action<Result>): State<Result> {
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

export default function useSearch<Item, Result>(
  items: Item[],
  stableSearch: (query: string, items: Item[]) => Result[]
): [State<Result>, Actions] {
  const [state, dispatch] = useReducer<React.Reducer<State<Result>, Action<Result>>>(reducer, {
    index: -1,
    results: [],
    query: "",
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
  }>({
    items: null,
    query: null,
  });

  // Any time our search inputs change, re-run the search function.
  if (prevValues.items !== items || prevValues.query !== deferredQuery) {
    const prevResults = state.results;
    const results = deferredQuery ? stableSearch(deferredQuery, items) : EMPTY_ARRAY;

    setPrevValues({ items, query: deferredQuery });

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

  const actions = useMemo<Actions>(
    () => ({
      goToNext: () => dispatch({ type: "goToNext" }),
      goToPrevious: () => dispatch({ type: "goToPrevious" }),
      search: (query: string) => dispatch({ type: "updateQuery", query }),
    }),
    []
  );

  const externalState = useMemo<State<Result>>(
    () => ({
      index: state.index,
      query: state.query,
      results: state.results,
    }),
    [state]
  );

  return [externalState, actions];
}
