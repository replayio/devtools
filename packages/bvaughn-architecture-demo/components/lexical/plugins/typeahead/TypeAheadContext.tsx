import * as React from "react";
import { Context, ReactNode, createContext, useMemo } from "react";

import { Callback, ContextShape } from "./types";

const EMPTY_ARRAY: any[] = [];

type DefaultItemType = any;

export const TypeAheadContext: Context<ContextShape<DefaultItemType>> = createContext({
  dismiss: () => {},
  selectItem: (_: DefaultItemType) => {},
  selectNext: () => {},
  selectPrevious: () => {},
  subscribe: (_: Callback<DefaultItemType>) => () => {},
  update: (_: string, __: DefaultItemType[]) => {},
});

export const TypeAheadContextProvider = <Item extends Object>({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const context: ContextShape<Item> = useMemo(() => {
    const subscribers: Set<Callback<Item>> = new Set();

    let query = "";
    let selectedIndex = 0;
    let items: Item[] = EMPTY_ARRAY;

    const notifySubscribers = () => {
      for (const subscriber of subscribers) {
        subscriber(query, items, selectedIndex);
      }
    };

    const dismiss = () => {
      update("", []);
    };

    const selectItem = (item: Item) => {
      const index = items.indexOf(item);
      if (index >= 0) {
        selectedIndex = index;

        notifySubscribers();
      }
    };

    const selectNext = () => {
      selectedIndex++;
      if (selectedIndex >= items.length) {
        selectedIndex = 0;
      }
      notifySubscribers();
    };

    const selectPrevious = () => {
      selectedIndex--;
      if (selectedIndex < 0) {
        selectedIndex = items.length - 1;
      }
      notifySubscribers();
    };

    const subscribe = (callback: Callback<Item>) => {
      callback(query, items, selectedIndex);

      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    };

    const update = (newQuery: string, newItems: Item[]) => {
      const previousItem = selectedIndex < items.length ? items[selectedIndex] : null;

      query = newQuery;
      items = newItems;

      if (previousItem !== null) {
        const newSelectionIndex = items.indexOf(previousItem);
        selectedIndex = newSelectionIndex >= 0 ? newSelectionIndex : 0;
      }

      notifySubscribers();
    };

    return { dismiss, selectItem, selectNext, selectPrevious, subscribe, update };
  }, []);
  return <TypeAheadContext.Provider value={context}>{children}</TypeAheadContext.Provider>;
};
