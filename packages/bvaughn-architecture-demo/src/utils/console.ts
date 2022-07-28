import { Loggable } from "@bvaughn/components/console/LoggablesContext";
import { PointInstance } from "@bvaughn/src/contexts/PointsContext";
import { TerminalExpression } from "@bvaughn/src/contexts/TerminalContext";
import { EventLog } from "@bvaughn/src/suspense/EventsCache";
import { ProtocolMessage } from "@bvaughn/src/suspense/MessagesCache";

export function isEventLog(loggable: Loggable): loggable is EventLog {
  return loggable.type === "EventLog";
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

export function getLoggableTime(loggable: Loggable): number {
  if (isEventLog(loggable)) {
    return loggable.time;
  } else if (isPointInstance(loggable)) {
    return loggable.timeStampedHitPoint.time;
  } else if (isProtocolMessage(loggable)) {
    return loggable.point.time;
  } else if (isTerminalExpression(loggable)) {
    return loggable.time;
  } else {
    throw Error("Unsupported loggable type");
  }
}
