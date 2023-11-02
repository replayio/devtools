import { createBridge, createStore } from "@replayio/react-devtools-inline/frontend";
import { Dispatch, SetStateAction, useContext, useMemo } from "react";

import {
  highlightNode as highlightNodeAction,
  unhighlightNode as unhighlightNodeAction,
} from "devtools/client/inspector/markup/actions/markup";
import { useForceUpdate } from "replay-next/src/hooks/useForceUpdate";
import { useNag } from "replay-next/src/hooks/useNag";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Nag } from "shared/graphql/types";
import { fetchMouseTargetsForPause } from "ui/actions/app";
import {
  NodeOptsWithoutBounds,
  ReplayWall,
  StoreWithInternals,
} from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";
import { nodePickerDisabled, nodePickerInitializing, nodePickerReady } from "ui/reducers/app";
import { useAppDispatch } from "ui/setup/hooks";
import { getMouseTarget } from "ui/suspense/nodeCaches";
import { NodePicker as NodePickerClass, NodePickerOpts } from "ui/utils/nodePicker";

export function useReplayWall({
  setProtocolCheckFailed,
}: {
  setProtocolCheckFailed: Dispatch<SetStateAction<boolean>>;
}) {
  const replayClient = useContext(ReplayClientContext);

  const dispatch = useAppDispatch();
  const forceUpdate = useForceUpdate();
  const [, dismissInspectComponentNag] = useNag(Nag.INSPECT_COMPONENT);

  const { bridge, store, wall } = useMemo(() => {
    const nodePicker = new NodePickerClass();

    function disablePicker() {
      nodePicker.disable();
      dispatch(nodePickerDisabled());
    }

    function enablePicker(opts: NodeOptsWithoutBounds) {
      dispatch(nodePickerReady("reactComponent"));

      const actualOpts: NodePickerOpts = {
        ...opts,
        onCheckNodeBounds: async (x, y, nodeIds) => {
          const boundingRects = await fetchMouseTargets();
          return getMouseTarget(boundingRects ?? [], x, y, nodeIds);
        },
      };

      nodePicker.enable(actualOpts);

      // HACK Follow up on why the e2e tests seem to require this
      forceUpdate();
    }

    function fetchMouseTargets() {
      return dispatch(fetchMouseTargetsForPause());
    }

    function highlightNode(nodeId: string) {
      dispatch(highlightNodeAction(nodeId));
    }

    function initializePicker() {
      dispatch(nodePickerInitializing("reactComponent"));
    }

    function unhighlightNode() {
      dispatch(unhighlightNodeAction());
    }

    const target = { postMessage() {} } as unknown as Window;

    const wall = new ReplayWall(
      enablePicker,
      initializePicker,
      disablePicker,
      highlightNode,
      unhighlightNode,
      setProtocolCheckFailed,
      fetchMouseTargets,
      replayClient,
      dismissInspectComponentNag
    );

    const bridge = createBridge(target, wall);

    const store = createStore(bridge, {
      checkBridgeProtocolCompatibility: false,
      supportsNativeInspection: true,
    }) as StoreWithInternals;

    wall.store = store;

    return { bridge, store, wall };
  }, [dispatch, dismissInspectComponentNag, forceUpdate, replayClient, setProtocolCheckFailed]);

  return { bridge, store, wall };
}
