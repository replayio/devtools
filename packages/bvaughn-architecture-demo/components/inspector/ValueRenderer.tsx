import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { FC, memo, useContext } from "react";

import { ReplayClientContext } from "../../src/contexts/ReplayClientContext";
import { getObjectWithPreview } from "../../src/suspense/ObjectPreviews";
import { getObjectType } from "../../src/utils/protocol";

import useClientValue from "./useClientValue";
import ArrayRenderer from "./values/ArrayRenderer";
import ClientValueValueRenderer from "./values/ClientValueValueRenderer";
import FunctionRenderer from "./values/FunctionRenderer";
import HTMLElementRenderer from "./values/HTMLElementRenderer";
import MapRenderer from "./values/MapRenderer";
import ObjectRenderer from "./values/ObjectRenderer";
import RegExpRenderer from "./values/RegExpRenderer";
import SetRenderer from "./values/SetRenderer";
import { ObjectPreviewRendererProps } from "./values/types";

// Renders protocol Object/ObjectPreview values.
// This renderer only renders a value (no name) and can be used with both horizontal and vertical layouts.
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default memo(function ValueRenderer({
  isNested,
  layout = "horizontal",
  pauseId,
  protocolValue,
}: {
  isNested: boolean;
  layout?: "horizontal" | "vertical";
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

      // Preview can overflow when rendering inline/horizontal mode.
      const noOverflow = layout === "vertical";
      const object = getObjectWithPreview(client, pauseId, objectId!, noOverflow);
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
          switch (getObjectType(object)) {
            case "html":
              ObjectPreviewRenderer = HTMLElementRenderer;
              break;
            case "map":
              ObjectPreviewRenderer = MapRenderer;
              break;
            case "regexp":
              ObjectPreviewRenderer = RegExpRenderer;
              break;
            case "set":
              ObjectPreviewRenderer = SetRenderer;
              break;
            case "other":
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
});
