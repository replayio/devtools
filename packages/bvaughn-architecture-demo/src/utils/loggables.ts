import { Loggable } from "@bvaughn/components/console/LoggablesContext";
import { PointInstance } from "@bvaughn/src/contexts/PointsContext";
import { TerminalExpression } from "@bvaughn/src/contexts/TerminalContext";
import { EventLog } from "@bvaughn/src/suspense/EventsCache";
import { ProtocolMessage } from "@bvaughn/src/suspense/MessagesCache";
import { ExecutionPoint } from "@replayio/protocol";

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

export function getLoggableExecutionPoint(loggable: Loggable): ExecutionPoint {
  if (isEventLog(loggable)) {
    return loggable.point;
  } else if (isPointInstance(loggable)) {
    return loggable.timeStampedHitPoint.point;
  } else if (isProtocolMessage(loggable)) {
    return loggable.point.point;
  } else if (isTerminalExpression(loggable)) {
    return loggable.point;
  } else {
    throw Error("Unsupported loggable type");
  }
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

export function loggableSort(a: Loggable, b: Loggable): number {
  const aPoint = getLoggableExecutionPoint(a);
  const bPoint = getLoggableExecutionPoint(b);

  // Terminal messages may be logged at the same point/time as other loggables.
  // If this happens, TerminalExpressions should always come last.
  if (aPoint === bPoint) {
    const aIsTerminalExpression = isTerminalExpression(a);
    const bIsTerminalExpression = isTerminalExpression(b);
    if (aIsTerminalExpression && bIsTerminalExpression) {
      // Two terminal messages at the same time can be sorted by the order they were added in.
      return a.id - b.id;
    } else if (aIsTerminalExpression) {
      return 1;
    } else if (bIsTerminalExpression) {
      return -1;
    }
  }

  return aPoint.localeCompare(bPoint);
}
