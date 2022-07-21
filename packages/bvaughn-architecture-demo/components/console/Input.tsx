import { TerminalContext } from "@bvaughn/src/contexts/TerminalContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { getPauseData, getPauseForExecutionPoint } from "@bvaughn/src/suspense/PauseCache";
import { getClosestPointForTime } from "@bvaughn/src/suspense/PointsCache";
import { FrameId } from "@replayio/protocol";
import { useContext, useEffect, useRef } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Icon from "../Icon";

import styles from "./Input.module.css";
import { SearchContext } from "./SearchContext";

export default function Input() {
  const client = useContext(ReplayClientContext);
  const [searchState, searchActions] = useContext(SearchContext);
  const { addMessage } = useContext(TerminalContext);
  const { executionPoint, pauseId: explicitPuaseId, time } = useContext(TimelineContext);

  // If we are not currently paused at an explicit point, find the nearest point and pause there.
  let pauseId = explicitPuaseId;
  let frameId: FrameId | null = null;
  if (pauseId === null) {
    const executionPoint = getClosestPointForTime(client, time);
    const pauseData = getPauseForExecutionPoint(client, executionPoint);

    frameId = pauseData.stack?.[0] ?? null;
    pauseId = pauseData.pauseId;
  } else {
    const pauseData = getPauseData(client, pauseId);

    frameId = pauseData.frames?.[0]?.frameId ?? null;
  }

  const ref = useRef<HTMLInputElement>(null);
  const searchStateVisibleRef = useRef(false);

  useEffect(() => {
    if (!searchState.visible && searchStateVisibleRef.current) {
      ref?.current?.focus();
    }

    searchStateVisibleRef.current = searchState.visible;
  }, [searchState.visible]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Enter": {
        event.preventDefault();

        const input = ref.current!;
        const expression = input.value.trim();
        if (expression !== "") {
          input.value = "";

          addMessage({
            expression,
            frameId: frameId!,
            pauseId: pauseId!,
            point: executionPoint || "",
            time: time || 0,
          });
        }
        break;
      }
      case "f": {
        if (event.metaKey) {
          event.preventDefault();

          searchActions.show();
        }
        break;
      }
    }
  };

  // TODO (FE-346) Add eager evaluation row (share code with TerminalExpressionRenderer)

  return (
    <div className={styles.Container}>
      <Icon className={styles.Icon} type="prompt" />
      <input
        className={styles.Input}
        data-test-id="ConsoleTerminalInput"
        onKeyDown={onKeyDown}
        ref={ref}
        type="text"
      />
    </div>
  );
}
