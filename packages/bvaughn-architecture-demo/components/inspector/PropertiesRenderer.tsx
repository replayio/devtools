import {
  ContainerEntry as ProtocolContainerEntry,
  Object as ProtocolObject,
  PauseId,
  PauseId as ProtocolPauseId,
} from "@replayio/protocol";
import { sortBy } from "lodash";
import { FC, useContext, useMemo } from "react";

import { ReplayClientContext } from "../../src/contexts/ReplayClientContext";
import { getObjectWithPreview } from "../../src/suspense/ObjectPreviews";
import { filterNonEnumerableProperties } from "../../src/utils/protocol";

import Collapsible from "./Collapsible";
import KeyValueRenderer from "./KeyValueRenderer";
import styles from "./PropertiesRenderer.module.css";
import ValueRenderer from "./ValueRenderer";

// TODO (inspector) Should we be alpha-sorting properties by name?

// TODO (inspector) Make sure we're handler getter/setter and prototype props correctly.
// e.g. We currently render "length: 0" twice for Arrays.
// Maybe we need to merge and sort these three collections somehow?

// TODO (inspector) Support Array bucketing (e.g. [0...99])
// We can also bucket containerEntries with "[[Entries]]"

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

  // TODO (inspector) Support HTMLElement properties:
  // object.preview.node.attributes ("NamedNodeMap")
  // object.preview.nodes.childNodes ("NodeList")
  // object.preview.nodes.style (id)

  const containerEntries = object.preview?.containerEntries ?? [];
  const getterValues = filterNonEnumerableProperties(object.preview?.getterValues ?? []);
  const sortedProperties = useMemo(() => {
    const enumerableProperties = filterNonEnumerableProperties(object.preview?.properties ?? []);
    return sortBy(enumerableProperties, property => property.name);
  }, [object]);

  const prototypeId = object.preview?.prototypeId ?? null;
  let prototype = null;
  if (prototypeId) {
    prototype = getObjectWithPreview(client, pauseId, prototypeId);
  }

  let EntriesRenderer: FC<EntriesRendererProps> = ContainerEntriesRenderer;
  switch (object.className) {
    case "Map":
    case "WeakMap": {
      EntriesRenderer = MapContainerEntriesRenderer;
      break;
    }
    case "Set":
    case "WeakSet": {
      EntriesRenderer = SetContainerEntriesRenderer;
      break;
    }
  }

  return (
    <>
      <EntriesRenderer containerEntries={containerEntries} pauseId={pauseId} />

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

type EntriesRendererProps = {
  containerEntries: ProtocolContainerEntry[];
  pauseId: PauseId;
};

function ContainerEntriesRenderer({ containerEntries, pauseId }: EntriesRendererProps) {
  if (containerEntries.length === 0) {
    return null;
  }

  return (
    <Collapsible
      defaultOpen={true}
      header={<span className={styles.BucketLabel}>[[Entries]]</span>}
      renderChildren={() =>
        containerEntries.map(({ key, value }, index) => (
          <KeyValueRenderer key={index} layout="vertical" pauseId={pauseId} protocolValue={value} />
        ))
      }
    />
  );
}

// Map entries are a special case.
// Unlike the other property lists, Map entries are formatted like:
//   ▼ <index>: {"<key>" -> <value>}
//        key: "<key>"
//        key: <value>
function MapContainerEntriesRenderer({ containerEntries, pauseId }: EntriesRendererProps) {
  return (
    <Collapsible
      defaultOpen={true}
      header={<span className={styles.BucketLabel}>[[Entries]]</span>}
      renderChildren={() => {
        {
          if (containerEntries.length === 0) {
            return <div className={styles.NoEntries}>No properties</div>;
          }

          return containerEntries.map(({ key, value }, index) => (
            <Collapsible
              key={index}
              header={
                <>
                  {index}: {"{"}
                  <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={key!} />
                  {" → "}
                  <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={value} />
                  {"}"}
                </>
              }
              renderChildren={() => (
                <>
                  <KeyValueRenderer
                    before={<div className={styles.MapEntryPrefix}>key</div>}
                    layout="vertical"
                    pauseId={pauseId}
                    protocolValue={key!}
                  />
                  <KeyValueRenderer
                    before={<div className={styles.MapEntryPrefix}>value</div>}
                    layout="vertical"
                    pauseId={pauseId}
                    protocolValue={value}
                  />
                </>
              )}
            />
          ));
        }
      }}
    />
  );
}

// Set entries are a special case.
// Unlike the other property lists, Set entries are formatted like:
//   ▼ <index>: <value>
//        key: <value>
function SetContainerEntriesRenderer({ containerEntries, pauseId }: EntriesRendererProps) {
  return (
    <Collapsible
      defaultOpen={true}
      header={<span className={styles.BucketLabel}>[[Entries]]</span>}
      renderChildren={() => {
        if (containerEntries.length === 0) {
          return <div className={styles.NoEntries}>No properties</div>;
        }

        return containerEntries.map(({ value }, index) => (
          <Collapsible
            key={index}
            header={
              <>
                {index}: {"{"}
                <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={value} />
                {"}"}
              </>
            }
            renderChildren={() => (
              <KeyValueRenderer
                before={<div className={styles.MapEntryPrefix}>value</div>}
                layout="vertical"
                pauseId={pauseId}
                protocolValue={value}
              />
            )}
          />
        ));
      }}
    />
  );
}
