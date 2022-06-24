import {
  ContainerEntry as ProtocolContainerEntry,
  Object as ProtocolObject,
  PauseId,
  PauseId as ProtocolPauseId,
  Property as ProtocolProperty,
} from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import { FC, Suspense, useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Loader from "../../components/Loader";
import { getObjectWithPreview } from "../../src/suspense/ObjectPreviews";

import Expandable from "../Expandable";

import KeyValueRenderer from "./KeyValueRenderer";
import styles from "./PropertiesRenderer.module.css";
import ValueRenderer from "./ValueRenderer";

const PROPERTY_BUCKET_SIZE = 100;

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
  if (object.preview == null || object.preview.overflow) {
    object = getObjectWithPreview(client, pauseId, object.objectId, true);
  }

  const containerEntries = object.preview?.containerEntries ?? [];
  const properties = useMemo(() => {
    return sortBy(object.preview?.properties ?? [], property => {
      const maybeNumber = Number(property.name);
      return isNaN(maybeNumber) ? property.name : maybeNumber;
    });
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

  // For collections that contain a lot of properties, group them into "buckets" of 100 props.
  // This most commonly comes into play with large Arrays.
  const buckets: { header: string; properties: ProtocolProperty[] }[] = [];
  while (properties.length > PROPERTY_BUCKET_SIZE) {
    const rangeStart = buckets.length * PROPERTY_BUCKET_SIZE;
    const rangeStop = rangeStart + PROPERTY_BUCKET_SIZE - 1;
    buckets.push({
      header: `[${rangeStart} … ${rangeStop}]`,
      properties: properties.splice(0, PROPERTY_BUCKET_SIZE),
    });
  }

  return (
    <>
      <EntriesRenderer containerEntries={containerEntries} pauseId={pauseId} />

      {buckets.map((bucket, index) => (
        <Expandable
          key={`bucketed-properties-${index}`}
          children={
            <Suspense fallback={<Loader />}>
              {bucket.properties.map((property, index) => (
                <KeyValueRenderer
                  key={`property-${index}`}
                  isNested={true}
                  layout="vertical"
                  pauseId={pauseId}
                  protocolValue={property}
                />
              ))}
            </Suspense>
          }
          header={<span className={styles.Bucket}>{bucket.header}</span>}
        />
      ))}

      <Suspense fallback={<Loader />}>
        {properties.map((property, index) => (
          <KeyValueRenderer
            key={`property-${index}`}
            isNested={true}
            layout="vertical"
            pauseId={pauseId}
            protocolValue={property}
          />
        ))}
      </Suspense>

      {prototype != null && (
        <Expandable
          children={<PropertiesRenderer object={prototype} pauseId={pauseId} />}
          header={
            <span className={styles.Prototype}>
              <span className={styles.PrototypeName}>[[Prototype]]</span>
              {prototype !== null ? prototype.className : null}
            </span>
          }
        />
      )}
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
    <Expandable
      defaultOpen={true}
      children={
        <ContainerEntriesChildrenRenderer containerEntries={containerEntries} pauseId={pauseId} />
      }
      header={<span className={styles.BucketLabel}>[[Entries]]</span>}
    />
  );
}

function ContainerEntriesChildrenRenderer({ containerEntries, pauseId }: EntriesRendererProps) {
  return (
    <Suspense fallback={<Loader />}>
      {containerEntries.map(({ key, value }, index) => (
        <KeyValueRenderer
          key={index}
          isNested={true}
          layout="vertical"
          pauseId={pauseId}
          protocolValue={value}
        />
      ))}
    </Suspense>
  );
}

// Map entries are a special case.
// Unlike the other property lists, Map entries are formatted like:
//   ▼ <index>: {"<key>" -> <value>}
//        key: "<key>"
//        key: <value>
function MapContainerEntriesRenderer({ containerEntries, pauseId }: EntriesRendererProps) {
  return (
    <Expandable
      defaultOpen={true}
      children={
        <MapContainerEntriesChildrenRenderer
          containerEntries={containerEntries}
          pauseId={pauseId}
        />
      }
      header={<span className={styles.BucketLabel}>[[Entries]]</span>}
    />
  );
}

function MapContainerEntriesChildrenRenderer({ containerEntries, pauseId }: EntriesRendererProps) {
  if (containerEntries.length === 0) {
    return <div className={styles.NoEntries}>No properties</div>;
  }

  return (
    <Suspense fallback={<Loader />}>
      {containerEntries.map(({ key, value }, index) => (
        <Expandable
          key={index}
          children={
            <>
              <KeyValueRenderer
                before={<div className={styles.MapEntryPrefix}>key</div>}
                isNested={true}
                layout="vertical"
                pauseId={pauseId}
                protocolValue={key!}
              />
              <KeyValueRenderer
                before={<div className={styles.MapEntryPrefix}>value</div>}
                isNested={true}
                layout="vertical"
                pauseId={pauseId}
                protocolValue={value}
              />
            </>
          }
          header={
            <>
              <span className={styles.MapIndex}>{index}</span>: {"{"}
              <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={key!} />
              &nbsp;{"→"}&nbsp;
              <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={value} />
              {"}"}
            </>
          }
        />
      ))}
    </Suspense>
  );
}

// Set entries are a special case.
// Unlike the other property lists, Set entries are formatted like:
//   ▼ <index>: <value>
//        key: <value>
function SetContainerEntriesRenderer({ containerEntries, pauseId }: EntriesRendererProps) {
  return (
    <Expandable
      defaultOpen={true}
      children={
        <SetContainerEntriesChildrenRenderer
          containerEntries={containerEntries}
          pauseId={pauseId}
        />
      }
      header={<span className={styles.BucketLabel}>[[Entries]]</span>}
    />
  );
}

function SetContainerEntriesChildrenRenderer({ containerEntries, pauseId }: EntriesRendererProps) {
  if (containerEntries.length === 0) {
    return <div className={styles.NoEntries}>No properties</div>;
  }

  return (
    <Suspense fallback={<Loader />}>
      {containerEntries.map(({ value }, index) => (
        <Expandable
          key={index}
          children={
            <KeyValueRenderer
              before={<div className={styles.MapEntryPrefix}>value</div>}
              isNested={true}
              layout="vertical"
              pauseId={pauseId}
              protocolValue={value}
            />
          }
          header={
            <>
              <span className={styles.MapIndex}>{index}</span>: {"{"}
              <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={value} />
              {"}"}
            </>
          }
        />
      ))}
    </Suspense>
  );
}
