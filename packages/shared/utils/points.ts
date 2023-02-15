import { Point } from "shared/client/types";

export function isValidPoint(maybePoint: unknown): maybePoint is Point {
  return (
    typeof maybePoint === "object" &&
    maybePoint !== null &&
    maybePoint.hasOwnProperty("badge") &&
    maybePoint.hasOwnProperty("condition") &&
    maybePoint.hasOwnProperty("content")
  );
}
