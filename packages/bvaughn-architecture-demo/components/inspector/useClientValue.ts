import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { useMemo } from "react";

import { reformatValue, Value as ClientValue } from "../../src/utils/protocol";

export default function useClientValue(
  protocolValue: ProtocolValue,
  pauseId: PauseId
): ClientValue {
  return useMemo(() => reformatValue(pauseId, protocolValue), [pauseId, protocolValue]);
}
