import { Location } from "@replayio/protocol";
import { getHitPointsForLocation } from "bvaughn-architecture-demo/src/suspense/PointsCache";
import { useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getFocusRegion } from "ui/reducers/timeline";
import { getHoveredLineNumberLocation } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { UnsafeFocusRegion } from "ui/state/timeline";
import { HitPointsAndStatusTuple } from "shared/client/types";
import { getPossibleBreakpointsForSelectedSource } from "ui/reducers/possibleBreakpoints";

const isDev = process.env.NODE_ENV !== "production";

// Note that this hook uses Suspense and so it should not be called outside of a <Suspense></Suspense> wrapper.
export default function useHitPointsForHoveredLocation(): HitPointsAndStatusTuple | [null, null] {
  const replayClient = useContext(ReplayClientContext);
  const focusRegion = useAppSelector(getFocusRegion);
  const unsafeFocusRegion = focusRegion ? (focusRegion as UnsafeFocusRegion) : null;

  const hoveredLineNumberLocation = useAppSelector(getHoveredLineNumberLocation);

  let locationOrNull: Location | null = null;
  if (hoveredLineNumberLocation && hoveredLineNumberLocation.line != null) {
    locationOrNull = {
      column: hoveredLineNumberLocation.column || 0,
      line: hoveredLineNumberLocation.line,
      sourceId: hoveredLineNumberLocation.sourceId,
    };
  }

  const possibleBreakpoints = useAppSelector(getPossibleBreakpointsForSelectedSource);
  const isLocationValidBreakpoint =
    locationOrNull !== null &&
    possibleBreakpoints.find(
      location =>
        location.column === locationOrNull!.column &&
        location.line === locationOrNull!.line &&
        location.sourceId === locationOrNull!.sourceId
    );

  return isLocationValidBreakpoint
    ? getHitPointsForLocation(replayClient, locationOrNull!, null, unsafeFocusRegion)
    : [null, null];
}
