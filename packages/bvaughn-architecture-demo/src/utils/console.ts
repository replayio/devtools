import { Loggable } from "@bvaughn/components/console/hooks/useFilteredMessages";
import { LogPointInstance } from "@bvaughn/src/contexts/LogPointsContext";
import { Message as ProtocolMessage } from "@replayio/protocol";

export function isLogPointInstance(loggable: Loggable): loggable is LogPointInstance {
  return loggable.hasOwnProperty("timeStampedHitPoint") && loggable.hasOwnProperty("point");
}

export function isProtocolMessage(loggable: Loggable): loggable is ProtocolMessage {
  return !loggable.hasOwnProperty("timeStampedHitPoint") || !loggable.hasOwnProperty("point");
}
