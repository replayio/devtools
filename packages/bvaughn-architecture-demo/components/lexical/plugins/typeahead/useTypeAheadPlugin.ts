import * as React from "react";
import { useContext, useEffect, useRef, useState } from "react";

import { TypeAheadContext } from "./TypeAheadContext";
import { ContextShape, HookShape, HookState } from "./types";

const EMPTY_ARRAY: any[] = [];

export default function useTypeAheadPlugin<Item>(): HookShape<Item> {
  const { dismiss, selectItem, selectNext, selectPrevious, subscribe, update }: ContextShape<Item> =
    useContext(TypeAheadContext);

  // Store mirror copies in hook state
  // so updates will schedule re-renders for this part of the React tree
  const [state, setState] = useState<HookState<Item>>({
    items: EMPTY_ARRAY,
    query: "",
    selectedIndex: 0,
  });

  const stateRef = useRef<HookState<Item>>(state);

  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    return subscribe((newQuery: string, newItems: Item[], newSelectedIndex: number) => {
      newItems = newItems.length === 0 ? EMPTY_ARRAY : newItems;

      setState(prevState => {
        if (
          prevState.query === newQuery &&
          prevState.selectedIndex === newSelectedIndex &&
          prevState.items === newItems
        ) {
          return prevState;
        }

        return {
          query: newQuery,
          selectedIndex: newSelectedIndex,
          items: newItems,
        };
      });
    });
  }, [subscribe]);

  const selectedItem = state.items[state.selectedIndex] ?? null;

  return {
    dismiss,
    query: state.query,
    selectItem,
    selectedIndex: state.selectedIndex,
    selectedItem,
    selectNext,
    selectPrevious,
    items: state.items,
    stateRef,
    update,
  };
}
