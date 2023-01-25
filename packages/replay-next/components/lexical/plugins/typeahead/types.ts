import { GridSelection, LexicalNode, NodeSelection, RangeSelection, TextNode } from "lexical";
import { RefObject } from "react";

export type Callback<Item> = (query: string, items: Item[], selectedIndex: number) => void;

export type ContextShape<Item> = {
  dismiss: () => void;
  selectItem: (item: Item) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  subscribe: (callback: Callback<Item>) => () => void;
  update: (_: string, __: Item[]) => void;
};

export type HookShape<Item> = {
  dismiss: () => void;
  query: string;
  selectedIndex: number;
  selectedItem: Item | null;
  items: Item[];
  selectItem: (item: Item) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  stateRef: {
    current: HookState<Item>;
  };
  update: (_: string, __: Item[]) => void;
};

export type HookState<Item> = {
  query: string;
  selectedIndex: number;
  items: Item[];
};
export type TextRange = {
  beginOffset: number;
  beginTextNode: LexicalNode;
  endOffset: number;
  endTextNode: LexicalNode;
};

export type QueryData = {
  query: string;
  queryAdditionalData: string | null;
  textRange: TextRange;
};

export type TypeAheadSelection = RangeSelection | NodeSelection | GridSelection;
