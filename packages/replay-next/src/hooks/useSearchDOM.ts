import { MutableRefObject, useContext, useEffect, useMemo, useReducer } from "react";

import { ConsoleFiltersContext } from "../contexts/ConsoleFiltersContext";

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
  | { type: "updateResults"; results: Item[] };

export type Actions = {
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
      const { results } = action;
      let index = -1;
      if (results.length > 0) {
        const { index: prevIndex, results: prevResults } = state;
        const prevItem =
          prevIndex >= 0 && prevIndex < prevResults.length ? prevResults[prevIndex] : null;

        if (prevItem) {
          index = results.indexOf(prevItem);
        }

        if (index < 0) {
          index = 0;
        }
      }

      return {
        ...state,
        index,
        results,
      };
    }
  }
}

export default function useSearchDOM<Item>(
  items: Item[],
  stableSearch: (
    query: string,
    items: Item[],
    listRef: MutableRefObject<HTMLElement | null>
  ) => Item[],
  listRef: MutableRefObject<HTMLElement | null>
): [State<Item>, Actions] {
  const [state, dispatch] = useReducer<React.Reducer<State<Item>, Action<Item>>>(reducer, {
    index: -1,
    results: EMPTY_ARRAY,
    query: "",
  });

  const { filterByText } = useContext(ConsoleFiltersContext);

  const { query } = state;

  // Any time our search inputs change, re-run the search function.
  // HACK Search iterates over the filtered list, so filter criteria is an input as well.
  useEffect(() => {
    const results = query ? stableSearch(query, items, listRef) : EMPTY_ARRAY;

    dispatch({ type: "updateResults", results });
  }, [filterByText, items, listRef, query, stableSearch]);

  const actions = useMemo<Actions>(
    () => ({
      goToNext: () => dispatch({ type: "goToNext" }),
      goToPrevious: () => dispatch({ type: "goToPrevious" }),
      search: (query: string) => dispatch({ type: "updateQuery", query }),
    }),
    []
  );

  // For the moment, these values are equal.
  const externalState = state;

  return [externalState, actions];
}
