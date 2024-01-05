import { ObjectId } from "@replayio/protocol";
import classnames from "classnames";
import { useContext } from "react";

import { selectNode } from "devtools/client/inspector/markup/actions/markup";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { useNag } from "replay-next/src/hooks/useNag";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Nag } from "shared/graphql/types";
import { setSelectedPanel } from "ui/actions/layout";
import { NodePickerContext } from "ui/components/NodePickerContext";
import { useAppDispatch } from "ui/setup/hooks";
import { boundingRectsCache } from "ui/suspense/nodeCaches";

export function NodePicker() {
  const dispatch = useAppDispatch();

  const [shouldShow, dismissInspectElementNag] = useNag(Nag.INSPECT_ELEMENT); // Replay Passport

  const { enable, status, type } = useContext(NodePickerContext);
  const replayClient = useContext(ReplayClientContext);

  const { pauseId } = useMostRecentLoadedPause() ?? {};

  const active = (status === "initializing" || status === "active") && type === "domElement";

  const onClick = () => {
    if (shouldShow) {
      dismissInspectElementNag();
    }

    if (!active) {
      if (pauseId == null) {
        console.warn("NodePicker enabled before PauseId is available");
        return;
      }

      enable(
        {
          onSelected: (nodeId: ObjectId) => {
            dispatch(setSelectedPanel("inspector"));
            dispatch(selectNode(nodeId));
          },
          type: "domElement",
        },
        async () => {
          await boundingRectsCache.readAsync(replayClient, pauseId);
        }
      );
    }
  };

  return (
    <button
      className={classnames("devtools-button toolbar-panel-button tab", {
        active,
      })}
      data-status={status}
      id="command-button-pick"
      onClick={onClick}
      title="Select an element in the video to inspect it"
    />
  );
}
