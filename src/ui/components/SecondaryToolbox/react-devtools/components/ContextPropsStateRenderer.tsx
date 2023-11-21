import { ObjectId, PauseId, Property, Value as ProtocolValue } from "@replayio/protocol";
import { ReactNode } from "react";

import KeyValueRenderer from "replay-next/components/inspector/KeyValueRendererWithContextMenu";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";
import { InspectedReactElement } from "ui/components/SecondaryToolbox/react-devtools/types";

import styles from "./ContextPropsStateRenderer.module.css";

export type SectionType = "context" | "props" | "state";

export function ContextPropsStateRenderer({
  inspectedElement,
  objectId,
  pauseId,
  replayClient,
  sectionType,
}: {
  inspectedElement: InspectedReactElement;
  objectId: ObjectId;
  pauseId: PauseId;
  replayClient: ReplayClientInterface;
  sectionType: SectionType;
}) {
  const object = objectCache.read(replayClient, pauseId, `${objectId}`, "canOverflow");
  if (!object.preview?.properties) {
    return null;
  }

  return object.preview.properties.map((property, index) => (
    <PropertyRenderer
      inspectedElement={inspectedElement}
      key={index}
      pauseId={pauseId}
      property={property}
      replayClient={replayClient}
      sectionType={sectionType}
    />
  )) as any;
}

function PropertyRenderer({
  inspectedElement,
  pauseId,
  property,
  replayClient,
  sectionType,
}: {
  inspectedElement: InspectedReactElement;
  pauseId: PauseId;
  property: Property;
  replayClient: ReplayClientInterface;
  sectionType: SectionType;
}) {
  const name = property.name;

  let highlightChanged = false;
  switch (sectionType) {
    case "context": {
      highlightChanged = inspectedElement.changedContextKeys.includes(name);
      break;
    }
    case "props": {
      highlightChanged = inspectedElement.changedPropsKeys.includes(name);
      break;
    }
    case "state": {
      highlightChanged = inspectedElement.changedStateKeys.includes(name);
      break;
    }
  }

  const renderedName = (
    <span className={styles.PropertyName} data-changed={highlightChanged || undefined}>
      {name}
    </span>
  );

  let rendered: ReactNode = null;
  if (property?.object) {
    const protocolValue = objectCache.read(
      replayClient,
      pauseId,
      `${property.object}`,
      "canOverflow"
    );
    rendered = (
      <KeyValueRenderer
        before={
          <>
            {renderedName}
            <span className={styles.Separator}>: </span>{" "}
          </>
        }
        context="default"
        pauseId={pauseId}
        protocolValue={
          {
            object: property.object,
            ...protocolValue,
          } satisfies ProtocolValue
        }
      />
    );
  } else if (property?.hasOwnProperty("value")) {
    rendered = (
      <KeyValueRenderer
        before={
          <>
            {renderedName}
            <span className={styles.Separator}>: </span>{" "}
          </>
        }
        context="default"
        pauseId={pauseId}
        protocolValue={
          {
            value: property.value,
          } satisfies ProtocolValue
        }
      />
    );
  } else {
    rendered = renderedName;
  }

  return rendered;
}
