import { ExecutionPoint } from "@replayio/protocol";
import { compareNumericStrings } from "protocol/utils";

export function pointEquals(p1: ExecutionPoint, p2: ExecutionPoint) {
  p1 == p2;
}

export function pointPrecedes(p1: ExecutionPoint, p2: ExecutionPoint) {
  return compareNumericStrings(p1, p2) < 0;
}

export function comparePoints(p1: ExecutionPoint, p2: ExecutionPoint) {
  return compareNumericStrings(p1, p2);
}
