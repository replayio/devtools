import type { UIStore, UIThunkAction } from "ui/actions";
import { AppStartListening } from "ui/setup/listenerMiddleware";

import { isInspectorSelected } from "ui/reducers/app";

import { rulesUpdated } from "../reducers/rules";
import { setComputedProperties } from "../../computed/actions";
import { nodeSelected } from "../../markup/reducers/markup";

import ElementStyle from "../models/element-style";

export function setupRules(store: UIStore, startAppListening: AppStartListening) {
  // Any time a new node is selected in the "Markup" panel,
  // try to update the CSS rules info
  startAppListening({
    actionCreator: nodeSelected,
    effect: async (action, listenerApi) => {
      const { extra, getState, dispatch } = listenerApi;
      const { ThreadFront, protocolClient, replayClient } = extra;
      const state = getState();
      const { selectedNode, tree } = state.markup;

      if (!isInspectorSelected(state) || !selectedNode || !ThreadFront.currentPause?.pauseId) {
        dispatch(rulesUpdated([]));
        return;
      }

      const nodeInfo = tree.entities[selectedNode];

      if (!nodeInfo?.isConnected || !nodeInfo?.isElement) {
        dispatch(rulesUpdated([]));
        return;
      }

      const elementStyle = new ElementStyle(
        selectedNode,
        ThreadFront.currentPause.pauseId,
        ThreadFront.sessionId!,
        replayClient,
        protocolClient
      );

      // The legacy rule style code used a timeout to keep the rules
      // panel update from blocking the UI
      // This is probably not necessary right now, but \o/
      await new Promise(resolve => setTimeout(resolve, 0));

      await elementStyle.populate();
      dispatch(rulesUpdated(elementStyle.rules));
      dispatch(setComputedProperties(elementStyle));
    },
  });
}
