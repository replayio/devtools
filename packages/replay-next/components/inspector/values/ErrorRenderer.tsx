import { Object as ProtocolObject } from "@replayio/protocol";
import { useContext } from "react";

import { objectPropertyCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";

import ValueRenderer from "../ValueRenderer";
import { ObjectPreviewRendererProps } from "./types";
import styles from "./shared.module.css";

// Renders a protocol ObjectPreview representing an Error with a format of:
//   ErrorName: Error message...
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function ErrorRenderer({ object, pauseId }: ObjectPreviewRendererProps) {
  const replayClient = useContext(ReplayClientContext);
  const { className } = object;

  const messageProperty = object?.preview?.properties?.find(
    property => property.name === "message"
  );

  let errorContent: React.ReactNode = className;

  if (messageProperty) {
    // Handle cases where `error.message` is actually a getter
    if (messageProperty.hasOwnProperty("get")) {
      const getterValue = objectPropertyCache.read(
        replayClient,
        pauseId,
        object.objectId,
        "message"
      );

      if (getterValue == null) {
        return null;
      }

      errorContent = (
        <ValueRenderer
          context="nested"
          layout="vertical"
          pauseId={pauseId}
          protocolValue={getterValue}
        />
      );
    } else {
      errorContent = messageProperty.value;
    }
  }

  return (
    <span className={styles.Error}>
      {className}: {errorContent}
    </span>
  );
}

export async function errorProtocolObjectToString(
  replayClient: ReplayClientInterface,
  pauseId: string,
  protocolObject: ProtocolObject
) {
  const { className } = protocolObject;

  const messageProperty = protocolObject?.preview?.properties?.find(
    property => property.name === "message"
  );

  let value = messageProperty?.value;

  // Handle cases where `error.message` is actually a getter
  if (messageProperty?.hasOwnProperty("get")) {
    const getterValue = await objectPropertyCache.readAsync(
      replayClient,
      pauseId,
      protocolObject.objectId,
      "message"
    );
    value = getterValue?.value;
  }

  return messageProperty ? `${className}: ${value}` : className;
}
