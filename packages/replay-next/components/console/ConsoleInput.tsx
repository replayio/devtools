import { FrameId, PauseId } from "@replayio/protocol";
import { Suspense, useContext, useEffect, useRef, useState } from "react";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import Icon from "replay-next/components/Icon";
import CodeEditor from "replay-next/components/lexical/CodeEditor";
import Loader from "replay-next/components/Loader";
import { SelectedFrameContext } from "replay-next/src/contexts/SelectedFrameContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TerminalContext } from "replay-next/src/contexts/TerminalContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import useLoadedRegions from "replay-next/src/hooks/useRegions";
import { getFramesSuspense } from "replay-next/src/suspense/FrameCache";
import { getPauseIdSuspense } from "replay-next/src/suspense/PauseCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isThennable } from "shared/proxy/utils";
import { isPointInRegions } from "shared/utils/time";

import { ConsoleSearchContext } from "./ConsoleSearchContext";
import EagerEvaluationResult from "./EagerEvaluationResult";
import useTerminalHistory from "./hooks/useTerminalHistory";
import styles from "./ConsoleInput.module.css";

export default function ConsoleInput() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<Loader />}>
        <ConsoleInputSuspends />
      </Suspense>
    </ErrorBoundary>
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
  const [incrementedKey, setIncrementedKey] = useState(0);

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
      pauseId = getPauseIdSuspense(replayClient, executionPoint, time);
      try {
        const frames = getFramesSuspense(replayClient, pauseId);
        frameId = frames?.[0]?.frameId ?? null;
      } catch (errorOrPromise) {
        if (isThennable(errorOrPromise)) {
          throw errorOrPromise;
        }
      }
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.defaultPrevented) {
      return;
    }

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

          setIncrementedKey(incrementedKey + 1);
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
          setIncrementedKey(incrementedKey + 1);
        }
        break;
      }
    }
  };

  const onChange = (newExpression: string) => {
    setExpression(newExpression);
  };

  const onSubmit = (expression: string) => {
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
      setIncrementedKey(incrementedKey + 1);
    }
  };

  // Don't auto-focus the Console input on the initial render.
  // But if we recreate it (after the user types Enter or up/down arrow)
  // then we want focus to "stay" in the input.
  const autoFocus = incrementedKey > 0;

  return (
    <div className={styles.Container}>
      <div className={styles.PromptRow} onKeyDown={onKeyDown}>
        <Icon className={styles.Icon} type="terminal-prompt" />
        <div className={styles.Input}>
          <CodeEditor
            autoFocus={autoFocus}
            dataTestId="ConsoleTerminalInput"
            editable={true}
            initialValue={expression}
            key={incrementedKey}
            onChange={onChange}
            onSave={onSubmit}
            pauseAndFrameId={selectedPauseAndFrameId}
          />
        </div>
      </div>
      <div className={styles.ResultRow}>
        {expression !== "" && <Icon className={styles.Icon} type="terminal-result" />}
        <EagerEvaluationResult cacheKey={"" + incrementedKey} expression={expression} />
      </div>
    </div>
  );
}

function ErrorFallback() {
  return (
    <div className={styles.FallbackState}>
      <Icon className={styles.Icon} type="terminal-prompt" />
      Input disabled for session because of an error
    </div>
  );
}
