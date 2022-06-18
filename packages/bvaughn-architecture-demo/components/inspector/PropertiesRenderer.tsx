import { Object as ProtocolObject, PauseId as ProtocolPauseId } from "@replayio/protocol";
import { sortBy } from "lodash";
import { useContext, useMemo } from "react";

import { ReplayClientContext } from "../../src/contexts/ReplayClientContext";
import { getObjectWithPreview } from "../../src/suspense/ObjectPreviews";

import Collapsible from "./Collapsible";
import KeyValueRenderer from "./KeyValueRenderer";

import styles from "./PropertiesRenderer.module.css";

// TODO (inspector) Should we be alpha-sorting properties by name?

// TODO (inspector) Make sure we're handler getter/setter and prototype props correctly.
// e.g. We currently render "length: 0" twice for Arrays.
// Maybe we need to merge and sort these three collections somehow?

// TODO (inspector) Support Array bucketing (e.g. [0...99])
// We can also bucket containerEntries with "[[Entries]]"

// TODO (inspector) Support Map keys (special case)

// Renders a list of key value properties.
// This renderer can be used to show an expanded view of the values inside of Arrays and Objects.
//
// https://static.replay.io/protocol/tot/Pause/#type-Property
export default function PropertiesRenderer({
  object,
  pauseId,
}: {
  object: ProtocolObject;
  pauseId: ProtocolPauseId;
}) {
  const client = useContext(ReplayClientContext);

  // If we have an ObjectPreview already, use it.
  // If we just have an Object, then Suspend while we fetch preview data.
  if (object.preview == null) {
    object = getObjectWithPreview(client, pauseId, object.objectId);
  }

  const containerEntries = object.preview?.containerEntries ?? [];
  const getterValues = object.preview?.getterValues ?? [];
  const sortedProperties = useMemo(
    () => sortBy(object.preview?.properties ?? [], property => property.name),
    [object]
  );

  const prototypeId = object.preview?.prototypeId ?? null;
  let prototype = null;
  if (prototypeId) {
    prototype = getObjectWithPreview(client, pauseId, prototypeId);
  }

  return (
    <>
      {containerEntries.length > 0 && (
        <Collapsible
          defaultOpen={true}
          header={<span className={styles.BucketLabel}>[[Entries]]</span>}
          renderChildren={() =>
            containerEntries.map(({ value }, index) => (
              <KeyValueRenderer
                key={`containerEntry-${index}`}
                layout="vertical"
                pauseId={pauseId}
                protocolValue={value}
              />
            ))
          }
        />
      )}
      {getterValues.map((property, index) => (
        <KeyValueRenderer
          key={`getterValue-${index}`}
          layout="vertical"
          pauseId={pauseId}
          protocolValue={property}
        />
      ))}
      {sortedProperties.map((property, index) => (
        <KeyValueRenderer
          key={`property-${index}`}
          layout="vertical"
          pauseId={pauseId}
          protocolValue={property}
        />
      ))}

      <span className={styles.Prototype}>
        <span className={styles.PrototypeName}>[[Prototype]]</span>
        {prototype !== null ? prototype.className : null}
      </span>
    </>
  );
}
