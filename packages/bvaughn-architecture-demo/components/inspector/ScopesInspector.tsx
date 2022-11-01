import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import Expandable from "bvaughn-architecture-demo/components/Expandable";
import Loader from "bvaughn-architecture-demo/components/Loader";
import { Suspense } from "react";

import Inspector from "./Inspector";
import styles from "./ScopesInspector.module.css";

export default function ScopesInspector({
  name,
  pauseId,
  protocolValues,
}: {
  name: string;
  pauseId: PauseId;
  protocolValues: ProtocolValue[];
}) {
  return (
    <div className={styles.ScopesInspector} data-test-name="ScopesInspector">
      <Suspense fallback={<Loader />}>
        <Expandable
          className={styles.Expandable}
          children={protocolValues.map((protocolValue, index) => (
            <Inspector
              context="default"
              key={index}
              pauseId={pauseId}
              protocolValue={protocolValue}
            />
          ))}
          header={name}
        />
      </Suspense>
    </div>
  );
}
