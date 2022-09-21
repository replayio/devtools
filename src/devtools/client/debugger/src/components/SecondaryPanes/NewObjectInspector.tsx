import { NamedValue as ProtocolNamedValue } from "@replayio/protocol";
import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Loader from "bvaughn-architecture-demo/components/Loader";
import Inspector from "bvaughn-architecture-demo/components/inspector/Inspector";
import ScopesInspector from "bvaughn-architecture-demo/components/inspector/ScopesInspector";
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
  const selectedFrame = useAppSelector(getSelectedFrame);
  const pause = ThreadFront.pauseForAsyncIndex(selectedFrame?.asyncIndex);

  // TODO [FE-747]
  // TODO [FE-754] Migrate most of this to ScopesInspector

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
            <ScopesInspector
              key={index}
              name={root.name}
              pauseId={pause.pauseId!}
              protocolValues={protocolValues}
            />
          );
          break;
        }
        case "value": {
          const protocolValue = clientValueToProtocolNamedValue(root);
          children.push(
            <Inspector
              key={index}
              context="default"
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
