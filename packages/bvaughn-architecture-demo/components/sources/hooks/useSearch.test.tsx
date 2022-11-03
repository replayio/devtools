import { RenderResult, act, render as rtlRender } from "@testing-library/react";
import { useEffect } from "react";

import useSearch, { Actions, ScopeId, SearchFunction, State } from "./useSearch";

type Item = string;
type Result = string;
type QueryData = boolean;

const DEFAULT_ITEMS: Item[] = ["foo", "bar", "baz"];
const DEFAULT_SCOPE = "default";

function stableSearch(query: string, items: Item[], caseSensitive: QueryData | null = false) {
  const needle = caseSensitive ? query : query.toLowerCase();
  return items.filter(item => {
    if (!caseSensitive) {
      item.toLowerCase();
    }
    return item.includes(needle);
  });
}

describe("useSearch", () => {
  let currentActions: Actions<QueryData> | null = null;
  let currentState: State<Item, Result, QueryData> | null = null;
  let renderResult: RenderResult | null = null;
  let stableSearchMock: jest.MockedFunction<SearchFunction<Item, Result, QueryData>> = null as any;

  beforeEach(() => {
    stableSearchMock = jest.fn().mockImplementation(stableSearch);
  });

  afterEach(() => {
    renderResult = null;
  });

  function Component({ items, scopeId }: { items: Item[]; scopeId: ScopeId }) {
    const [state, actions] = useSearch<Item, Result, QueryData>(items, stableSearchMock, scopeId);

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

  function markUpdateProcessed() {
    act(() => {
      currentActions?.markUpdateProcessed();
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

  it("should reset pending update flag when results or indices change", async () => {
    render(DEFAULT_ITEMS.concat("bat"));
    search("b");
    expect(currentState?.pendingUpdateForScope).toBe(DEFAULT_SCOPE);

    markUpdateProcessed();
    expect(currentState?.pendingUpdateForScope).toBe(null);

    // Changes that impact the currently selected result should not re-set the flag
    search("ba");
    expect(currentState?.pendingUpdateForScope).toBe(DEFAULT_SCOPE);

    // Changing scope should always clear the pending update flag
    render(DEFAULT_ITEMS.concat("bat"), "new-scope");
    expect(currentState?.pendingUpdateForScope).toBe(null);
  });

  describe("scopes", () => {
    it("should track results and indices separately per scope", async () => {
      const scopeAId = "scope-a";
      const scopeBId = "scope-b";
      const scopeAItems = ["bob", "charles", "greg", "stan"];
      const scopeBItems = ["alice", "mary", "sally"];

      render(scopeAItems, scopeAId);
      search("a");
      goToNext();
      expect(currentState?.index).toBe(1);
      expect(currentState?.pendingUpdateForScope).toBe(scopeAId);
      expect(currentState?.results).toHaveLength(2);
      expect(stableSearchMock).toHaveBeenCalledTimes(1);

      render(scopeBItems, scopeBId);
      expect(currentState?.index).toBe(0);
      expect(currentState?.pendingUpdateForScope).toBe(null);
      expect(currentState?.results).toHaveLength(3);
      expect(stableSearchMock).toHaveBeenCalledTimes(2);
      goToNext();
      expect(currentState?.pendingUpdateForScope).toBe(scopeBId);
      expect(currentState?.index).toBe(1);
      expect(stableSearchMock).toHaveBeenCalledTimes(2);

      render(scopeAItems, scopeAId);
      expect(currentState?.index).toBe(1);
      expect(currentState?.pendingUpdateForScope).toBe(null);
      expect(currentState?.results).toHaveLength(2);
      expect(stableSearchMock).toHaveBeenCalledTimes(2);

      goToPrevious();
      expect(currentState?.index).toBe(0);
      expect(currentState?.pendingUpdateForScope).toBe(scopeAId);
      expect(currentState?.results).toHaveLength(2);
      expect(stableSearchMock).toHaveBeenCalledTimes(2);

      render(scopeBItems, scopeBId);
      expect(currentState?.index).toBe(1);
      expect(currentState?.pendingUpdateForScope).toBe(null);
      expect(currentState?.results).toHaveLength(3);
      expect(stableSearchMock).toHaveBeenCalledTimes(2);
    });

    it("should re-run stale searches when scopes change", async () => {
      const scopeAId = "scope-a";
      const scopeBId = "scope-b";
      const scopeAItems = ["bob", "charles", "greg", "stan"];
      const scopeBItems = ["alice", "mary", "sally"];

      render(scopeAItems, scopeAId);
      search("a");
      expect(currentState?.results).toEqual(["charles", "stan"]);

      render(scopeBItems, scopeBId);
      expect(currentState?.results).toEqual(["alice", "mary", "sally"]);
      search("ar");
      expect(currentState?.results).toEqual(["mary"]);

      render(scopeAItems, scopeAId);
      expect(currentState?.results).toEqual(["charles"]);
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

    it("should (only) re-run search when query or queryData changes", async () => {
      render(DEFAULT_ITEMS);
      expect(stableSearchMock).toHaveBeenCalledTimes(0);

      search("b");
      expect(stableSearchMock).toHaveBeenCalledTimes(1);

      render(DEFAULT_ITEMS);
      expect(stableSearchMock).toHaveBeenCalledTimes(1);

      search("ba");
      expect(stableSearchMock).toHaveBeenCalledTimes(2);

      search("ba", true);
      expect(stableSearchMock).toHaveBeenCalledTimes(3);

      render(DEFAULT_ITEMS);
      expect(stableSearchMock).toHaveBeenCalledTimes(3);
    });
  });
});
