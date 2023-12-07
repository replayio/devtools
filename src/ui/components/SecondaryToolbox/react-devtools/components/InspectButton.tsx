import { FrontendBridge } from "@replayio/react-devtools-inline";
import { Dispatch, MouseEvent, SetStateAction, useEffect, useLayoutEffect, useState } from "react";

import Icon from "replay-next/components/Icon";
import { ReplayWall } from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";

import styles from "./InspectButton.module.css";

export function InspectButton({
  bridge,
  isActive,
  setIsActive,
  wall,
}: {
  bridge: FrontendBridge;
  isActive: boolean;
  setIsActive: Dispatch<SetStateAction<boolean>>;
  wall: ReplayWall;
}) {
  useLayoutEffect(() => {
    return () => {
      setIsActive(false);
    };
  }, [setIsActive]);

  // Note this approach has a possible race case if an event is sent before the effect is run
  // but there is no good way to work around that within the constraints of React and the RDT backend
  useEffect(() => {
    const onStop = () => {
      setIsActive(false);
    };

    bridge.addListener("stopInspectingNative", onStop);

    return () => {
      bridge.removeListener("stopInspectingNative", onStop);
    };
  }, [bridge, setIsActive]);

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (isActive) {
      setIsActive(false);
      wall.send("stopInspectingNative", null);
    } else {
      setIsActive(true);
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
