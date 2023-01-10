import {
  NamedValue,
  PauseId,
  ContainerEntry as ProtocolContainerEntry,
  Object as ProtocolObject,
  PauseId as ProtocolPauseId,
  Property as ProtocolProperty,
} from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import { FC, Fragment, Suspense, useContext, useMemo } from "react";

import Expandable from "replay-next/components/Expandable";
import Loader from "replay-next/components/Loader";
import { getObjectWithPreviewSuspense } from "replay-next/src/suspense/ObjectPreviews";
import { mergePropertiesAndGetterValues } from "replay-next/src/utils/protocol";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import GetterRenderer from "./GetterRenderer";
import KeyValueRenderer from "./KeyValueRendererWithContextMenu";
import ValueRenderer from "./ValueRenderer";
import styles from "./PropertiesRenderer.module.css";

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
    object = getObjectWithPreviewSuspense(client, pauseId, object.objectId, true);
  }

  const { className, objectId, preview } = object;

  const containerEntries = preview?.containerEntries ?? [];

  const properties = useMemo(() => {
    if (preview == null) {
      return [];
    }

    const [properties] = mergePropertiesAndGetterValues(
      preview.properties || [],
      preview.getterValues || []
    );

    return sortBy(properties, ({ name }) => {
      const maybeNumber = Number(name);
      return isNaN(maybeNumber) ? name : maybeNumber;
    });
  }, [preview]);

  const prototypeId = preview?.prototypeId ?? null;
  let prototype = null;
  if (prototypeId) {
    prototype = getObjectWithPreviewSuspense(client, pauseId, prototypeId);
  }

  let EntriesRenderer: FC<EntriesRendererProps> = ContainerEntriesRenderer;
  switch (className) {
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
  const buckets: { header: string; properties: Array<NamedValue | ProtocolProperty> }[] = [];
  if (properties.length >= PROPERTY_BUCKET_SIZE) {
    let index = 0;

    while (index < properties.length - 1) {
      const rangeStart = buckets.length * PROPERTY_BUCKET_SIZE;
      const rangeStop = Math.min(properties.length, rangeStart + PROPERTY_BUCKET_SIZE) - 1;

      buckets.push({
        header: `[${rangeStart} … ${rangeStop}]`,
        properties: properties.slice(rangeStart, rangeStop + 1),
      });

      index = rangeStop;
    }
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
                <Fragment key={index}>
                  {property.hasOwnProperty("get") && (
                    <GetterRenderer
                      parentObjectId={objectId}
                      pauseId={pauseId}
                      protocolProperty={property}
                    />
                  )}
                  <KeyValueRenderer
                    context="default"
                    layout="vertical"
                    pauseId={pauseId}
                    protocolValue={property}
                  />
                </Fragment>
              ))}
            </Suspense>
          }
          header={<span className={styles.Bucket}>{bucket.header}</span>}
        />
      ))}

      {buckets.length === 0 && (
        <Suspense fallback={<Loader />}>
          {properties.map((property, index) => (
            <Fragment key={index}>
              {property.hasOwnProperty("get") && (
                <GetterRenderer
                  parentObjectId={objectId}
                  pauseId={pauseId}
                  protocolProperty={property}
                />
              )}
              <KeyValueRenderer
                context="default"
                layout="vertical"
                pauseId={pauseId}
                protocolValue={property}
              />
            </Fragment>
          ))}
        </Suspense>
      )}

      {prototype != null && (
        <Expandable
          children={<PropertiesRenderer object={prototype} pauseId={pauseId} />}
          header={
            <span className={styles.Prototype}>
              <span className={styles.PrototypeName}>[[Prototype]]: </span>
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
          context="nested"
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
    return <span className={styles.NoEntries}>No properties</span>;
  }

  return (
    <Suspense fallback={<Loader />}>
      {containerEntries.map(({ key, value }, index) => (
        <Expandable
          key={index}
          children={
            <>
              <KeyValueRenderer
                before={
                  <>
                    <span className={styles.MapEntryPrefix}>key</span>
                    <span className={styles.Separator}>: </span>
                  </>
                }
                context="nested"
                layout="vertical"
                pauseId={pauseId}
                protocolValue={key!}
              />
              <KeyValueRenderer
                before={
                  <>
                    <span className={styles.MapEntryPrefix}>value</span>
                    <span className={styles.Separator}>: </span>
                  </>
                }
                context="nested"
                layout="vertical"
                pauseId={pauseId}
                protocolValue={value}
              />
            </>
          }
          header={
            <>
              <span className={styles.MapIndex}>{index}</span>: {"{"}
              <ValueRenderer context="nested" pauseId={pauseId} protocolValue={key!} />
              &nbsp;{"→"}&nbsp;
              <ValueRenderer context="nested" pauseId={pauseId} protocolValue={value} />
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
    return <span className={styles.NoEntries}>No properties</span>;
  }

  return (
    <Suspense fallback={<Loader />}>
      {containerEntries.map(({ value }, index) => (
        <Expandable
          key={index}
          children={
            <KeyValueRenderer
              before={
                <>
                  <span className={styles.MapEntryPrefix}>value</span>
                  <span className={styles.Separator}>: </span>
                </>
              }
              context="nested"
              layout="vertical"
              pauseId={pauseId}
              protocolValue={value}
            />
          }
          header={
            <>
              <span className={styles.MapIndex}>{index}</span>: {"{"}
              <ValueRenderer context="nested" pauseId={pauseId} protocolValue={value} />
              {"}"}
            </>
          }
        />
      ))}
    </Suspense>
  );
}
