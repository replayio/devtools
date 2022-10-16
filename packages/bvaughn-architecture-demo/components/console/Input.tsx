import { TerminalContext } from "@bvaughn/src/contexts/TerminalContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import useCurrentPause from "@bvaughn/src/hooks/useCurrentPause";
import { FrameId, PauseId } from "@replayio/protocol";
import { useContext, useEffect, useRef } from "react";

import Icon from "../Icon";

import styles from "./Input.module.css";
import { ConsoleSearchContext } from "./ConsoleSearchContext";

export default function Input() {
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

  const pause = useCurrentPause();

  let frameId: FrameId | null = null;
  let pauseId: PauseId | null = null;
  if (pause) {
    frameId = pause.data.frames?.[0]?.frameId ?? null;
    pauseId = pause.pauseId;
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
        disabled={pauseId === null}
        onKeyDown={onKeyDown}
        ref={ref}
        type="text"
      />
    </div>
  );
}
