import type { UIStore, UIThunkAction } from "ui/actions";
import type { NodeFront } from "protocol/thread/node";

import { isInspectorSelected } from "ui/reducers/app";

import { selection } from "devtools/client/framework/selection";
import { RuleState, rulesUpdated } from "../reducers/rules";
import { setComputedProperties } from "../../computed/actions";

import ElementStyle from "../models/element-style";

export function setupRules(store: UIStore) {
  // Any time a new node is selected in the "Markup" panel, try to update the box model layout data
  selection.on("new-node-front", (nodeFront: NodeFront, reason: string) => {
    if (!isInspectorSelected(store.getState()) || !selection.isNode()) {
      return;
    }

    store.dispatch(updateRulesEntries());
  });
}

function updateRulesEntries(): UIThunkAction {
  return async (dispatch, getState) => {
    if (!selection.isConnected() || !selection.isElementNode()) {
      return;
    }

    const { nodeFront } = selection;

    if (nodeFront) {
      const elementStyle = new ElementStyle(nodeFront);
      // The legacy rule style code used a timeout to keep the rules
      // panel update from blocking the UI
      // This is probably not necessary right now, but \o/
      await new Promise(resolve => setTimeout(resolve, 0));

      await elementStyle.populate();
      dispatch(rulesUpdated(elementStyle.rules));
      dispatch(setComputedProperties(elementStyle));
    } else {
      dispatch(rulesUpdated([]));
    }
  };
}
