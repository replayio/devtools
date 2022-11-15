import { FrameId, PauseId } from "@replayio/protocol";
import { Suspense, useContext, useEffect, useRef, useState } from "react";

import Icon from "bvaughn-architecture-demo/components/Icon";
import Loader from "bvaughn-architecture-demo/components/Loader";
import AutoComplete from "bvaughn-architecture-demo/components/sources/AutoComplete/AutoComplete";
import { SelectedFrameContext } from "bvaughn-architecture-demo/src/contexts/SelectedFrameContext";
import { SessionContext } from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { TerminalContext } from "bvaughn-architecture-demo/src/contexts/TerminalContext";
import { TimelineContext } from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import useLoadedRegions from "bvaughn-architecture-demo/src/hooks/useRegions";
import { getFramesSuspense } from "bvaughn-architecture-demo/src/suspense/FrameCache";
import { getPauseIdForExecutionPointSuspense } from "bvaughn-architecture-demo/src/suspense/PauseCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isPointInRegions } from "shared/utils/time";

import { ConsoleSearchContext } from "./ConsoleSearchContext";
import EagerEvaluationResult from "./EagerEvaluationResult";
import useTerminalHistory from "./hooks/useTerminalHistory";
import styles from "./ConsoleInput.module.css";

export default function ConsoleInput() {
  return (
    <Suspense fallback={<Loader />}>
      <ConsoleInputSuspends />
    </Suspense>
  );
}

function ConsoleInputSuspends() {
  const replayClient = useContext(ReplayClientContext);
  const [searchState] = useContext(ConsoleSearchContext);
  const { addMessage } = useContext(TerminalContext);
  const { executionPoint, time } = useContext(TimelineContext);
  const { recordingId } = useContext(SessionContext);

  const loadedRegions = useLoadedRegions(replayClient);

  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [expressionHistory, addExpression] = useTerminalHistory(recordingId);

  const ref = useRef<HTMLInputElement>(null);
  const searchStateVisibleRef = useRef(false);

  const [expression, setExpression] = useState<string>("");

  useEffect(() => {
    if (!searchState.visible && searchStateVisibleRef.current) {
      ref?.current?.focus();
    }

    searchStateVisibleRef.current = searchState.visible;
  }, [searchState.visible]);

  const { selectedPauseAndFrameId } = useContext(SelectedFrameContext);
  let pauseId: PauseId | null = null;
  let frameId: FrameId | null = null;
  if (selectedPauseAndFrameId) {
    pauseId = selectedPauseAndFrameId.pauseId;
    frameId = selectedPauseAndFrameId.frameId;
  } else {
    const isLoaded =
      loadedRegions !== null && isPointInRegions(executionPoint, loadedRegions.loaded);
    if (isLoaded) {
      pauseId = getPauseIdForExecutionPointSuspense(replayClient, executionPoint);
      const frames = getFramesSuspense(replayClient, pauseId);
      frameId = frames?.[0]?.frameId ?? null;
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();

        if (historyIndex !== null) {
          if (historyIndex + 1 < expressionHistory.length) {
            const newIndex = historyIndex + 1;
            const newExpression = expressionHistory[newIndex];

            setHistoryIndex(newIndex);
            setExpression(newExpression);
          } else {
            setHistoryIndex(null);
            setExpression("");
          }
        }
        break;
      }
      case "ArrowUp": {
        event.preventDefault();

        let newIndex = null;
        let newExpression = null;

        if (historyIndex === null) {
          newIndex = expressionHistory.length - 1;
          newExpression = expressionHistory[newIndex];
        } else {
          newIndex = historyIndex - 1;
          newExpression = expressionHistory[newIndex];
        }

        if (newIndex >= 0 && newExpression != null) {
          setHistoryIndex(newIndex);
          setExpression(newExpression);
        }
        break;
      }
    }
  };

  const onChange = (newExpression: string) => {
    setExpression(newExpression);
  };

  const onSubmit = () => {
    if (expression.trim() !== "") {
      addMessage({
        expression,
        frameId: frameId!,
        pauseId: pauseId!,
        point: executionPoint || "",
        time: time || 0,
      });

      setHistoryIndex(null);
      addExpression(expression);

      setExpression("");
    }
  };

  return (
    <div className={styles.Container}>
      <div className={styles.PromptRow} onKeyDown={onKeyDown}>
        <Icon className={styles.Icon} type="terminal-prompt" />
        <AutoComplete
          className={styles.Input}
          dataTestId="ConsoleTerminalInput"
          onCancel={noop}
          onChange={onChange}
          onSubmit={onSubmit}
          value={expression}
        />
      </div>
      <div className={styles.ResultRow}>
        {expression !== "" && <Icon className={styles.Icon} type="terminal-result" />}
        <EagerEvaluationResult expression={expression} />
      </div>
    </div>
  );
}

function noop() {}
