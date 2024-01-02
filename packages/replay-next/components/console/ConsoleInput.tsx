import { ExecutionPoint, FrameId, PauseId, TimeStampedPointRange } from "@replayio/protocol";
import { RefObject, Suspense, useContext, useEffect, useMemo, useRef, useState } from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import Icon from "replay-next/components/Icon";
import CodeEditor, { ImperativeHandle } from "replay-next/components/lexical/CodeEditor";
import Loader from "replay-next/components/Loader";
import { getPauseAndFrameIdAsync } from "replay-next/components/sources/utils/getPauseAndFrameId";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SelectedFrameContext } from "replay-next/src/contexts/SelectedFrameContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { NewTerminalExpression, TerminalContext } from "replay-next/src/contexts/TerminalContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { useCurrentFocusWindow } from "replay-next/src/hooks/useCurrentFocusWindow";
import { useIsPointWithinFocusWindow } from "replay-next/src/hooks/useIsPointWithinFocusWindow";
import { validateCode } from "replay-next/src/utils/code";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";

import { ConsoleSearchContext } from "./ConsoleSearchContext";
import EagerEvaluationResult from "./EagerEvaluationResult";
import useTerminalHistory from "./hooks/useTerminalHistory";
import styles from "./ConsoleInput.module.css";

export default function ConsoleInput({ inputRef }: { inputRef?: RefObject<ImperativeHandle> }) {
  const { executionPoint } = useContext(TimelineContext);
  const { enterFocusMode } = useContext(FocusContext);

  const isPointWithinFocusWindow = useIsPointWithinFocusWindow(executionPoint);

  let disabledMessage = null;
  let disabledReason = undefined;
  if (executionPoint && !isPointWithinFocusWindow) {
    disabledReason = "not-focused";
    disabledMessage = (
      <>
        Paused outside of the{" "}
        <span className={styles.DisabledMessage} onClick={enterFocusMode}>
          debugging window
        </span>
      </>
    );
  }

  if (disabledMessage) {
    return (
      <div className={styles.Container}>
        <div className={styles.PromptRow}>
          <Icon className={styles.Icon} type="terminal-prompt" />
          <div className={styles.Input} data-disabled-reason={disabledReason}>
            {disabledMessage}
          </div>
        </div>
        <div className={styles.ResultRow}> </div>
      </div>
    );
  }

  return (
    <InlineErrorBoundary
      name="ConsoleInput"
      resetKey={executionPoint ?? ""}
      fallback={<ErrorFallback />}
    >
      <Suspense fallback={<Loader />}>
        <ConsoleInputSuspends inputRef={inputRef} />
      </Suspense>
    </InlineErrorBoundary>
  );
}

function ConsoleInputSuspends({ inputRef }: { inputRef?: RefObject<ImperativeHandle> }) {
  const [searchState] = useContext(ConsoleSearchContext);
  const { selectedPauseAndFrameId } = useContext(SelectedFrameContext);
  const replayClient = useContext(ReplayClientContext);
  const { recordingId } = useContext(SessionContext);
  const { addMessage } = useContext(TerminalContext);
  const { executionPoint, time } = useContext(TimelineContext);

  const focusWindow = useCurrentFocusWindow();

  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [expressionHistory, addExpression] = useTerminalHistory(recordingId);
  const [incrementedKey, setIncrementedKey] = useState(0);

  const ref = useRef<HTMLInputElement>(null);
  const searchStateVisibleRef = useRef(false);

  const [expression, setExpression] = useState<string>("");

  const isExpressionValid = useMemo(() => validateCode(expression), [expression]);

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
    if (!executionPoint || !isExpressionValid) {
      return;
    }

    const trimmedExpression = expression.trim();
    if (trimmedExpression === "") {
      return;
    }

    // Don't block on loading Pause and Frame data.
    addMessageAsync(
      addMessage,
      trimmedExpression,
      replayClient,
      selectedPauseAndFrameId?.pauseId ?? null,
      selectedPauseAndFrameId?.frameId ?? null,
      executionPoint,
      time,
      focusWindow
    );

    setHistoryIndex(null);
    addExpression(expression);
    setExpression("");
    setIncrementedKey(incrementedKey + 1);
  };

  // Don't auto-focus the Console input on the initial render.
  // But if we recreate it (after the user types Enter or up/down arrow)
  // then we want focus to "stay" in the input.
  const autoFocus = incrementedKey > 0;

  return (
    <div className={styles.Container} data-invalid-expression={!isExpressionValid || undefined}>
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

async function addMessageAsync(
  addMessage: (partialTerminalExpression: NewTerminalExpression) => void,
  expression: string,
  replayClient: ReplayClientInterface,
  pauseId: PauseId | null,
  frameId: FrameId | null,
  executionPoint: ExecutionPoint,
  time: number,
  focusWindow: TimeStampedPointRange | null
): Promise<void> {
  if (!pauseId) {
    const pauseAndFrameId = await getPauseAndFrameIdAsync(
      replayClient,
      executionPoint,
      time,
      focusWindow,
      false
    );
    if (pauseAndFrameId) {
      pauseId = pauseAndFrameId.pauseId;
      frameId = pauseAndFrameId.frameId;
    }
  }

  if (!pauseId) {
    // Unexpected edge case.
    // In this case, the getPauseAndFrameIdSuspends() will log Error info to the console.
    return;
  }

  addMessage({
    expression,
    frameId,
    pauseId,
    point: executionPoint,
    time,
  });
}
