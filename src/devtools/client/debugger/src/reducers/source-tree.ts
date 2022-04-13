/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { AnyAction } from "@reduxjs/toolkit";
import type { UIState } from "ui/state";

/**
 * Source tree reducer
 * @module reducers/source-tree
 */

interface TreeItem {
  contents: TreeItem[];
  name: string;
  path: string;
  type: "source" | "directory";
}

export interface SourceTreeState {
  expanded: Set<string>;
  focusedItem: TreeItem | null;
}

export function InitialState() {
  return {
    expanded: new Set<string>(),
    focusedItem: null,
  };
}

export default function update(state = InitialState(), action: AnyAction) {
  switch (action.type) {
    case "SET_EXPANDED_STATE":
      return updateExpanded(state, action);

    case "SET_FOCUSED_SOURCE_ITEM":
      return { ...state, focusedItem: action.item };
  }

  return state;
}

function updateExpanded(state: SourceTreeState, action: AnyAction) {
  return {
    ...state,
    expanded: new Set(action.expanded),
  };
}

export function getExpandedState(state: UIState) {
  return state.sourceTree.expanded;
}

export function getFocusedSourceItem(state: UIState) {
  return state.sourceTree.focusedItem;
}
