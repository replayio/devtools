import { FrameId, PauseId } from "@replayio/protocol";
import { ReactNode, Suspense, useContext } from "react";

import Inspector from "replay-next/components/inspector";
import ClientValueValueRenderer from "replay-next/components/inspector/values/ClientValueValueRenderer";
import { SelectedFrameContext } from "replay-next/src/contexts/SelectedFrameContext";
import { evaluateSuspense } from "replay-next/src/suspense/PauseCache";
import { primitiveToClientValue } from "replay-next/src/utils/protocol";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./EagerEvaluationResult.module.css";

export default function EagerEvaluationResult({
  cacheKey,
  expression,
}: {
  cacheKey: string;
  expression: string;
}) {
  const { selectedPauseAndFrameId } = useContext(SelectedFrameContext);

  let pauseId: PauseId | null = null;
  let frameId: FrameId | null = null;
  if (selectedPauseAndFrameId) {
    pauseId = selectedPauseAndFrameId.pauseId;
    frameId = selectedPauseAndFrameId.frameId;
  }

  if (pauseId === null) {
    return null;
  }

  return (
    <Suspense>
      <EagerEvaluationResultSuspends
        cacheKey={cacheKey}
        expression={expression}
        pauseId={pauseId}
        frameId={frameId}
      />
    </Suspense>
  );
}

function EagerEvaluationResultSuspends({
  cacheKey,
  expression,
  frameId,
  pauseId,
}: {
  cacheKey: string;
  expression: string;
  frameId: FrameId | null;
  pauseId: PauseId;
}) {
  const client = useContext(ReplayClientContext);

  const result = evaluateSuspense(pauseId, frameId, expression, cacheKey, client);
  const { exception, returned } = result;

  let children: ReactNode | null = null;
  if (exception) {
    return null;
  } else if (returned) {
    if (returned.object) {
      children = <Inspector context="console" pauseId={pauseId} protocolValue={returned} />;
    } else {
      const clientValue = primitiveToClientValue(returned.value);
      if (clientValue.type === "undefined") {
        return null;
      }

      children = (
        <ClientValueValueRenderer
          clientValue={clientValue}
          context="console"
          disableExpandStringToggle={true}
        />
      );
    }
  }

  return (
    <div className={styles.Wrapper} data-test-id="ConsoleTerminalInputEagerEvaluationResult">
      {children}
    </div>
  );
}
