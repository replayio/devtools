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
      const { extra, getState, dispatch, condition, cancelActiveListeners, pause } = listenerApi;
      const { ThreadFront, protocolClient, replayClient } = extra;
      const state = getState();

      // If any other instance of the "fetch CSS rules data" listener
      // is running, cancel it. Only fetch data for this selected node.
      cancelActiveListeners();

      const originalPauseId = await ThreadFront.getCurrentPauseId(replayClient);
      const selectedNode = getSelectedDomNodeId(state);

      if (!selectedNode) {
        dispatch(rulesUpdated([]));
        return;
      }

      // Unlike the "box model" listener, we need to wait for the markup
      // data to be fetched, because we can't get rules for some types of nodes.

      await condition((action, currentState) => {
        return !!getMarkupNodeById(currentState, selectedNode);
      });

      const nodeInfo = getMarkupNodeById(getState(), selectedNode);

      const currentPauseId = await ThreadFront.getCurrentPauseId(replayClient);

      if (currentPauseId !== originalPauseId || !nodeInfo?.isConnected || !nodeInfo?.isElement) {
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

      await pause(elementStyle.populate());
      dispatch(rulesUpdated(elementStyle.rules));
      dispatch(setComputedProperties(elementStyle));
    },
  });
}
