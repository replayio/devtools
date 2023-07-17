import { NamedValue, PauseId } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import Expandable from "replay-next/components/Expandable";
import Loader from "replay-next/components/Loader";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { suspendInParallel } from "replay-next/src/utils/suspense";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

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
  const client = useContext(ReplayClientContext);
  suspendInParallel(
    ...protocolValues.map(value => () => {
      if (value.object) {
        objectCache.read(client, pauseId, value.object, "full");
      }
    })
  );

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
