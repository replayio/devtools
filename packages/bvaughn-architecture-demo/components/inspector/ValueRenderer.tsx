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
  isRootValue,
  pauseId,
  value,
}: {
  disableInteractions?: boolean;
  isRootValue: boolean;
  pauseId: ProtocolPauseId;
  value: ProtocolValue;
}) {
  const clientValue: ClientValue = useMemo(() => reformatValue(pauseId, value), [pauseId, value]);

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
