import { SourceId } from "@replayio/protocol";
import { ReactNode, useContext, useMemo } from "react";

import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { Point } from "shared/client/types";
import { getSourceDetailsEntities } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

import Breakpoint from "./Breakpoint";
import BreakpointHeading from "./BreakpointHeading";

export type SourceIdToPointsMap = { [key: SourceId]: Point[] };

export default function Breakpoints({
  emptyContent,
  type,
}: {
  emptyContent: ReactNode;
  type: "breakpoint" | "logpoint";
}) {
  const { deletePoints, points } = useContext(PointsContext);

  const sourceDetailsEntities = useAppSelector(getSourceDetailsEntities);

  const filteredAndSortedPoints = useMemo(
    () =>
      points
        .filter(point => {
          // It's possible we may not have source entries for these source IDs.
          // Either we might not have sources fetched yet,
          // or there could be obsolete persisted source IDs for points.
          // Ensure we only show points that have valid sources available.
          const sourceExists = !!sourceDetailsEntities[point.location.sourceId];
          const matchesType = type === "breakpoint" ? point.shouldBreak : point.shouldLog;

          return sourceExists && matchesType;
        })
        .sort((a, b) => a.location.line - b.location.line),
    [points, type, sourceDetailsEntities]
  );

  const sourceIdToPointsMap = useMemo(() => {
    return filteredAndSortedPoints.reduce((map: SourceIdToPointsMap, point) => {
      if (!map.hasOwnProperty(point.location.sourceId)) {
        map[point.location.sourceId] = [point];
      } else {
        map[point.location.sourceId].push(point);
      }
      return map;
    }, {});
  }, [filteredAndSortedPoints]);

  if (filteredAndSortedPoints.length === 0) {
    return (
      <div className="pane">
        <div className="text-themeBodyColor mx-2 mt-2 mb-4 space-y-3 whitespace-normal rounded-lg bg-chrome p-3 text-center text-xs">
          {emptyContent}
        </div>
      </div>
    );
  }

  const entries = Object.entries(sourceIdToPointsMap);

  return (
    <div className="pane breakpoints-list">
      {entries.map(([sourceId, points]) => {
        return (
          <div className="breakpoints-list-source" key={sourceId}>
            <BreakpointHeading
              key="header"
              breakpoint={points[0]}
              sourceId={sourceId}
              onRemoveBreakpoints={() => deletePoints(...points.map(point => point.id))}
            />
            {points.map(point => {
              return (
                <Breakpoint
                  key={point.id}
                  breakpoint={point}
                  onRemoveBreakpoint={() => deletePoints(point.id)}
                  type={type}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
