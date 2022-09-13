import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Inspector from "bvaughn-architecture-demo/components/inspector";
import Loader from "bvaughn-architecture-demo/components/Loader";
import "bvaughn-architecture-demo/pages/variables.css";
import { Value as ProtocolValue } from "@replayio/protocol";
import InspectorContextReduxAdapter from "devtools/client/debugger/src/components/shared/InspectorContextReduxAdapter";
import { Suspense } from "react";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./NewObjectInspector.module.css";

interface NIOProps {
  protocolValue: ProtocolValue;
}

export default function NewObjectInspector({ protocolValue }: NIOProps) {
  const pauseId = useAppSelector(state => state.pause.id);

  if (pauseId == null || protocolValue === null) {
    return null;
  }

  return (
    <ErrorBoundary>
      <InspectorContextReduxAdapter>
        <div className={`${styles.Popup} preview-popup`}>
          <Suspense fallback={<Loader />}>
            <Inspector
              className={styles.Inspector}
              context="default"
              pauseId={pauseId!}
              protocolValue={protocolValue}
            />{" "}
          </Suspense>
        </div>
      </InspectorContextReduxAdapter>
    </ErrorBoundary>
  );
}
