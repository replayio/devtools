import { NamedValue, PauseId } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import Expandable from "replay-next/components/Expandable";
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
  return (
    <div className={styles.ScopesInspector} data-test-name="ScopesInspector">
      <Expandable
        className={styles.Expandable}
        defaultOpen={expandByDefault}
        header={name}
        persistenceKey={path}
      >
        <Suspense fallback="Loading...">
          <ScopesInspectorChildren path={path} pauseId={pauseId} protocolValues={protocolValues} />
        </Suspense>
      </Expandable>
    </div>
  );
}

function ScopesInspectorChildren({
  path,
  pauseId,
  protocolValues,
}: {
  path?: string;
  pauseId: PauseId;
  protocolValues: NamedValue[];
}) {
  const client = useContext(ReplayClientContext);
  // prefetch the scope values before trying to render them, without this
  // we'd suspend further down in the component tree, which causes a
  // performance issue described in FE-1500
  suspendInParallel(
    ...protocolValues.map(value => () => {
      if (value.object) {
        objectCache.read(client, pauseId, value.object, "full");
      }
    })
  );

  return (
    <>
      {protocolValues.map((protocolValue, index) => (
        <Inspector
          context="default"
          key={index}
          path={addPathSegment(path, protocolValue.name)}
          pauseId={pauseId}
          protocolValue={protocolValue}
        />
      ))}
    </>
  );
}
