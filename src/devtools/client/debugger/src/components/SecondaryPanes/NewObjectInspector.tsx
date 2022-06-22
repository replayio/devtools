import { NamedValue as ProtocolNamedValue } from "@replayio/protocol";
import Inspector from "bvaughn-architecture-demo/components/inspector";
import Collapsible from "bvaughn-architecture-demo/components/inspector/Collapsible";
import Loader from "bvaughn-architecture-demo/components/Loader";
import "bvaughn-architecture-demo/pages/inspector.css";
import { clientValueToProtocolNamedValue } from "bvaughn-architecture-demo/src/utils/protocol";
import { ContainerItem, ValueItem } from "devtools/packages/devtools-reps";
import { ThreadFront } from "protocol/thread";
import { ReactNode, Suspense, useMemo } from "react";

export default function NewObjectInspector({ roots }: { roots: Array<ContainerItem | ValueItem> }) {
  const pause = ThreadFront.currentPause;

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
            <Collapsible
              key={index}
              header={root.name}
              children={protocolValues.map((protocolValue, index) => (
                <Inspector key={index} pauseId={pause.pauseId!} protocolValue={protocolValue} />
              ))}
            />
          );
          break;
        }
        case "value": {
          const protocolValue = clientValueToProtocolNamedValue(root);
          children.push(
            <Inspector key={index} pauseId={pause.pauseId!} protocolValue={protocolValue} />
          );
          break;
        }
      }
    });

    return children;
  }, [pause, roots]);

  return (
    <div className="preview-popup">
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </div>
  );
}
