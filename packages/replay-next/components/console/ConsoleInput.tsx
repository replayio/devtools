import { FrameId, PauseId } from "@replayio/protocol";
import { RefObject, Suspense, useContext, useEffect, useRef, useState } from "react";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import Icon from "replay-next/components/Icon";
import CodeEditor, { ImperativeHandle } from "replay-next/components/lexical/CodeEditor";
import Loader from "replay-next/components/Loader";
import { getPauseAndFrameIdAsync } from "replay-next/components/sources/utils/getPauseAndFrameId";
import { SelectedFrameContext } from "replay-next/src/contexts/SelectedFrameContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TerminalContext } from "replay-next/src/contexts/TerminalContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import useLoadedRegions from "replay-next/src/hooks/useRegions";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { ConsoleSearchContext } from "./ConsoleSearchContext";
import EagerEvaluationResult from "./EagerEvaluationResult";
import useTerminalHistory from "./hooks/useTerminalHistory";
import styles from "./ConsoleInput.module.css";

export default function ConsoleInput({ inputRef }: { inputRef?: RefObject<ImperativeHandle> }) {
  const { executionPoint } = useContext(TimelineContext);
  return (
    <ErrorBoundary resetKey={executionPoint} fallback={<ErrorFallback />}>
      <Suspense fallback={<Loader />}>
        <ConsoleInputSuspends inputRef={inputRef} />
      </Suspense>
    </ErrorBoundary>
  );
}

function ConsoleInputSuspends({ inputRef }: { inputRef?: RefObject<ImperativeHandle> }) {
  const [searchState] = useContext(ConsoleSearchContext);
  const { selectedPauseAndFrameId } = useContext(SelectedFrameContext);
  const replayClient = useContext(ReplayClientContext);
  const { recordingId } = useContext(SessionContext);
  const { addMessage } = useContext(TerminalContext);
  const { executionPoint, time } = useContext(TimelineContext);

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

  const onSubmit = async (expression: string) => {
    let pauseId: PauseId | null = null;
    let frameId: FrameId | null = null;
    if (selectedPauseAndFrameId) {
      pauseId = selectedPauseAndFrameId.pauseId;
      frameId = selectedPauseAndFrameId.frameId;
    } else {
      const pauseAndFrameId = await getPauseAndFrameIdAsync(
        replayClient,
        executionPoint,
        time,
        loadedRegions,
        false
      );
      if (pauseAndFrameId) {
        pauseId = pauseAndFrameId.pauseId;
        frameId = pauseAndFrameId.frameId;
      }
    }

    if (!frameId || !pauseId) {
      // Unexpected edge case.
      // In this case, the getPauseAndFrameIdSuspends() will log Error info to the console.
      return;
    }

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
            context="console"
            dataTestId="ConsoleTerminalInput"
            editable={true}
            executionPoint={executionPoint}
            initialValue={expression}
            key={incrementedKey}
            onChange={onChange}
            onSave={onSubmit}
            ref={inputRef}
            time={time}
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
      Input disabled because of an error
    </div>
  );
}
