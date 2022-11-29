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

export type ItemListRendererProps<Item> = {
  items: Item[];
  popupRef: RefObject<HTMLDivElement>;
  selectedItem: Item | null;
  selectItem: (item: Item) => void;
};

export type ItemRendererProps<Item> = {
  isSelected: boolean;
  item: Item;
  selectItem: (item: Item) => void;
};

export type TextRange = {
  beginOffset: number;
  beginTextNode: LexicalNode;
  endOffset: number;
  endTextNode: LexicalNode;
};

export type QueryData = {
  insertionTextRange: TextRange;
  positionTextRange: TextRange;
  query: string;
  queryAdditionalData: string | null;
};

export type SearchPromise<Item> = {
  cancel: () => void;
  promise: Promise<Item[]>;
};

export type TypeAheadSelection = RangeSelection | NodeSelection | GridSelection;
