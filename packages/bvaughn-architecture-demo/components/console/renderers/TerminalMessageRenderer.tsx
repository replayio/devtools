import Icon from "@bvaughn/components/Icon";
import KeyValueRenderer from "@bvaughn/components/inspector/KeyValueRenderer";
import ClientValueValueRenderer from "@bvaughn/components/inspector/values/ClientValueValueRenderer";
import Loader from "@bvaughn/components/Loader";
import SyntaxHighlightedExpression from "@bvaughn/components/SyntaxHighlightedExpression";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { TerminalMessage } from "@bvaughn/src/contexts/TerminalContext";
import {
  evaluate,
  getPauseData,
  getPauseForExecutionPoint,
} from "@bvaughn/src/suspense/PauseCache";
import { primitiveToClientValue } from "@bvaughn/src/utils/protocol";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import { memo, Suspense, useContext, useLayoutEffect, useRef } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./shared.module.css";

function TerminalMessageRenderer({
  isFocused,
  terminalMessage,
}: {
  isFocused: boolean;
  terminalMessage: TerminalMessage;
}) {
  const { showTimestamps } = useContext(ConsoleFiltersContext);

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

  return (
    <div className={className} data-test-name="Message" ref={ref} role="listitem">
      <div
        className={
          showTimestamps
            ? styles.TerminalPrimaryRowWithTimestamps
            : styles.TerminalPrimaryRowWithoutTimestamps
        }
      >
        {showTimestamps && (
          <span className={styles.TimeStamp}>{formatTimestamp(terminalMessage.time, true)}</span>
        )}
        <div className={styles.TerminalLogContents}>
          <div className={styles.LogContents}>
            <Icon className={styles.PromptIcon} type="prompt" />
            <SyntaxHighlightedExpression expression={terminalMessage.expression} />
          </div>
          <div className={styles.LogContents}>
            <Icon className={styles.EagerEvaluationIcon} type="eager-evaluation" />
            <Suspense fallback={<Loader />}>
              <EvaluatedContent terminalMessage={terminalMessage} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvaluatedContent({ terminalMessage }: { terminalMessage: TerminalMessage }) {
  const client = useContext(ReplayClientContext);

  // HACK
  // The backend requires PauseData to be loaded before the evaluate command.
  // This includes Pauses that have already been assigned ids.
  //
  // TODO (FE-337) This seems wrong for frameId?
  // We should probably expect this to be passed in explicitly (and so probably also pauseId)?
  let frameId = terminalMessage.frameId;
  let pauseId = terminalMessage.pauseId;
  if (pauseId === null) {
    const pauseData = getPauseForExecutionPoint(client, terminalMessage.point);
    frameId = pauseData.stack?.[0] ?? null;
    pauseId = pauseData.pauseId;
  } else {
    getPauseData(client, pauseId);
  }

  const result = evaluate(client, pauseId, frameId, terminalMessage.expression);
  const { exception, returned } = result;
  if (exception) {
    return (
      <KeyValueRenderer
        isNested={false}
        layout="horizontal"
        pauseId={pauseId}
        protocolValue={exception}
      />
    );
  } else if (returned) {
    return returned.value ? (
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

  // Assume the evaluation failed (even if not explicitly)
  return (
    <div className={styles.Exception}>
      <Icon className={styles.ErrorIcon} type="error" />
      The expression could not be evaluated.
    </div>
  );
}

export default memo(TerminalMessageRenderer) as typeof TerminalMessageRenderer;
