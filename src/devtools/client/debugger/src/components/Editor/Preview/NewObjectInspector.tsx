import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Inspector from "bvaughn-architecture-demo/components/inspector";
import Loader from "bvaughn-architecture-demo/components/Loader";
import "bvaughn-architecture-demo/pages/variables.css";
import { clientValueToProtocolValue } from "bvaughn-architecture-demo/src/utils/protocol";
import { Value as ProtocolValue } from "@replayio/protocol";
import InspectorContextReduxAdapter from "devtools/client/debugger/src/components/shared/InspectorContextReduxAdapter";
import { ThreadFront } from "protocol/thread";
import { Suspense, useMemo } from "react";
import { useAppSelector } from "ui/setup/hooks";

import { getPreview } from "../../../selectors";

import styles from "./NewObjectInspector.module.css";

export default function NewObjectInspector() {
  const preview = useAppSelector(getPreview);
  const pause = ThreadFront.currentPause;

  // HACK
  // The new Object Inspector does not consume ValueFronts.
  // It works with the Replay protocol's Value objects directly.
  // At the moment this means that we need to convert the ValueFront back to a protocol Value.
  const protocolValue: ProtocolValue | null = useMemo(() => {
    if (preview == null || !preview.hasOwnProperty("root") == null) {
      return null;
    }

    // TODO [bvaughn] preview.root is not a type that clientValueToProtocolNamedValue() was written for
    // We should create a different adapter function for this
    return clientValueToProtocolValue(preview?.root);
  }, [preview]);

  if (pause == null || pause.pauseId == null || protocolValue === null) {
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
              pauseId={pause.pauseId!}
              protocolValue={protocolValue}
            />{" "}
          </Suspense>
        </div>
      </InspectorContextReduxAdapter>
    </ErrorBoundary>
  );
}
