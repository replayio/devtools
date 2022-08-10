import type { UIStore, UIThunkAction } from "ui/actions";
import type { NodeFront } from "protocol/thread/node";

import { isInspectorSelected } from "ui/reducers/app";

import { selection } from "devtools/client/framework/selection";

import { layoutUpdated, LAYOUT_NUMERIC_FIELDS, Layout } from "../reducers/box-model";

export function setupBoxModel(store: UIStore) {
  // Any time a new node is selected in the "Markup" panel, try to update the box model layout data
  selection.on("new-node-front", (nodeFront: NodeFront, reason: string) => {
    if (!isInspectorSelected(store.getState()) || !selection.isNode()) {
      return;
    }

    store.dispatch(updateBoxModel());
  });
}

function updateBoxModel(): UIThunkAction {
  return async (dispatch, getState) => {
    if (!selection.isConnected() || !selection.isElementNode()) {
      return;
    }

    const { nodeFront } = selection;
    const bounds = await nodeFront!.getBoundingClientRect();
    const style = await nodeFront!.getComputedStyle();

    if (!bounds || !style) {
      return;
    }

    const layout = {
      width: parseFloat(bounds.width.toPrecision(6)),
      height: parseFloat(bounds.height.toPrecision(6)),
      autoMargins: {},
    } as Layout;

    for (const prop of LAYOUT_NUMERIC_FIELDS) {
      layout[prop] = style.get(prop)!;
    }

    // Update the redux store with the latest layout properties and update the box model view.
    dispatch(layoutUpdated(layout));
  };
}
