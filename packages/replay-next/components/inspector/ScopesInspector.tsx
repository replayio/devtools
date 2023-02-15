import { NamedValue, PauseId } from "@replayio/protocol";
import { Suspense } from "react";

import Expandable from "replay-next/components/Expandable";
import Loader from "replay-next/components/Loader";

import Inspector from "./Inspector";
import { addPathSegment } from "./PropertiesRenderer";
import styles from "./ScopesInspector.module.css";

export default function ScopesInspector({
  expandByDefault,
  name,
  path,
  pauseId,
  protocolValues,
}: {
  expandByDefault?: boolean;
  name: string;
  path?: string;
  pauseId: PauseId;
  protocolValues: NamedValue[];
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
              path={addPathSegment(path, protocolValue.name)}
              pauseId={pauseId}
              protocolValue={protocolValue}
            />
          ))}
          defaultOpen={expandByDefault}
          header={name}
          persistenceKey={path}
        />
      </Suspense>
    </div>
  );
}
