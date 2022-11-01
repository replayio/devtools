import React, { MutableRefObject, useRef, useState } from "react";
import { act } from "react-dom/test-utils";

import { render } from "../utils/testing";
import useSearchDOM from "./useSearchDOM";
import type { Actions, State } from "./useSearchDOM";

type Item = {
  text: string;
};

function itemSearch(
  query: string,
  loggables: Item[],
  listRef: MutableRefObject<HTMLElement | null>
): Item[] {
  const results: Item[] = [];
  const needle = query.toLocaleLowerCase();

  const list = listRef.current!;
  list.childNodes.forEach((node: ChildNode, index: number) => {
    const textContent = node.textContent?.toLocaleLowerCase();
    if (textContent?.includes(needle)) {
      const loggable = loggables[index];
      results.push(loggable);
    }
  });

  return results;
}
describe("useSearchDOM", () => {
  let lastCommitedSearchActions: Actions | null = null;
  let lastCommitedSearchState: State<Item> | null = null;
  let updateSearchableItems: React.Dispatch<React.SetStateAction<Item[]>> | null = null;
  let TestComponent: any;

  beforeEach(() => {
    lastCommitedSearchActions = null;
    lastCommitedSearchState = null;
    updateSearchableItems = null;

    TestComponent = function TestComponent() {
      const ref = useRef<HTMLUListElement>(null);
      const [items, setItems] = useState<Item[]>([]);
      updateSearchableItems = setItems;

      const [state, actions] = useSearchDOM<Item>(items, itemSearch, ref);
      lastCommitedSearchActions = actions;
      lastCommitedSearchState = state;

      return (
        <ul ref={ref}>
          {items.map((item, index) => (
            <li key={index}>{item.text}</li>
          ))}
        </ul>
      );
    };
  });

  it("should re-render when searchable items change", async () => {
    await render(<TestComponent />, {});
    expect(lastCommitedSearchState?.results).toMatchInlineSnapshot(`Array []`);

    act(() => {
      lastCommitedSearchActions?.search("ba");
    });
    expect(lastCommitedSearchState?.results).toMatchInlineSnapshot(`Array []`);

    act(() => {
      updateSearchableItems?.([{ text: "foo" }, { text: "bar" }, { text: "baz" }, { text: "qux" }]);
    });
    expect(lastCommitedSearchState?.results).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "bar",
        },
        Object {
          "text": "baz",
        },
      ]
    `);
  });

  it("should re-render when search query change", async () => {
    await render(<TestComponent />, {});
    expect(lastCommitedSearchState?.results).toMatchInlineSnapshot(`Array []`);

    act(() => {
      updateSearchableItems?.([{ text: "foo" }, { text: "bar" }, { text: "baz" }, { text: "qux" }]);
    });
    expect(lastCommitedSearchState?.results).toMatchInlineSnapshot(`Array []`);

    act(() => {
      lastCommitedSearchActions?.search("ba");
    });
    expect(lastCommitedSearchState?.results).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "bar",
        },
        Object {
          "text": "baz",
        },
      ]
    `);

    act(() => {
      lastCommitedSearchActions?.search("blah");
    });
    expect(lastCommitedSearchState?.results).toMatchInlineSnapshot(`Array []`);
  });

  it("should update the selected index when search actions are called", async () => {
    await render(<TestComponent />, {});
    act(() => {
      updateSearchableItems?.([{ text: "a" }, { text: "aa" }, { text: "bbb" }, { text: "aaa" }]);
      lastCommitedSearchActions?.search("a");
    });
    expect(lastCommitedSearchState?.index).toBe(0);

    act(() => {
      lastCommitedSearchActions?.goToNext();
    });
    expect(lastCommitedSearchState?.index).toBe(1);

    act(() => {
      lastCommitedSearchActions?.goToNext();
    });
    expect(lastCommitedSearchState?.index).toBe(2);

    act(() => {
      lastCommitedSearchActions?.goToNext();
    });
    expect(lastCommitedSearchState?.index).toBe(0);

    act(() => {
      lastCommitedSearchActions?.goToPrevious();
    });
    expect(lastCommitedSearchState?.index).toBe(2);

    act(() => {
      lastCommitedSearchActions?.goToPrevious();
    });
    expect(lastCommitedSearchState?.index).toBe(1);

    act(() => {
      lastCommitedSearchActions?.goToPrevious();
    });
    expect(lastCommitedSearchState?.index).toBe(0);
  });

  it("should automatically update the selected index as search results change", async () => {
    await render(<TestComponent />, {});
    act(() => {
      updateSearchableItems?.([{ text: "bbb" }, { text: "aa" }, { text: "aab" }, { text: "aaa" }]);
      lastCommitedSearchActions?.search("a");
    });
    expect(lastCommitedSearchState).toMatchInlineSnapshot(`
      Object {
        "index": 0,
        "query": "a",
        "results": Array [
          Object {
            "text": "aa",
          },
          Object {
            "text": "aab",
          },
          Object {
            "text": "aaa",
          },
        ],
      }
    `);

    // Select the second item in the matching set.
    act(() => {
      lastCommitedSearchActions?.goToNext();
    });
    expect(lastCommitedSearchState).toMatchInlineSnapshot(`
      Object {
        "index": 1,
        "query": "a",
        "results": Array [
          Object {
            "text": "aa",
          },
          Object {
            "text": "aab",
          },
          Object {
            "text": "aaa",
          },
        ],
      }
    `);

    // Refine the search, so that the selected item is still in the results.
    act(() => {
      lastCommitedSearchActions?.search("aa");
    });
    expect(lastCommitedSearchState).toMatchInlineSnapshot(`
      Object {
        "index": 1,
        "query": "aa",
        "results": Array [
          Object {
            "text": "aa",
          },
          Object {
            "text": "aab",
          },
          Object {
            "text": "aaa",
          },
        ],
      }
    `);

    // Refine the search, so that the selected item is no longer in the results.
    act(() => {
      lastCommitedSearchActions?.search("aaa");
    });
    expect(lastCommitedSearchState).toMatchInlineSnapshot(`
      Object {
        "index": 0,
        "query": "aaa",
        "results": Array [
          Object {
            "text": "aaa",
          },
        ],
      }
    `);
  });
});
