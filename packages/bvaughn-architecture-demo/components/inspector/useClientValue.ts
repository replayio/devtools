import { protocolValueToClientValue, Value as ClientValue } from "@bvaughn/src/utils/protocol";
import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { useMemo } from "react";

export default function useClientValue(
  protocolValue: ProtocolValue,
  pauseId: PauseId
): ClientValue {
  return useMemo(
    () => protocolValueToClientValue(pauseId, protocolValue),
    [pauseId, protocolValue]
  );
}
