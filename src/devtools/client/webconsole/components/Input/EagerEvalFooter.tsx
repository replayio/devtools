import { Value } from "@replayio/protocol";
import debounce from "lodash/debounce";
import React, { FC, Suspense, useContext, useEffect, useMemo, useRef, useState } from "react";

import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Inspector from "bvaughn-architecture-demo/components/inspector";
import Loader from "bvaughn-architecture-demo/components/Loader";
import { getRecordingCapabilitiesSuspense } from "bvaughn-architecture-demo/src/suspense/RecordingCache";
import { useEagerEvaluateExpression } from "devtools/client/webconsole/utils/autocomplete-eager";
import { ThreadFront } from "protocol/thread";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

function useEagerEvalPreview(expression: string) {
  const [value, setValue] = useState<Value | null>(null);
  const expressionRef = useRef(expression);
  const eagerEvaluateExpression = useEagerEvaluateExpression();

  const debouncedUpdateValue = useMemo(
    () =>
      // Debounce the function called from the effect to cut down the number
      // of protocol requests made (only request when the user stops typing)
      debounce(async function updateValue(expression: string) {
        setValue(null);
        const rv = await eagerEvaluateExpression(expression);
        setValue(rv!);
      }, 300),
    [eagerEvaluateExpression]
  );

  useEffect(() => {
    expressionRef.current = expression;
    debouncedUpdateValue(expression);

    return () => {
      debouncedUpdateValue.cancel();
    };
  }, [expression, eagerEvaluateExpression, debouncedUpdateValue]);

  return value;
}

const Preview: FC<{ expression: string }> = ({ expression }) => {
  const previewValue = useEagerEvalPreview(expression);
  if (!previewValue) {
    return null;
  }

  const pause = ThreadFront.currentPause;
  if (!pause || !pause.pauseId) {
    return null;
  }

  return (
    <div className="pointer-events-none relative">
      <div className="overflow-hidden overflow-ellipsis whitespace-pre opacity-50">
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <Inspector context="default" pauseId={pause.pauseId} protocolValue={previewValue} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

type Props = {
  expression: string;
  completedExpression: string | null;
};

function EagerEvalFooterSuspends({ expression, completedExpression }: Props) {
  const replayClient = useContext(ReplayClientContext);
  const recordingCapabilities = getRecordingCapabilitiesSuspense(replayClient);

  if (!recordingCapabilities.supportsEagerEvaluation) {
    return null;
  }

  return (
    <div
      className="message result flex items-center font-mono"
      style={{
        padding: "4px 8px 4px 4px",
        borderTop: "1px solid var(--theme-background",
        borderBottom: "0px",
        minHeight: "var(--editor-footer-height)",
      }}
    >
      {expression ? (
        <>
          <div
            className="icon"
            style={{
              width: `1.5rem`,
              marginInlineStart: `var(--console-icon-horizontal-offset)`,
              marginInlineEnd: `calc(4px - var(--console-icon-horizontal-offset))`,
            }}
          />
          <Preview expression={completedExpression || expression} />
        </>
      ) : null}
    </div>
  );
}

export default function EagerEvalFooter(props: Props) {
  return (
    <Suspense>
      <EagerEvalFooterSuspends {...props} />
    </Suspense>
  );
}
