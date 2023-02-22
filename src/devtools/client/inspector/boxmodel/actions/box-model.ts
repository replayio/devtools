import type { UIStore } from "ui/actions";
import { AppStartListening } from "ui/setup/listenerMiddleware";
import { getBoundingRectAsync, getComputedStyleAsync } from "ui/suspense/styleCaches";

import { nodeSelected } from "../../markup/reducers/markup";
import { LAYOUT_NUMERIC_FIELDS, Layout, layoutUpdated } from "../reducers/box-model";

export function setupBoxModel(store: UIStore, startAppListening: AppStartListening) {
  // Any time a new node is selected in the "Markup" panel,
  // try to update the box model layout data
  startAppListening({
    actionCreator: nodeSelected,
    effect: async (action, listenerApi) => {
      const { extra, getState, dispatch, cancelActiveListeners, pause } = listenerApi;
      const { ThreadFront, protocolClient, replayClient } = extra;
      const state = getState();
      const { selectedNode } = state.markup;

      // If any other instance of the "fetch box model data" listener
      // is running, cancel it. Only fetch data for this selected node.
      cancelActiveListeners();

      const originalPauseId = await ThreadFront.getCurrentPauseId(replayClient);

      if (!selectedNode) {
        return;
      }

      const [bounds, style] = await pause(
        Promise.all([
          getBoundingRectAsync(
            originalPauseId,
            selectedNode,
            protocolClient,
            ThreadFront.sessionId!
          ),
          getComputedStyleAsync(
            originalPauseId,
            selectedNode,
            protocolClient,
            ThreadFront.sessionId!
          ),
        ])
      );

      const currentPauseId = await ThreadFront.getCurrentPauseId(replayClient);

      // If we don't have data, or the user has unpaused, bail out.
      if (!bounds || !style || currentPauseId !== originalPauseId) {
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
    },
  });
}
