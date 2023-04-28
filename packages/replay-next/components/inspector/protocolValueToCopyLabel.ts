import {
  PauseId,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";

import { clientValueCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";

export default function protocolValueToCopyLabel(
  client: ReplayClientInterface,
  protocolValue: ProtocolValue | ProtocolNamedValue,
  pauseId: PauseId
): string | null {
  const { type } = clientValueCache.read(client, pauseId, protocolValue);

  switch (type) {
    case "nan":
      return "number";
    default:
      return type || null;
  }
}
