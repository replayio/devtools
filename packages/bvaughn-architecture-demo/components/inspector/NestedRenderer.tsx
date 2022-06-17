import {
  ContainerEntry as ProtocolContainerEntry,
  NamedValue as ProtocolNamedValue,
  Object as ProtocolObject,
  ObjectPreview as ProtocolObjectPreview,
  PauseId as ProtocolPauseId,
  Property as ProtocolProperty,
} from "@replayio/protocol";
import { sortBy } from "lodash";
import { FC, ReactNode, Suspense, useContext, useMemo, useState } from "react";
import { ReplayClientContext } from "../../src/contexts/ReplayClientContext";
import { getObjectWithPreview } from "../../src/suspense/ObjectPreviews";

import { Value as ClientValue } from "../../src/utils/protocol";
import { stringify } from "../../src/utils/string";

import Icon from "../Icon";

import styles from "./NestedRenderer.module.css";
import ValueRenderer from "./ValueRenderer";

const EMPTY_ARRAY: any[] = [];
const EMPTY_OBJECT = {};

// Renders complex types (e.g. objects, functions, arrays).
// These types can be expanded to inspect nested properties.
export default function NestedRenderer({
  disableInteractions = false,
  pauseId,
  value,
}: {
  disableInteractions: boolean;
  pauseId: ProtocolPauseId;
  value: ClientValue;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const client = useContext(ReplayClientContext);
  const object = getObjectWithPreview(client, pauseId, value.objectId!);
  if (object == null) {
    throw Error(`Could not find object with ID "${value.objectId}"`);
  }

  let PreviewRenderer: FC<RendererProps> | null = null;
  switch (value.type) {
    case "array":
      PreviewRenderer = ArrayRenderer;
      break;
    case "function":
      PreviewRenderer = FunctionRenderer;
      break;
    case "object":
    default:
      switch (object?.className) {
        case "Map":
          PreviewRenderer = MapRenderer;
          break;
        case "RegExp":
          PreviewRenderer = RegExpRenderer;
          break;
        case "Set":
          PreviewRenderer = SetRenderer;
          break;
        default:
          PreviewRenderer = ObjectRenderer;
          break;
      }
      break;
  }

  // console.group("<NestedRenderer>");
  // console.log("name:", value.name);
  // console.log(value);
  // console.log(stringify(value, 2));
  // console.log({ containerEntries, getterValues, sortedProperties });
  // console.log(object);
  // console.log(stringify(object, 2));
  // console.groupEnd();

  // TODO Should we be alpha-sorting properties by name?

  // TODO Make sure we're handler getter/setter and prototype props correctly.
  //      e.g. We currently render "length: 0" twice for Arrays.
  //      Maybe we need to merge and sort these three collections somehow?

  // TODO Nested properties don't seem to expand to anything meaningful (just "null").
  //      Do we need to lazily fetch that data?

  // TODO Add Suspense wrapper for expanded properties.
  //      We might need to call getObjectPreview()

  // TODO Support Array bucketing (e.g. [0...99])
  //      We can also bucket containerEntries with "[[Entries]]"

  return (
    <div className={styles.Nested}>
      <div className={styles.PreviewRow}>
        {disableInteractions || (
          <button className={styles.ToggleButton} onClick={() => setIsExpanded(!isExpanded)}>
            <Icon type={isExpanded ? "expanded" : "collapsed"} />
          </button>
        )}

        {value.name != null ? <span className={styles.Name}>{value.name}</span> : null}

        <PreviewRenderer object={object} pauseId={pauseId} />
      </div>

      {isExpanded && (
        <Suspense fallback="Loading...">
          <PropertyListRenderer object={object} pauseId={pauseId} />
        </Suspense>
      )}
    </div>
  );
}

function PropertyListRenderer({
  object,
  pauseId,
}: {
  object: ProtocolObject;
  pauseId: ProtocolPauseId;
}) {
  const client = useContext(ReplayClientContext);

  if (object.preview == null) {
    // Suspend
    object = getObjectWithPreview(client, pauseId, object.objectId);
  }

  const preview = object.preview!;

  const containerEntries =
    object.preview?.containerEntries ?? (EMPTY_ARRAY as ProtocolContainerEntry[]);
  const getterValues = object.preview?.getterValues ?? (EMPTY_ARRAY as ProtocolNamedValue[]);
  const properties = object.preview?.properties ?? (EMPTY_ARRAY as ProtocolProperty[]);
  const sortedProperties = useMemo(
    () => sortBy(properties, property => property.name),
    [properties]
  );

  const prototypeId = object.preview?.prototypeId ?? null;
  let prototype = null;
  if (prototypeId) {
    prototype = getObjectWithPreview(client, pauseId, prototypeId);
  }

  console.log("containerEntries:", containerEntries);

  return (
    <div className={styles.Expanded}>
      {containerEntries.length > 0 && (
        <Bucket
          defaultExpanded={true}
          enabled={true}
          header={<span className={styles.BucketLabel}>[[Entries]]</span>}
        >
          {containerEntries.map(({ key, value }, index) => (
            <span key={`containerEntry-${index}`} className={styles.ObjectProperty}>
              <ValueRenderer
                pauseId={pauseId}
                index={index}
                isRootValue={false}
                protocolKey={key}
                protocolValue={value}
              />
            </span>
          ))}
        </Bucket>
      )}
      {getterValues.map((property, index) => (
        <span key={`getterValue-${index}`} className={styles.ObjectProperty}>
          <ValueRenderer pauseId={pauseId} isRootValue={false} protocolValue={property} />
        </span>
      ))}
      {sortedProperties.map((property, index) => (
        <span key={`property-${index}`} className={styles.ObjectProperty}>
          <ValueRenderer pauseId={pauseId} isRootValue={false} protocolValue={property} />
        </span>
      ))}

      <span className={styles.Prototype}>
        <span className={styles.PrototypeName}>&lt;prototype&gt;</span>
        {prototype !== null ? (
          <span className={styles.PrototypeValue}>
            <ObjectRenderer object={prototype} pauseId={pauseId} />
          </span>
        ) : (
          "null"
        )}
      </span>
    </div>
  );
}

type RendererProps = {
  object: ProtocolObject;
  pauseId: ProtocolPauseId;
};

function ArrayRenderer({ object, pauseId }: RendererProps) {
  const properties = (object.preview?.properties ?? EMPTY_ARRAY).filter(
    property => property.flags !== 1
  );

  const getterValue = object.preview?.getterValues?.find(({ name }) => name === "length");
  const length = getterValue?.value || 0;

  return (
    <>
      Array
      {length > 0 && <div className={styles.ArrayLength}>({length})</div>}
      <span className={styles.ArrayValues}>
        {properties.map((property, index) => (
          <span key={index} className={styles.ArrayValue}>
            <ValueRenderer
              disableInteractions={true}
              isRootValue={false}
              pauseId={pauseId}
              protocolValue={property}
            />
          </span>
        ))}
        {object.preview?.overflow && <span className={styles.ObjectProperty}>...</span>}
      </span>
    </>
  );
}

function FunctionRenderer({ object }: RendererProps) {
  const { functionName, functionParameterNames = EMPTY_ARRAY as string[] } =
    object?.preview ?? (EMPTY_OBJECT as ProtocolObjectPreview);

  const jumpToDefinition = () => {
    // TODO In the real app, this should open the Source viewer.
    alert("Source viewer is not implemented yet");
  };

  // TODO Handle getters – Lazy fetch values

  return (
    <>
      function {functionName}
      <span className={styles.FunctionParameters}>
        {functionParameterNames.map((parameterName, index) => (
          <span key={index} className={styles.FunctionParameter}>
            {parameterName}
          </span>
        ))}
      </span>
      <button className={styles.JumpToDefinitionButton} onClick={jumpToDefinition}>
        <Icon className={styles.JumpToDefinitionIcon} type="jump-to-definition" />
      </button>
    </>
  );
}

function MapRenderer({ object, pauseId }: RendererProps) {
  const {
    containerEntries = EMPTY_ARRAY as ProtocolContainerEntry[],
    containerEntryCount = 0,
    overflow = false,
  } = object.preview || {};

  if (containerEntryCount === 0) {
    return <>{object.className} (0)</>;
  } else {
    return (
      <>
        {object.className}
        <div className={styles.ArrayLength}>({containerEntryCount})</div>
        {"{"}
        {containerEntries.map(({ key, value }, index) => (
          <span key={index} className={styles.ObjectProperty}>
            <span className={styles.ObjectPropertyName}>{key?.value ?? ""}</span>
            <ValueRenderer
              disableInteractions={true}
              isRootValue={false}
              pauseId={pauseId}
              protocolValue={value}
            />
          </span>
        ))}
        {overflow && <span className={styles.ObjectProperty}>...</span>}
        {"}"}
      </>
    );
  }
}

function ObjectRenderer({ object, pauseId }: RendererProps) {
  // TODO Is this the right way to filter properties?
  const properties = (object.preview?.properties ?? (EMPTY_ARRAY as ProtocolProperty[])).filter(
    property => property.flags !== 1
  );

  return (
    <>
      {object.className} {"{"}
      {properties.map((property, index) => (
        <span key={index} className={styles.ObjectProperty}>
          <span className={styles.ObjectPropertyName}>{property.name}</span>
          <ValueRenderer
            disableInteractions={true}
            isRootValue={false}
            pauseId={pauseId}
            protocolValue={property}
          />
        </span>
      ))}
      {object.preview?.overflow && <span className={styles.ObjectProperty}>...</span>}
      {"}"}
    </>
  );
}

function RegExpRenderer({ object }: RendererProps) {
  return <>{object?.preview?.regexpString ?? object.className}</>;
}

function SetRenderer({ object, pauseId }: RendererProps) {
  const {
    containerEntries = EMPTY_ARRAY as ProtocolContainerEntry[],
    containerEntryCount = 0,
    overflow = false,
  } = object.preview || {};

  if (containerEntryCount === 0) {
    return <>{object.className} (0)</>;
  } else {
    return (
      <>
        {object.className}
        <div className={styles.ArrayLength}>({containerEntryCount})</div>
        <span className={styles.ArrayValues}>
          {containerEntries.map((property, index) => (
            <span key={index} className={styles.ArrayValue}>
              <ValueRenderer
                disableInteractions={true}
                isRootValue={false}
                pauseId={pauseId}
                protocolValue={property.value}
              />
            </span>
          ))}
          {overflow && <span className={styles.ObjectProperty}>...</span>}
        </span>
      </>
    );
  }
}

// TODO The top-level NestedRenderer component could be refactored to use this wrapper.
function Bucket({
  children,
  defaultExpanded,
  enabled,
  header,
}: {
  children: ReactNode;
  defaultExpanded: boolean;
  enabled: boolean;
  header: ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={styles.Nested}>
      <div className={styles.PreviewRow}>
        {enabled && (
          <button className={styles.ToggleButton} onClick={() => setIsExpanded(!isExpanded)}>
            <Icon type={isExpanded ? "expanded" : "collapsed"} />
          </button>
        )}

        {header}
      </div>

      {isExpanded ? <div className={styles.Expanded}>{children}</div> : null}
    </div>
  );
}
