import { FrameId, PauseId } from "@replayio/protocol";
import { useContext, useEffect, useRef } from "react";

import { SelectedFrameContext } from "bvaughn-architecture-demo/src/contexts/SelectedFrameContext";
import { TerminalContext } from "bvaughn-architecture-demo/src/contexts/TerminalContext";
import { TimelineContext } from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import useCurrentPauseIdSuspense from "bvaughn-architecture-demo/src/hooks/useCurrentPauseIdSuspense";
import { getFramesSuspense } from "bvaughn-architecture-demo/src/suspense/FrameCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Icon from "../Icon";
import { ConsoleSearchContext } from "./ConsoleSearchContext";
import styles from "./Input.module.css";

export default function Input() {
  const replayClient = useContext(ReplayClientContext);
  const [searchState, searchActions] = useContext(ConsoleSearchContext);
  const { addMessage } = useContext(TerminalContext);
  const { executionPoint, time } = useContext(TimelineContext);

  const ref = useRef<HTMLInputElement>(null);
  const searchStateVisibleRef = useRef(false);

  useEffect(() => {
    if (!searchState.visible && searchStateVisibleRef.current) {
      ref?.current?.focus();
    }

    searchStateVisibleRef.current = searchState.visible;
  }, [searchState.visible]);

  const { selectedPauseAndFrameId } = useContext(SelectedFrameContext);
  let pauseId: PauseId | null = useCurrentPauseIdSuspense();
  let frameId: FrameId | null = null;
  if (selectedPauseAndFrameId) {
    pauseId = selectedPauseAndFrameId.pauseId;
    frameId = selectedPauseAndFrameId.frameId;
  } else {
    if (pauseId) {
      const frames = getFramesSuspense(replayClient, pauseId);
      frameId = frames?.[0]?.frameId ?? null;
    }
  }

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
      case "f":
      case "F": {
        if (event.ctrlKey || event.metaKey) {
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
        disabled={pauseId === null}
        onKeyDown={onKeyDown}
        ref={ref}
        type="text"
      />
    </div>
  );
}
