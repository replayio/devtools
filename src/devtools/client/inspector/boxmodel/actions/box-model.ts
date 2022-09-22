import type { UIStore, UIThunkAction } from "ui/actions";
import type { NodeFront } from "protocol/thread/node";

import { isInspectorSelected } from "ui/reducers/app";

import { selection } from "devtools/client/framework/selection";
import { getComputedStyleAsync, getBoundingRectAsync } from "ui/suspense/styleCaches";

import { layoutUpdated, LAYOUT_NUMERIC_FIELDS, Layout } from "../reducers/box-model";

export function setupBoxModel(store: UIStore) {
  // Any time a new node is selected in the "Markup" panel, try to update the box model layout data
  selection.on("new-node-front", () => {
    if (!isInspectorSelected(store.getState()) || !selection.isNode()) {
      return;
    }

    store.dispatch(updateBoxModel());
  });
}

function updateBoxModel(): UIThunkAction {
  return async (dispatch, getState, { protocolClient, ThreadFront }) => {
    if (
      !selection.isConnected() ||
      !selection.isElementNode() ||
      !ThreadFront.currentPause?.pauseId
    ) {
      return;
    }

    const { nodeFront } = selection;
    if (!nodeFront) {
      return;
    }
    const bounds = await getBoundingRectAsync(
      protocolClient,
      ThreadFront.sessionId!,
      ThreadFront.currentPause.pauseId,
      nodeFront.objectId()
    );

    const style = await getComputedStyleAsync(
      protocolClient,
      ThreadFront.sessionId!,
      ThreadFront.currentPause.pauseId,
      nodeFront.objectId()
    );

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
