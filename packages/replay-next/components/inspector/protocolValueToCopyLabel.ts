import {
  PauseId,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";

import { protocolValueToClientValue } from "replay-next/src/utils/protocol";

export default function protocolValueToCopyLabel(
  protocolValue: ProtocolValue | ProtocolNamedValue,
  pauseId: PauseId
): string | null {
  const clientValue = protocolValueToClientValue(pauseId, protocolValue);
  return clientValue.type || null;
}
