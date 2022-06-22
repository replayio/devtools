import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { FC, memo, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { getObjectWithPreview } from "../../src/suspense/ObjectPreviews";

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
  let ObjectPreviewRenderer: FC<ObjectPreviewRendererProps> | null = null;

  switch (clientValue.type) {
    case "array":
      ObjectPreviewRenderer = ArrayRenderer;
      break;
    case "function":
      ObjectPreviewRenderer = FunctionRenderer;
      break;
    case "html-element":
    case "html-text":
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
    case "object":
      ObjectPreviewRenderer = ObjectRenderer;
      break;
  }

  if (ObjectPreviewRenderer !== null) {
    // Preview can overflow when rendering inline/horizontal mode.
    const noOverflow = layout === "vertical";
    const object = getObjectWithPreview(client, pauseId, clientValue.objectId!, noOverflow);
    if (object == null) {
      throw Error(`Could not find object with ID "${clientValue.objectId}"`);
    }

    return <ObjectPreviewRenderer object={object} pauseId={pauseId} />;
  }

  return <ClientValueValueRenderer clientValue={clientValue} isNested={isNested} />;
});
