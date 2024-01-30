import {
  NamedValue,
  PauseId,
  ContainerEntry as ProtocolContainerEntry,
  Object as ProtocolObject,
  PauseId as ProtocolPauseId,
  Property as ProtocolProperty,
} from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import { FC, Fragment, ReactNode, Suspense, useContext, useMemo } from "react";

import Expandable from "replay-next/components/Expandable";
import Loader from "replay-next/components/Loader";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { isArrayElement } from "replay-next/src/utils/protocol";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import GetterRenderer from "./GetterRenderer";
import KeyValueRenderer from "./KeyValueRendererWithContextMenu";
import FunctionLocationRenderer from "./properties/FunctionLocationRenderer";
import PrototypeRenderer from "./properties/PrototypeRenderer";
import ValueRenderer from "./ValueRenderer";
import styles from "./PropertiesRenderer.module.css";

const PROPERTY_BUCKET_SIZE = 100;

// Renders a list of key value properties.
// This renderer can be used to show an expanded view of the values inside of Arrays and Objects.
//
// https://static.replay.io/protocol/tot/Pause/#type-Property
export default function PropertiesRenderer({
  hidePrototype = false,
  object,
  path,
  pauseId,
}: {
  hidePrototype?: boolean;
  object: ProtocolObject;
  path?: string;
  pauseId: ProtocolPauseId;
}) {
  const client = useContext(ReplayClientContext);

  // If we have an ObjectPreview already, use it.
  // If we just have an Object, then Suspend while we fetch preview data.
  if (object.preview == null || object.preview.overflow) {
    object = objectCache.read(client, pauseId, object.objectId, "full");
  }

  const { className, objectId, preview } = object;

  const containerEntries = preview?.containerEntries ?? [];

  const properties = useMemo(() => {
    if (preview == null) {
      return [];
    }

    const ownProperties = sortBy(preview.properties || [], property =>
      isArrayElement(property) ? Number(property.name) : property.name
    );

    const getterValues = sortBy(preview.getterValues || [], getterValue => getterValue.name);

    if (preview.promiseState) {
      if (preview.promiseState.value) {
        getterValues.unshift({ name: "<value>", ...preview.promiseState.value });
      }
      getterValues.unshift({ name: "<state>", value: preview.promiseState.state });
    }

    if (preview.proxyState) {
      getterValues.unshift(
        { name: "<target>", ...preview.proxyState.target },
        { name: "<handler>", ...preview.proxyState.handler }
      );
    }

    return ownProperties
      .map(property => ({ ...property, isGetterValue: false }))
      .concat(getterValues.map(getterValue => ({ ...getterValue, isGetterValue: true })));
  }, [preview]);

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

  let specialPropertiesRenderer: ReactNode[] = [];

  switch (object.className) {
    case "Function":
      specialPropertiesRenderer.push(
        <FunctionLocationRenderer key="FunctionLocation" object={object} />
      );
    default:
      if (!hidePrototype) {
        specialPropertiesRenderer.push(
          <PrototypeRenderer
            key="PrototypeRenderer"
            object={object}
            path={path}
            pauseId={pauseId}
          />
        );
      }
  }

  return (
    <>
      <EntriesRenderer containerEntries={containerEntries} pauseId={pauseId} />

      {buckets.map((bucket, index) => {
        const bucketPath = addPathSegment(path, bucket.header);
        return (
          <Expandable
            key={`bucketed-properties-${index}`}
            children={
              <Suspense fallback={<Loader />}>
                {bucket.properties.map((property, index) => (
                  <Fragment key={index}>
                    {property.hasOwnProperty("get") && (
                      <GetterRenderer
                        parentObjectId={objectId}
                        path={addPathSegment(bucketPath, `get ${property.name}`)}
                        pauseId={pauseId}
                        protocolProperty={property}
                      />
                    )}
                    <KeyValueRenderer
                      context="default"
                      layout="vertical"
                      path={addPathSegment(bucketPath, property.name)}
                      pauseId={pauseId}
                      protocolValue={property}
                    />
                  </Fragment>
                ))}
              </Suspense>
            }
            header={<span className={styles.Bucket}>{bucket.header}</span>}
            persistenceKey={bucketPath}
          />
        );
      })}

      {buckets.length === 0 && (
        <Suspense fallback={<Loader />}>
          {properties.map((property, index) => {
            return (
              <Fragment key={index}>
                {property.hasOwnProperty("get") && (
                  <GetterRenderer
                    parentObjectId={objectId}
                    path={addPathSegment(path, `get ${property.name}`)}
                    pauseId={pauseId}
                    protocolProperty={property}
                  />
                )}
                <KeyValueRenderer
                  context="default"
                  layout="vertical"
                  path={addPathSegment(path, property.name)}
                  pauseId={pauseId}
                  protocolValue={property}
                />
              </Fragment>
            );
          })}
        </Suspense>
      )}

      {specialPropertiesRenderer}
    </>
  );
}

