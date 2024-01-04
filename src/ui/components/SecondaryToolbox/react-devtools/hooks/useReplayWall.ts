import { createBridge, createStore } from "@replayio/react-devtools-inline/frontend";
import { Dispatch, SetStateAction, useContext, useMemo } from "react";

import {
  highlightNode as highlightNodeAction,
  unhighlightNode as unhighlightNodeAction,
} from "devtools/client/inspector/markup/actions/markup";
import { useNag } from "replay-next/src/hooks/useNag";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Nag } from "shared/graphql/types";
import { NodePickerContext } from "ui/components/NodePickerContext";
import {
  ReplayWall,
  StoreWithInternals,
} from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";
import { useAppDispatch } from "ui/setup/hooks";

export function useReplayWall({
  setProtocolCheckFailed,
}: {
  setProtocolCheckFailed: Dispatch<SetStateAction<boolean>>;
}) {
  const replayClient = useContext(ReplayClientContext);

  const { disable: disableNodePicker, enable: enableNodePicker } = useContext(NodePickerContext);

  const dispatch = useAppDispatch();
  const [, dismissInspectComponentNag] = useNag(Nag.INSPECT_COMPONENT);

  const { bridge, store, wall } = useMemo(() => {
    function highlightNode(nodeId: string) {
      dispatch(highlightNodeAction(nodeId));
    }

    function unhighlightNode() {
      dispatch(unhighlightNodeAction());
    }

    const target = { postMessage() {} } as unknown as Window;

    const wall = new ReplayWall({
      disableNodePicker,
      dismissInspectComponentNag,
      enableNodePicker,
      highlightNode,
      replayClient,
      setProtocolCheckFailed,
      unhighlightNode,
    });

    const bridge = createBridge(target, wall);

    const store = createStore(bridge, {
      checkBridgeProtocolCompatibility: false,
      supportsNativeInspection: true,
    }) as StoreWithInternals;

    wall.store = store;

    return { bridge, store, wall };
  }, [
    dispatch,
    disableNodePicker,
    dismissInspectComponentNag,
    enableNodePicker,
    replayClient,
    setProtocolCheckFailed,
  ]);

  return { bridge, store, wall };
}
