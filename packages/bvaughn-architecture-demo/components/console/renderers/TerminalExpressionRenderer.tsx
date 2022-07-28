import Icon from "@bvaughn/components/Icon";
import KeyValueRenderer from "@bvaughn/components/inspector/KeyValueRenderer";
import ClientValueValueRenderer from "@bvaughn/components/inspector/values/ClientValueValueRenderer";
import Loader from "@bvaughn/components/Loader";
import SyntaxHighlightedExpression from "@bvaughn/components/SyntaxHighlightedExpression";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { InspectableTimestampedPointContext } from "@bvaughn/src/contexts/InspectorContext";
import { TerminalExpression } from "@bvaughn/src/contexts/TerminalContext";
import { evaluate } from "@bvaughn/src/suspense/PauseCache";
import { primitiveToClientValue } from "@bvaughn/src/utils/protocol";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import {
  memo,
  MouseEvent,
  ReactNode,
  Suspense,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

  const [isHovered, setIsHovered] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ block: "nearest" });
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
      data-test-name="Message"
      onContextMenu={showContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={ref}
      role="listitem"
    >
      <div
        className={
          showTimestamps
            ? styles.TerminalPrimaryRowWithTimestamps
            : styles.TerminalPrimaryRowWithoutTimestamps
        }
      >
        {showTimestamps && (
          <span className={styles.TimeStamp}>{formatTimestamp(terminalExpression.time, true)}</span>
        )}
        <div className={styles.TerminalLogContents}>
          <div className={styles.LogContents}>
            <Icon className={styles.PromptIcon} type="prompt" />
            <SyntaxHighlightedExpression expression={terminalExpression.expression} />
          </div>
          <div className={styles.LogContents}>
            <Icon className={styles.EagerEvaluationIcon} type="eager-evaluation" />
            <Suspense fallback={<Loader />}>
              <EvaluatedContent terminalExpression={terminalExpression} />
            </Suspense>
          </div>
        </div>
      </div>

      {isHovered && (
        <MessageHoverButton
          executionPoint={terminalExpression.point}
          location={null}
          pauseId={terminalExpression.pauseId}
          showAddCommentButton={false}
          targetRef={ref}
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

  const result = evaluate(client, pauseId, frameId, terminalExpression.expression);
  const { exception, returned } = result;

  let children: ReactNode | null = null;
  if (exception) {
    children = (
      <KeyValueRenderer
        isNested={false}
        layout="horizontal"
        pauseId={pauseId}
        protocolValue={exception}
      />
    );
  } else if (returned) {
    children = returned.value ? (
      <ClientValueValueRenderer
        clientValue={primitiveToClientValue(returned.value)}
        isNested={false}
      />
    ) : (
      <KeyValueRenderer
        isNested={false}
        layout="horizontal"
        pauseId={pauseId}
        protocolValue={returned}
      />
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
    <div className={styles.Exception}>
      <Icon className={styles.ErrorIcon} type="error" />
      The expression could not be evaluated.
    </div>
  );
}

export default memo(TerminalExpressionRenderer) as typeof TerminalExpressionRenderer;
