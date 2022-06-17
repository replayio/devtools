import {
  Object as ProtocolObject,
  PauseId as ProtocolPauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { useMemo } from "react";

import { reformatValue, Value as ClientValue } from "../../src/utils/protocol";

import NestedRenderer from "./NestedRenderer";
import ShallowRenderer from "./ShallowRenderer";

export default function ValueRenderer({
  disableInteractions = false,
  index,
  isRootValue,
  pauseId,
  protocolKey,
  protocolValue,
}: {
  disableInteractions?: boolean;
  index?: number;
  isRootValue: boolean;
  pauseId: ProtocolPauseId;
  protocolKey?: ProtocolValue | undefined;
  protocolValue: ProtocolValue;
}) {
  const clientValue: ClientValue = useMemo(
    () => reformatValue(pauseId, protocolValue, protocolKey, index != null ? `${index}` : null),
    [index, pauseId, protocolKey, protocolValue]
  );

  switch (clientValue.type) {
    case "array":
    case "function":
    case "object":
      return (
        <NestedRenderer
          disableInteractions={disableInteractions}
          pauseId={pauseId}
          value={clientValue}
        />
      );
    default:
      return <ShallowRenderer isRootValue={isRootValue} value={clientValue} />;
  }
}
