import Inspector from "@bvaughn/components/inspector";
import Expandable from "@bvaughn/components/Expandable";
import Loader from "@bvaughn/components/Loader";
import "@bvaughn/pages/variables.css";
import { clientValueToProtocolNamedValue } from "@bvaughn/src/utils/protocol";
import { NamedValue as ProtocolNamedValue } from "@replayio/protocol";
import { ContainerItem, ValueItem } from "devtools/packages/devtools-reps";
import { ThreadFront } from "protocol/thread";
import { ReactNode, Suspense, useMemo } from "react";

import styles from "./NewObjectInspector.module.css";

export default function NewObjectInspector({ roots }: { roots: Array<ContainerItem | ValueItem> }) {
  const pause = ThreadFront.currentPause;
  const executionPoint = ThreadFront.currentPoint;

  // HACK
  // The new Object Inspector does not consume ValueFronts.
  // It works with the Replay protocol's Value objects directly.
  // At the moment this means that we need to convert the ValueFront back to a protocol Value.
  const children: ReactNode[] | null = useMemo(() => {
    if (pause == null || pause.pauseId == null) {
      return null;
    }

    const children: ReactNode[] = [];

    roots.forEach((root: ContainerItem | ValueItem, index) => {
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
                  executionPoint={executionPoint}
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
              executionPoint={executionPoint}
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
  }, [executionPoint, pause, roots]);

  return (
    <div className={`${styles.Popup} preview-popup`}>
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </div>
  );
}
