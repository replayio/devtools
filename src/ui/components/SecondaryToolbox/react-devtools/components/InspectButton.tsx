import { MouseEvent, useContext } from "react";

import Icon from "replay-next/components/Icon";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { NodePickerContext } from "ui/components/NodePickerContext";
import { ReplayWall } from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";

import styles from "./InspectButton.module.css";

export function InspectButton({ wall }: { wall: ReplayWall }) {
  const { pauseId } = useMostRecentLoadedPause() ?? {};
  const { status, type } = useContext(NodePickerContext);

  let isActive = false;
  let didError = false;
  let state = "inactive";
  let title = undefined;
  if (type === "reactComponent") {
    switch (status) {
      case "active":
      case "initializing": {
        isActive = true;
        state = "active";
        break;
      }
      case "error": {
        didError = true;
        state = "error";
        title = "Something went wrong initializing this component";
        break;
      }
    }
  }

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (pauseId) {
      if (isActive) {
        wall.sendAtPauseId("stopInspectingNative", null, pauseId);
      } else {
        wall.sendAtPauseId("startInspectingNative", null, pauseId);
      }
    }
  };

  return (
    <button
      className={styles.Button}
      data-state={state}
      data-test-id="ReactDevTools-InspectButton"
      disabled={wall === null}
      onClick={onClick}
      title={title}
    >
      <Icon
        className={styles.Icon}
        data-active={isActive || undefined}
        data-errored={didError || undefined}
        type="inspect"
      />
    </button>
  );
}
