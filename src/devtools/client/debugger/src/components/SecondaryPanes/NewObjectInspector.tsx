import { NamedValue as ProtocolNamedValue } from "@replayio/protocol";
import Inspector from "bvaughn-architecture-demo/components/inspector";
import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Expandable from "bvaughn-architecture-demo/components/Expandable";
import Loader from "bvaughn-architecture-demo/components/Loader";
import "bvaughn-architecture-demo/pages/variables.css";
import { clientValueToProtocolNamedValue } from "bvaughn-architecture-demo/src/utils/protocol";
import InspectorContextReduxAdapter from "devtools/client/debugger/src/components/shared/InspectorContextReduxAdapter";
import { getSelectedFrame } from "devtools/client/debugger/src/selectors/pause";
import { Item } from "devtools/packages/devtools-reps";
import { ThreadFront } from "protocol/thread";
import { ReactNode, Suspense, useMemo } from "react";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./NewObjectInspector.module.css";

export default function NewObjectInspector({ roots }: { roots: Item[] }) {
  console.log("<NewObjectInspector>", roots);
  const selectedFrame = useAppSelector(getSelectedFrame);
  const pause = ThreadFront.pauseForAsyncIndex(selectedFrame?.asyncIndex);

  // HACK
  // The new Object Inspector does not consume ValueFronts.
  // It works with the Replay protocol's Value objects directly.
  // At the moment this means that we need to convert the ValueFront back to a protocol Value.
  const children: ReactNode[] | null = useMemo(() => {
    if (pause == null || pause.pauseId == null) {
      return null;
    }

    const children: ReactNode[] = [];

    roots.forEach((root: Item, index) => {
      switch (root.type) {
        case "container": {
          const protocolValues: ProtocolNamedValue[] = root.contents.map(
            clientValueToProtocolNamedValue
          );
          children.push(
            <Expandable
              key={index}
              header={root.name}
              children={protocolValues.map((protocolValue, index) => (
                <Inspector
                  context="default"
                  key={index}
                  pauseId={pause.pauseId!}
                  protocolValue={protocolValue}
                />
              ))}
            />
          );
          break;
        }
        case "value": {
          const protocolValue = clientValueToProtocolNamedValue(root);
          children.push(
            <Inspector
              context="default"
              key={index}
              pauseId={pause.pauseId!}
              protocolValue={protocolValue}
            />
          );
          break;
        }
      }
    });

    return children;
  }, [pause, roots]);

  return (
    <ErrorBoundary>
      <InspectorContextReduxAdapter>
        <div className={`${styles.Popup} preview-popup`}>
          <Suspense fallback={<Loader />}>{children}</Suspense>
        </div>
      </InspectorContextReduxAdapter>
    </ErrorBoundary>
  );
}
