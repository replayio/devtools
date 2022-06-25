import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { protocolValueToClientValue, Value as ClientValue } from "@source/utils/protocol";
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
