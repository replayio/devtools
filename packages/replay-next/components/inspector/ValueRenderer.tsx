import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { FC, memo, useContext } from "react";

import {
  getCachedObject,
  getObjectWithPreviewSuspense,
} from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useClientValue from "./useClientValue";
import ArrayRenderer from "./values/ArrayRenderer";
import ClientValueValueRenderer from "./values/ClientValueValueRenderer";
import DateRenderer from "./values/DateRenderer";
import ErrorRenderer from "./values/ErrorRenderer";
import FunctionRenderer from "./values/FunctionRenderer";
import HTMLElementRenderer from "./values/HTMLElementRenderer";
import MapRenderer from "./values/MapRenderer";
import ObjectRenderer from "./values/ObjectRenderer";
import RegExpRenderer from "./values/RegExpRenderer";
import SetRenderer from "./values/SetRenderer";
import { ObjectPreviewRendererProps } from "./values/types";

// TODO Add custom Date renderer (and ClientValue type)

// Renders protocol Object/ObjectPreview values.
// This renderer only renders a value (no name) and can be used with both horizontal and vertical layouts.
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
function ValueRenderer({
  context,
  layout = "horizontal",
  pauseId,
  protocolValue,
}: {
  context: "console" | "default" | "nested";
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
    case "date":
      ObjectPreviewRenderer = DateRenderer;
      break;
    case "error":
      ObjectPreviewRenderer = ErrorRenderer;
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

    // Avoid loading object preview data for inline layouts because this can be expensive.
    // The downside is that value renderers won't be able to display as much information (e.g. "Array" rather than "Array(3)")
    // but this is how the old console works and each value renderer should be able to downgrade like this.
    const object =
      getCachedObject(pauseId, clientValue.objectId!) ||
      getObjectWithPreviewSuspense(client, pauseId, clientValue.objectId!, noOverflow);

    if (object == null) {
      throw Error(`Could not find object with ID "${clientValue.objectId}"`);
    }

    return (
      <ObjectPreviewRenderer
        context={context}
        object={object}
        pauseId={pauseId}
        protocolValue={protocolValue}
      />
    );
  }

  return <ClientValueValueRenderer clientValue={clientValue} context={context} />;
}

export default memo(ValueRenderer);
