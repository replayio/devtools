import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Inspector from "bvaughn-architecture-demo/components/inspector";
import Loader from "bvaughn-architecture-demo/components/Loader";
import "bvaughn-architecture-demo/pages/variables.css";
import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import InspectorContextReduxAdapter from "devtools/client/debugger/src/components/shared/InspectorContextReduxAdapter";
import { Suspense } from "react";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./NewObjectInspector.module.css";
import useClientValue from "bvaughn-architecture-demo/components/inspector/useClientValue";

interface NIOProps {
  expression: string;
  protocolValue: ProtocolValue;
}

export default function NewObjectInspector({ expression, protocolValue }: NIOProps) {
  const pauseId = useAppSelector(state => state.pause.id);

  if (pauseId == null || protocolValue === null) {
    return null;
  }

  return (
    <ErrorBoundary>
      <InspectorContextReduxAdapter>
        <div className={`${styles.Popup} preview-popup`}>
          <Suspense fallback={<Loader />}>
            <>
              <div className={styles.HeaderWrapper}>
                <SuspendingHeader
                  expression={expression}
                  pauseId={pauseId!}
                  protocolValue={protocolValue}
                />
              </div>
              <div className={styles.InspectorWrapper}>
                <Inspector
                  className={styles.Inspector}
                  context="default"
                  expandByDefault={true}
                  pauseId={pauseId!}
                  protocolValue={protocolValue}
                />
              </div>
            </>
          </Suspense>
        </div>
      </InspectorContextReduxAdapter>
    </ErrorBoundary>
  );
}

function SuspendingHeader({
  expression,
  pauseId,
  protocolValue,
}: {
  expression: string;
  pauseId: PauseId;
  protocolValue: ProtocolValue;
}) {
  const clientValue = useClientValue(protocolValue, pauseId);
  console.log("clientValue:", clientValue);

  let header = null;
  switch (clientValue.type) {
    case "array":
      header = "Array";
      break;
    case "date":
      header = "Date";
      break;
    case "error":
      header = "Error";
      break;
    case "function":
      header = "Function";
      break;
    case "html-element":
    case "html-text":
      header = "HTMLElement";
      break;
    case "map":
      header = "Map";
      break;
    case "regexp":
      header = "RegExp";
      break;
    case "set":
      header = "Set";
      break;
    case "object":
      header = "Object";
      break;
  }

  if (header === null) {
    return null;
  }

  return <div className={styles.Header}>{header}</div>;
}
