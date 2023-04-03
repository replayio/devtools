import { RenderResult, act, render as rtlRender } from "@testing-library/react";
import { useEffect } from "react";

import useSearch, {
  Actions,
  FindInitialIndexFunction,
  ScopeId,
  SearchFunction,
  State,
} from "./useSearch";

type Item = string;
type Result = string;
type QueryData = boolean;

const DEFAULT_ITEMS: Item[] = ["foo", "bar", "baz"];
const DEFAULT_SCOPE = "default";

function stableFindInitialIndex(): number {
  return 0;
}

function stableSearch(query: string, items: Item[], caseSensitive: QueryData | null = false) {
  const needle = caseSensitive ? query : query.toLowerCase();
  return items.filter(item => {
    return caseSensitive ? item.includes(needle) : item.toLowerCase().includes(needle);
  });
}

describe("useSearch", () => {
  let currentActions: Actions<QueryData> | null = null;
  let currentState: State<Item, Result, QueryData> | null = null;
  let renderResult: RenderResult | null = null;
  let stableFindInitialIndexMock: jest.MockedFunction<FindInitialIndexFunction<Result>> =
    null as any;
  let stableSearchMock: jest.MockedFunction<SearchFunction<Item, Result, QueryData>> = null as any;

  beforeEach(() => {
    stableFindInitialIndexMock = jest.fn().mockImplementation(stableFindInitialIndex);
    stableSearchMock = jest.fn().mockImplementation(stableSearch);
  });

  afterEach(() => {
    renderResult = null;
  });

  function Component({ items, scopeId }: { items: Item[]; scopeId: ScopeId }) {
    const [state, actions] = useSearch<Item, Result, QueryData>(
      items,
      stableSearchMock,
      stableFindInitialIndexMock,
      scopeId
    );

    useEffect(() => {
      currentActions = actions;
      currentState = state;
    });

    return null;
  }

  function render(items: Item[], scopeId: ScopeId = DEFAULT_SCOPE) {
    act(() => {
      if (renderResult === null) {
        renderResult = rtlRender(<Component items={items} scopeId={scopeId} />);
      } else {
        renderResult.rerender(<Component items={items} scopeId={scopeId} />);
      }
    });
  }

  function goToNext() {
    act(() => {
      currentActions?.goToNext();
    });
  }

  function goToPrevious() {
    act(() => {
      currentActions?.goToPrevious();
    });
  }

  function search(query: string, queryData: QueryData = false) {
    act(() => {
      currentActions?.search(query, queryData);
    });
  }

  it("should refine search results when query text, items, or query data change", async () => {
    render(DEFAULT_ITEMS);
    search("b");
    expect(currentState?.results).toEqual(["bar", "baz"]);

    search("bA");
    expect(currentState?.results).toEqual(["bar", "baz"]);

    search("bAr");
    expect(currentState?.results).toEqual(["bar"]);

    search("bAr", true);
    expect(currentState?.results).toEqual([]);

    search("bAr", false);
    expect(currentState?.results).toEqual(["bar"]);

    search("q");
    expect(currentState?.results).toEqual([]);

    render(DEFAULT_ITEMS.concat("qux"));
    expect(currentState?.results).toEqual(["qux"]);

    render(DEFAULT_ITEMS.concat(""));
    expect(currentState?.results).toEqual([]);
  });

  it("should cycle through next and previous results", async () => {
    render(DEFAULT_ITEMS.concat("bat"));
    search("b");
    expect(currentState?.index).toBe(0);
    expect(currentState?.results).toHaveLength(3);

    goToNext();
    expect(currentState?.index).toBe(1);
    goToNext();
    expect(currentState?.index).toBe(2);
    goToNext();
    expect(currentState?.index).toBe(0);

    goToPrevious();
    expect(currentState?.index).toBe(2);
    goToPrevious();
    expect(currentState?.index).toBe(1);
    goToPrevious();
    expect(currentState?.index).toBe(0);
  });

  it("should select the findInitialIndex function prop", async () => {
    stableFindInitialIndexMock.mockImplementation(items => items.indexOf("bat"));

    // Injected findIndex function should be used to select the initial match.
    render(DEFAULT_ITEMS.concat("bat"));
    search("b");
    expect(stableFindInitialIndexMock).toHaveBeenCalledTimes(1);
    expect(currentState?.index).toBe(2); // bat
    expect(currentState?.results).toHaveLength(3);

    goToPrevious();
    expect(currentState?.index).toBe(1); // baz

    // Injected findIndex function should not be used for refinement.
    search("baz");
    expect(currentState?.index).toBe(0);

    stableFindInitialIndexMock.mockReset();
    stableFindInitialIndexMock.mockImplementation(items => items.indexOf("bat"));

    // Injected findIndex function should be used again if results reset.
    search("at");
    expect(stableFindInitialIndexMock).toHaveBeenCalledTimes(1);
    expect(currentState?.index).toBe(0);
  });

  describe("scopes", () => {
    it("should track results separately per scope", async () => {
      const scopeAId = "scope-a";
      const scopeBId = "scope-b";
      const scopeAItems = ["bob", "charles", "greg", "stan"];
      const scopeBItems = ["alice", "mary", "sally"];

      render(scopeAItems, scopeAId);
      search("a");
      goToNext();
      expect(currentState?.index).toBe(1);
      expect(currentState?.results).toHaveLength(2);
      expect(stableSearchMock).toHaveBeenCalledTimes(1);

      render(scopeBItems, scopeBId);
      expect(currentState?.index).toBe(-1);
      expect(currentState?.results).toHaveLength(3);
      expect(stableSearchMock).toHaveBeenCalledTimes(2);
      goToNext();
      expect(currentState?.index).toBe(0);
      expect(stableSearchMock).toHaveBeenCalledTimes(2);

      render(scopeAItems, scopeAId);
      expect(currentState?.index).toBe(-1);
      expect(currentState?.results).toHaveLength(2);
      expect(stableSearchMock).toHaveBeenCalledTimes(2);

      goToNext();
      expect(currentState?.index).toBe(0);
      expect(currentState?.results).toHaveLength(2);
      expect(stableSearchMock).toHaveBeenCalledTimes(2);

      render(scopeBItems, scopeBId);
      expect(currentState?.index).toBe(-1);
      expect(currentState?.results).toHaveLength(3);
      expect(stableSearchMock).toHaveBeenCalledTimes(2);
    });

    it("should re-run stale searches when scopes change but should not select a default result", async () => {
      const scopeAId = "scope-a";
      const scopeBId = "scope-b";
      const scopeAItems = ["bob", "charles", "greg", "stan"];
      const scopeBItems = ["alice", "mary", "sally"];

      render(scopeAItems, scopeAId);
      search("a");
      expect(currentState?.index).toBe(0);
      expect(currentState?.results).toEqual(["charles", "stan"]);

      render(scopeBItems, scopeBId);
      expect(currentState?.results).toEqual(["alice", "mary", "sally"]);
      search("ar");
      expect(currentState?.index).toBe(0);
      expect(currentState?.results).toEqual(["mary"]);

      render(scopeAItems, scopeAId);
      expect(currentState?.index).toBe(-1);
      expect(currentState?.results).toEqual(["charles"]);
    });

    it("should not select a default result when items change after a scope change", async () => {
      const scopeAId = "scope-a";
      const scopeBId = "scope-b";
      const scopeAItems = ["bob", "charles", "greg", "stan"];
      const scopeBItems = ["alice", "mary", "sally"];

      render(scopeAItems, scopeAId);
      search("a");
      expect(currentState?.index).toBe(0);

      // Simulate scope changing while items are still loading.
      render([], scopeBId);
      expect(currentState?.index).toBe(-1);

      // At this point, items loading it should not select a default result.
      render(scopeBItems, scopeBId);
      expect(currentState?.index).toBe(-1);

      // A default result should only be selected when the user explicitly chooses to increment.
      goToNext();
      expect(currentState?.index).toBe(0);
    });
  });

  describe("memoizing", () => {
    it("should (only) re-run search when inputs change (items and scope)", async () => {
      render(DEFAULT_ITEMS);
      expect(stableSearchMock).toHaveBeenCalledTimes(0);

      search("ba");
      expect(stableSearchMock).toHaveBeenCalledTimes(1);
      expect(currentState?.index).toEqual(0);
      expect(currentState?.results).toEqual(["bar", "baz"]);

      render(DEFAULT_ITEMS);
      expect(stableSearchMock).toHaveBeenCalledTimes(1);

      render(DEFAULT_ITEMS.concat("qux"));
      expect(stableSearchMock).toHaveBeenCalledTimes(2);
      expect(currentState?.index).toEqual(0);
      expect(currentState?.results).toEqual(["bar", "baz"]);
    });

    it("should re-run search only when query or queryData changes", async () => {
      render(DEFAULT_ITEMS);
      expect(currentState?.index).toBe(-1);
      expect(stableSearchMock).toHaveBeenCalledTimes(0);

      search("B");
      expect(currentState?.index).toBe(0);
      expect(stableSearchMock).toHaveBeenCalledTimes(1);

      render(DEFAULT_ITEMS);
      expect(stableSearchMock).toHaveBeenCalledTimes(1);

      search("BA");
      expect(currentState?.index).toBe(0);
      expect(stableSearchMock).toHaveBeenCalledTimes(2);

      search("BA", true);
      expect(currentState?.results).toEqual([]);
      expect(currentState?.index).toBe(-1);
      expect(stableSearchMock).toHaveBeenCalledTimes(3);

      render(DEFAULT_ITEMS);
      expect(currentState?.results).toEqual([]);
      expect(currentState?.index).toBe(-1);
      expect(stableSearchMock).toHaveBeenCalledTimes(3);

      search("BA");
      expect(currentState?.index).toBe(0);
      expect(stableSearchMock).toHaveBeenCalledTimes(4);
    });
  });
});
