import { MappedLocation, ObjectId, PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { MouseEvent, ReactNode, useContext } from "react";

import Expandable from "replay-next/components/Expandable";
import Icon from "replay-next/components/Icon";
import KeyValueRenderer from "replay-next/components/inspector/KeyValueRendererWithContextMenu";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import {
  findProtocolObjectProperty,
  findProtocolObjectPropertyValue,
  isArrayElement,
} from "replay-next/src/utils/protocol";
import { ReplayClientInterface } from "shared/client/types";
import { hookLocationCache } from "ui/components/SecondaryToolbox/react-devtools/suspense/hookLocationCache";
import { hookNameCache } from "ui/components/SecondaryToolbox/react-devtools/suspense/hookNameCache";
import { InspectedReactElement } from "ui/components/SecondaryToolbox/react-devtools/types";

import styles from "./HooksRenderer.module.css";

export function HooksRenderer({
  inspectedElement,
  objectId,
  pauseId,
  replayClient,
}: {
  inspectedElement: InspectedReactElement;
  objectId: ObjectId;
  pauseId: PauseId;
  replayClient: ReplayClientInterface;
}) {
  const object = objectCache.read(replayClient, pauseId, `${objectId}`, "canOverflow");
  if (!object.preview?.properties) {
    return null;
  }

  const arrayElements = object.preview.properties.filter(isArrayElement);

  return arrayElements.map((property, index) => (
    <HookRenderer
      inspectedElement={inspectedElement}
      key={index}
      objectId={property.object as ObjectId}
      pauseId={pauseId}
      replayClient={replayClient}
    />
  )) as any;
}

function HookRenderer({
  depth = 0,
  inspectedElement,
  objectId,
  pauseId,
  replayClient,
}: {
  depth?: number;
  inspectedElement: InspectedReactElement;
  objectId: ObjectId;
  pauseId: PauseId;
  replayClient: ReplayClientInterface;
}) {
  const { inspectFunctionDefinition } = useContext(InspectorContext);

  const hookObject = objectCache.read(replayClient, pauseId, `${objectId}`, "canOverflow");

  let hookName = findProtocolObjectPropertyValue<string>(hookObject, "name") || "Anonymous";
  const id = findProtocolObjectPropertyValue<number>(hookObject, "id") ?? null;
  const subHooksProperty = findProtocolObjectProperty(hookObject, "subHooks");
  const valueProperty = findProtocolObjectProperty(hookObject, "value");

  const subHooks = subHooksProperty?.object
    ? objectCache.read(replayClient, pauseId, `${subHooksProperty.object}`, "canOverflow")
    : undefined;
  let isCustomHook = false;
  if (subHooks?.className === "Array") {
    const length = findProtocolObjectPropertyValue<number>(subHooks, "length") ?? 0;

    isCustomHook = length > 0;
  }

  // Some hooks (useEffect, useLayoutEffect, useCallback, etc.) accept function arguments.
  // Typically these are inline functions, so the jump-to-definition button will already work in this case.
  // For other types of hooks, it's still useful to show that button,
  // but it requires us to do extra mapping work to translate from the react-debug-tools reported "location"
  // to a Location that Replay can work with.

  const hookSourceProperty = findProtocolObjectProperty(hookObject, "hookSource");
  const hookSource = hookSourceProperty?.object
    ? objectCache.read(replayClient, pauseId, hookSourceProperty.object, "canOverflow")
    : null;

  let hookSourceFunctionLocation: MappedLocation | null = null;
  if (hookSource) {
    hookSourceFunctionLocation = hookLocationCache.read(replayClient, hookSource);
  }

  if (isCustomHook && hookSourceFunctionLocation) {
    hookName =
      hookNameCache.read(replayClient, hookSourceFunctionLocation, hookName) ?? "Anonymous";
  }

  let renderedName: ReactNode = null;
  if (isCustomHook) {
    renderedName = <span className={styles.CustomHookName}>{hookName}</span>;
  } else {
    let highlightChanged = false;
    if (id != null && inspectedElement.changedHooksIds.includes(id)) {
      highlightChanged = true;
    }

    renderedName = (
      <span className={styles.BuiltInHookName} data-changed={highlightChanged || undefined}>
        {hookName}
      </span>
    );
  }

  if (hookSourceFunctionLocation) {
    const viewFunctionSource = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (inspectFunctionDefinition !== null) {
        inspectFunctionDefinition(hookSourceFunctionLocation!);
      }
    };

    renderedName = (
      <>
        {renderedName}
        <button
          className={styles.ViewSourceIconButton}
          data-test-name="JumpToDefinitionButton"
          onClick={viewFunctionSource}
          title="Jump to definition"
        >
          <Icon className={styles.ViewSourceIcon} type="view-function-source" />
        </button>
      </>
    );
  }

  let rendered: ReactNode = null;
  if (valueProperty?.object) {
    const protocolValue = objectCache.read(
      replayClient,
      pauseId,
      `${valueProperty.object}`,
      "canOverflow"
    );
    rendered = (
      <KeyValueRenderer
        before={<>{renderedName} </>}
        context="default"
        pauseId={pauseId}
        protocolValue={
          {
            object: valueProperty.object,
            ...protocolValue,
          } satisfies ProtocolValue
        }
      />
    );
  } else if (valueProperty?.hasOwnProperty("value")) {
    rendered = (
      <KeyValueRenderer
        before={<>{renderedName} </>}
        context="default"
        pauseId={pauseId}
        protocolValue={
          {
            value: valueProperty.value,
          } satisfies ProtocolValue
        }
      />
    );
  } else {
    rendered = renderedName;
  }

  if (isCustomHook) {
    const arrayElements = subHooks?.preview?.properties?.filter(isArrayElement);

    rendered = (
      <Expandable
        children={arrayElements?.map((property, index) => (
          <HookRenderer
            depth={depth + 1}
            inspectedElement={inspectedElement}
            key={index}
            objectId={property.object as ObjectId}
            pauseId={pauseId}
            replayClient={replayClient}
          />
        ))}
        header={rendered}
      />
    );
  } else if (valueProperty?.hasOwnProperty("value")) {
    // If there's no expandable arrow icon (there won't be for primitive values) then indent so that the name aligns
    rendered = (
      <>
        <div className={styles.Spacer}>&nbsp;</div>
        {rendered}
      </>
    );
  }

  return (
    <div className={styles.Wrapper} data-depth={depth} data-test-name={`Hook-${hookName}`}>
      {rendered}
    </div>
  );
}
