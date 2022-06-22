import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { useMemo } from "react";

import { protocolValueToClientValue, Value as ClientValue } from "../../src/utils/protocol";

export default function useClientValue(
  protocolValue: ProtocolValue,
  pauseId: PauseId
): ClientValue {
  return useMemo(
    () => protocolValueToClientValue(pauseId, protocolValue),
    [pauseId, protocolValue]
  );
}
