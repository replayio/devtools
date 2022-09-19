import { Location } from "@replayio/protocol";
import { getHitPointsForLocation } from "bvaughn-architecture-demo/src/suspense/PointsCache";
import { useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getFocusRegion } from "ui/reducers/timeline";
import { getHoveredLineNumberLocation } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { UnsafeFocusRegion } from "ui/state/timeline";
import { HitPointsAndStatusTuple } from "shared/client/types";
import {
  getPossibleBreakpointsForSourceNormalized,
  EMPTY_LOCATIONS,
} from "ui/reducers/possibleBreakpoints";

const isDev = process.env.NODE_ENV !== "production";

const NO_BREAKPOINT_LOCATIONS: Record<number, number[]> = {};

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

  const possibleBreakpoints = useAppSelector(state => {
    if (!locationOrNull) {
      return NO_BREAKPOINT_LOCATIONS;
    }
    return getPossibleBreakpointsForSourceNormalized(state, locationOrNull.sourceId);
  });

  let isLocationValidBreakpoint = false;
  if (locationOrNull !== null) {
    const breakpointColumnsForLine = possibleBreakpoints[locationOrNull.line] ?? [];
    isLocationValidBreakpoint = !!breakpointColumnsForLine.find(
      column => column === locationOrNull!.column
    );
  }

  return isLocationValidBreakpoint
    ? getHitPointsForLocation(replayClient, locationOrNull!, null, unsafeFocusRegion)
    : [null, null];
}
