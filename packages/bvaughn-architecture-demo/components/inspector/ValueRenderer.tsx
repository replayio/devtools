import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { FC, useContext } from "react";

import { ReplayClientContext } from "../../src/contexts/ReplayClientContext";
import { getObjectWithPreview } from "../../src/suspense/ObjectPreviews";

import useClientValue from "./useClientValue";
import ArrayRenderer from "./values/ArrayRenderer";
import ClientValueValueRenderer from "./values/ClientValueValueRenderer";
import FunctionRenderer from "./values/FunctionRenderer";
import MapRenderer from "./values/MapRenderer";
import ObjectRenderer from "./values/ObjectRenderer";
import RegExpRenderer from "./values/RegExpRenderer";
import SetRenderer from "./values/SetRenderer";
import { ObjectPreviewRendererProps } from "./values/types";

// Renders protocol Object/ObjectPreview values.
// This renderer only renders a value (no name) and can be used with both horizontal and vertical layouts.
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function ValueRenderer({
  isNested,
  pauseId,
  protocolValue,
}: {
  isNested: boolean;
  pauseId: PauseId;
  protocolValue: ProtocolValue;
}) {
  const client = useContext(ReplayClientContext);
  const clientValue = useClientValue(protocolValue, pauseId);

  // TODO (inspector) Handle getters – Lazily fetch values only after user input.

  switch (clientValue.type) {
    case "array":
    case "function":
    case "object": {
      const { objectId, type } = clientValue;

      const object = getObjectWithPreview(client, pauseId, objectId!);
      if (object == null) {
        throw Error(`Could not find object with ID "${objectId}"`);
      }

      let ObjectPreviewRenderer: FC<ObjectPreviewRendererProps> | null = null;
      switch (type) {
        case "array":
          ObjectPreviewRenderer = ArrayRenderer;
          break;
        case "function":
          ObjectPreviewRenderer = FunctionRenderer;
          break;
        case "object":
        default:
          switch (object?.className) {
            case "Map":
            case "WeakMap":
              ObjectPreviewRenderer = MapRenderer;
              break;
            case "RegExp":
              ObjectPreviewRenderer = RegExpRenderer;
              break;
            case "Set":
            case "WeakSet":
              ObjectPreviewRenderer = SetRenderer;
              break;
            default:
              ObjectPreviewRenderer = ObjectRenderer;
              break;
          }
          break;
      }

      return <ObjectPreviewRenderer object={object} pauseId={pauseId} />;
    }
    default: {
      return <ClientValueValueRenderer clientValue={clientValue} isNested={isNested} />;
    }
  }
}