type EntriesRendererProps = {
  containerEntries: ProtocolContainerEntry[];
  path?: string;
  pauseId: PauseId;
};

function ContainerEntriesRenderer({ containerEntries, path, pauseId }: EntriesRendererProps) {
  if (containerEntries.length === 0) {
    return null;
  }

  return (
    <Expandable
      defaultOpen={true}
      children={
        <ContainerEntriesChildrenRenderer
          containerEntries={containerEntries}
          path={path}
          pauseId={pauseId}
        />
      }
      header={<span className={styles.BucketLabel}>[[Entries]]</span>}
      persistenceKey={path}
    />
  );
}

function ContainerEntriesChildrenRenderer({
  containerEntries,
  path,
  pauseId,
}: EntriesRendererProps) {
  return (
    <Suspense fallback={<Loader />}>
      {containerEntries.map(({ key, value }, index) => (
        <KeyValueRenderer
          key={index}
          context="nested"
          layout="vertical"
          pauseId={pauseId}
          path={addPathSegment(path, `${key?.value ?? index}`)}
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
//        value: <value>
function MapContainerEntriesRenderer({ containerEntries, path, pauseId }: EntriesRendererProps) {
  return (
    <Expandable
      defaultOpen={true}
      children={
        <MapContainerEntriesChildrenRenderer
          containerEntries={containerEntries}
          path={path}
          pauseId={pauseId}
        />
      }
      header={<span className={styles.BucketLabel}>[[Entries]]</span>}
      persistenceKey={path}
    />
  );
}

function MapContainerEntriesChildrenRenderer({
  containerEntries,
  path,
  pauseId,
}: EntriesRendererProps) {
  if (containerEntries.length === 0) {
    return <span className={styles.NoEntries}>No properties</span>;
  }

  return (
    <Suspense fallback={<Loader />}>
      {containerEntries.map(({ key, value }, index) => {
        const entryPath = addPathSegment(path, `${key?.value ?? index}`);
        return (
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
                  path={addPathSegment(entryPath, "key")}
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
                  path={addPathSegment(entryPath, "value")}
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
            persistenceKey={entryPath}
          />
        );
      })}
    </Suspense>
  );
}

// Set entries are a special case.
// Unlike the other property lists, Set entries are formatted like:
//   ▼ <index>: <value>
//        key: <value>
function SetContainerEntriesRenderer({ containerEntries, path, pauseId }: EntriesRendererProps) {
  return (
    <Expandable
      defaultOpen={true}
      children={
        <SetContainerEntriesChildrenRenderer
          containerEntries={containerEntries}
          path={path}
          pauseId={pauseId}
        />
      }
      header={<span className={styles.BucketLabel}>[[Entries]]</span>}
    />
  );
}

function SetContainerEntriesChildrenRenderer({
  containerEntries,
  path,
  pauseId,
}: EntriesRendererProps) {
  if (containerEntries.length === 0) {
    return <span className={styles.NoEntries}>No properties</span>;
  }

  return (
    <Suspense fallback={<Loader />}>
      {containerEntries.map(({ value }, index) => {
        const entryPath = addPathSegment(path, `${index}`);
        return (
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
                path={entryPath}
                pauseId={pauseId}
                protocolValue={value}
              />
            }
            header={
              <>
                <span className={styles.MapIndex}>{index}</span>
                <span className={styles.Separator}>: </span>
                <ValueRenderer context="nested" pauseId={pauseId} protocolValue={value} />
              </>
            }
            persistenceKey={entryPath}
          />
        );
      })}
    </Suspense>
  );
}

export function addPathSegment(path: string | undefined, segment: string): string | undefined {
  if (path === undefined) {
    return undefined;
  }
  return `${path}/${segment}`;
}
