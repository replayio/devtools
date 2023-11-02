import { ObjectId, PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { ReactNode } from "react";

import Expandable from "replay-next/components/Expandable";
import KeyValueRenderer from "replay-next/components/inspector/KeyValueRendererWithContextMenu";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";
import { findProtocolObjectProperty } from "ui/components/SecondaryToolbox/react-devtools/utils/findProtocolObjectProperty";
import { findProtocolObjectPropertyValue } from "ui/components/SecondaryToolbox/react-devtools/utils/findProtocolObjectPropertyValue";

import styles from "./HooksRenderer.module.css";

export function HooksRenderer({
  depth = 0,
  objectId,
  pauseId,
  replayClient,
}: {
  depth?: number;
  objectId: ObjectId;
  pauseId: PauseId;
  replayClient: ReplayClientInterface;
}) {
  const hookObject = objectCache.read(replayClient, pauseId, `${objectId}`, "canOverflow");

  let hookName = findProtocolObjectPropertyValue<string>(hookObject, "name") || "Anonymous";
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

  let renderedName: ReactNode = null;
  if (isCustomHook) {
    renderedName = <span className={styles.CustomHookName}>{hookName}</span>;
  } else {
    renderedName = <span className={styles.BuiltInHookName}>{hookName}</span>;
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
    rendered = (
      <Expandable
        children={subHooks?.preview?.properties?.map((property, index) => (
          <HooksRenderer
            depth={depth + 1}
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
    <div className={styles.Wrapper} data-depth={depth}>
      {rendered}
    </div>
  );
}
