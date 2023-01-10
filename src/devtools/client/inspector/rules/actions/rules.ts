import { assert } from "protocol/utils";
import type { UIStore } from "ui/actions";
import { isInspectorSelected } from "ui/reducers/app";
import { AppStartListening } from "ui/setup/listenerMiddleware";

import { setComputedProperties } from "../../computed/actions";
import {
  getMarkupNodeById,
  getSelectedDomNodeId,
  nodeSelected,
} from "../../markup/reducers/markup";
import ElementStyle from "../models/element-style";
import { rulesUpdated } from "../reducers/rules";

export function setupRules(store: UIStore, startAppListening: AppStartListening) {
  // Any time a new node is selected in the "Markup" panel,
  // try to update the CSS rules info
  startAppListening({
    actionCreator: nodeSelected,
    effect: async (action, listenerApi) => {
      const { extra, getState, dispatch, condition } = listenerApi;
      const { ThreadFront, protocolClient, replayClient } = extra;
      const state = getState();

      const originalPauseId = await ThreadFront.getCurrentPauseId(replayClient);
      const selectedNode = getSelectedDomNodeId(state);

      if (!isInspectorSelected(state) || !selectedNode) {
        console.log("Bailing out of rule fetching", selectedNode);
        dispatch(rulesUpdated([]));
        return;
      }

      let nodeInfo = getMarkupNodeById(state, selectedNode);

      if (!nodeInfo) {
        await condition((action, currentState) => {
          return !!getMarkupNodeById(currentState, selectedNode);
        }, 3000);
        nodeInfo = getMarkupNodeById(getState(), selectedNode);
      }

      if (ThreadFront.currentPauseIdUnsafe !== originalPauseId) {
        return;
      }

      if (!nodeInfo?.isConnected || !nodeInfo?.isElement) {
        console.log("No node info for rules", nodeInfo);
        dispatch(rulesUpdated([]));
        return;
      }

      const elementStyle = new ElementStyle(
        selectedNode,
        originalPauseId,
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
