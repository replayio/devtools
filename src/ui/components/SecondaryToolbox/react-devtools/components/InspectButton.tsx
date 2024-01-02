import { FrontendBridge } from "@replayio/react-devtools-inline";
import { MouseEvent, useContext } from "react";

import Icon from "replay-next/components/Icon";
import { NodePickerContext } from "ui/components/NodePickerContext";
import { ReplayWall } from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";

import styles from "./InspectButton.module.css";

export function InspectButton({ wall }: { wall: ReplayWall }) {
  const { status, type } = useContext(NodePickerContext);

  const isActive = (status === "active" || status === "initializing") && type === "reactComponent";

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (isActive) {
      wall.send("stopInspectingNative", null);
    } else {
      wall.send("startInspectingNative", null);
    }
  };

  return (
    <button
      className={styles.Button}
      data-state={isActive ? "active" : "inactive"}
      data-test-id="ReactDevTools-InspectButton"
      disabled={wall === null}
      onClick={onClick}
    >
      <Icon className={styles.Icon} data-active={isActive || undefined} type="inspect" />
    </button>
  );
}
