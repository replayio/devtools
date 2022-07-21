import { Loggable } from "@bvaughn/components/console/LoggablesContext";
import { PointInstance } from "@bvaughn/src/contexts/PointsContext";
import { TerminalExpression } from "@bvaughn/src/contexts/TerminalContext";
import { EventTypeLog } from "@bvaughn/src/suspense/EventsCache";
import { ProtocolMessage } from "@bvaughn/src/suspense/MessagesCache";

export function isEventTypeLog(loggable: Loggable): loggable is EventTypeLog {
  return loggable.type === "EventTypeLog";
}

export function isPointInstance(loggable: Loggable): loggable is PointInstance {
  return loggable.type === "PointInstance";
}

export function isProtocolMessage(loggable: Loggable): loggable is ProtocolMessage {
  return loggable.type === "ProtocolMessage";
}

export function isTerminalExpression(loggable: Loggable): loggable is TerminalExpression {
  return loggable.type === "TerminalExpression";
}
