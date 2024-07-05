import {
  ReactNode,
  Suspense,
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useConsoleContextMenu from "replay-next/components/console/useConsoleContextMenu";
import Icon from "replay-next/components/Icon";
import Inspector from "replay-next/components/inspector";
import ClientValueValueRenderer from "replay-next/components/inspector/values/ClientValueValueRenderer";
import Loader from "replay-next/components/Loader";
import { SyntaxHighlighter } from "replay-next/components/SyntaxHighlighter/SyntaxHighlighter";
import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";
import { InspectableTimestampedPointContext } from "replay-next/src/contexts/InspectorContext";
import { TerminalExpression } from "replay-next/src/contexts/TerminalContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { pauseEvaluationsCache } from "replay-next/src/suspense/PauseCache";
import { primitiveToClientValue } from "replay-next/src/utils/protocol";
import { formatTimestamp } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import MessageHoverButton from "../MessageHoverButton";
import styles from "./shared.module.css";

function TerminalExpressionRenderer({
  index,
  isFocused,
  terminalExpression,
}: {
  index: number;
  isFocused: boolean;
  terminalExpression: TerminalExpression;
}) {
  const { showTimestamps } = useContext(ConsoleFiltersContext);
  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);

  const { contextMenu, onContextMenu } = useConsoleContextMenu(terminalExpression);

  const [isHovered, setIsHovered] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Always scroll new expressions into view.
    // These aren't persisted between sessions, so we only need to handle the simple case:
    // A user has just added a new expression (and it should be scrolled into view).
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  let className = styles.Row;
  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  return (
    <>
      <div
        className={className}
        data-search-index={index}
        data-test-message-type="terminal-expression"
        data-test-paused-here={terminalExpression.point === currentExecutionPoint}
        data-test-name="Message"
        onContextMenu={onContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={ref}
        role="listitem"
      >
        <span
          className={
            showTimestamps
              ? styles.TerminalPrimaryRowWithTimestamps
              : styles.TerminalPrimaryRowWithoutTimestamps
          }
        >
          {showTimestamps && (
            <span className={styles.TimeStamp}>
              {formatTimestamp(terminalExpression.time, true)}{" "}
            </span>
          )}
          <span className={styles.TerminalLogContents} data-test-name="LogContents">
            <span className={styles.LogContents} data-test-name="TerminalExpression-Expression">
              <Icon className={styles.PromptIcon} type="prompt" />
              <Suspense fallback={<Loader />}>
                <div className={styles.TerminalExpressionLines}>
                  <SyntaxHighlighter code={terminalExpression.expression} fileExtension=".js" />
                </div>
              </Suspense>
            </span>
            <span className={styles.LogContents} data-test-name="TerminalExpression-Result">
              <Icon className={styles.EagerEvaluationIcon} type="eager-evaluation" />
              <Suspense fallback={<Loader />}>
                <EvaluatedContent terminalExpression={{ ...terminalExpression, expression: "" }} />
              </Suspense>
            </span>
          </span>
        </span>

        {isHovered && (
          <MessageHoverButton
            executionPoint={terminalExpression.point}
            locations={null}
            showAddCommentButton={false}
            time={terminalExpression.time}
          />
        )}
      </div>
      {contextMenu}
    </>
  );
}
function EvaluatedContent({ terminalExpression }: { terminalExpression: TerminalExpression }) {
  const client = useContext(ReplayClientContext);

  const { frameId, pauseId, point, time } = terminalExpression;

  const context = useMemo(
    () => ({
      executionPoint: point,
      time,
    }),
    [point, time]
  );

  // We pass the id of the terminal expression so that each evaluation is cached separately.
  // See FE-1111 for an example of why this is beneficial.
  const result = pauseEvaluationsCache.read(
    client,
    pauseId,
    frameId,
    terminalExpression.expression,
    "" + terminalExpression.id
  );
  const { exception, returned } = result;

  let children: ReactNode | null = null;
  if (exception) {
    children = <Inspector context="console" pauseId={pauseId} protocolValue={exception} />;
  } else if (returned) {
    children = returned.value ? (
      <ClientValueValueRenderer
        clientValue={primitiveToClientValue(returned.value)}
        context="console"
      />
    ) : (
      <Inspector context="console" pauseId={pauseId} protocolValue={returned} />
    );
  }

  if (children !== null) {
    return (
      <InspectableTimestampedPointContext.Provider value={context}>
        {children}
      </InspectableTimestampedPointContext.Provider>
    );
  }

  // Assume the evaluation failed (even if not explicitly)
  return (
    <span className={styles.Exception}>
      <Icon className={styles.ErrorIcon} type="error" />
      The expression could not be evaluated.
    </span>
  );
}

export default memo(TerminalExpressionRenderer) as typeof TerminalExpressionRenderer;
