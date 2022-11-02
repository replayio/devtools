import {
  MouseEvent,
  ReactNode,
  Suspense,
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Icon from "bvaughn-architecture-demo/components/Icon";
import Inspector from "bvaughn-architecture-demo/components/inspector";
import ClientValueValueRenderer from "bvaughn-architecture-demo/components/inspector/values/ClientValueValueRenderer";
import Loader from "bvaughn-architecture-demo/components/Loader";
import SyntaxHighlightedExpression from "bvaughn-architecture-demo/components/SyntaxHighlightedExpression";
import { ConsoleFiltersContext } from "bvaughn-architecture-demo/src/contexts/ConsoleFiltersContext";
import { InspectableTimestampedPointContext } from "bvaughn-architecture-demo/src/contexts/InspectorContext";
import { TerminalExpression } from "bvaughn-architecture-demo/src/contexts/TerminalContext";
import { TimelineContext } from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import { evaluateSuspense } from "bvaughn-architecture-demo/src/suspense/PauseCache";
import { primitiveToClientValue } from "bvaughn-architecture-demo/src/utils/protocol";
import { formatTimestamp } from "bvaughn-architecture-demo/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { ConsoleContextMenuContext } from "../ConsoleContextMenuContext";
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
  const { show } = useContext(ConsoleContextMenuContext);
  const { showTimestamps } = useContext(ConsoleFiltersContext);
  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);

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

  const showContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    show(terminalExpression, { x: event.pageX, y: event.pageY });
  };

  return (
    <div
      className={className}
      data-search-index={index}
      data-test-message-type="terminal-expression"
      data-test-paused-here={terminalExpression.point === currentExecutionPoint}
      data-test-name="Message"
      onContextMenu={showContextMenu}
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
            <SyntaxHighlightedExpression expression={terminalExpression.expression} />
          </span>
          <span className={styles.LogContents} data-test-name="TerminalExpression-Result">
            <Icon className={styles.EagerEvaluationIcon} type="eager-evaluation" />
            <Suspense fallback={<Loader />}>
              <EvaluatedContent terminalExpression={terminalExpression} />
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

  const result = evaluateSuspense(client, pauseId, frameId, terminalExpression.expression);
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
