import { SourceId } from "@replayio/protocol";
import { ReactNode, useContext, useMemo } from "react";

import { PointsContext } from "replay-next/src/contexts/PointsContext";
import { POINT_BEHAVIOR_DISABLED, Point } from "shared/client/types";
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
  const { deletePoints, editPointBehavior, points, pointBehaviors } = useContext(PointsContext);

  const sourceDetailsEntities = useAppSelector(getSourceDetailsEntities);

  const filteredAndSortedPoints = useMemo(
    () =>
      points
        .filter(point => {
          // It's possible we may not have source entries for these source IDs.
          // Either we might not have sources fetched yet,
          // or there could be obsolete persisted source IDs for points.
          // Ensure we only show points that have valid sources available.
          const sourceExists = !!sourceDetailsEntities[point.sourceId];

          const { shouldBreak, shouldLog } = pointBehaviors.get(point.id) ?? {};

          // Show both enabled and temporarily disabled points.
          const behavior = type === "breakpoint" ? shouldBreak : shouldLog;
          const matchesType = behavior !== POINT_BEHAVIOR_DISABLED;

          return sourceExists && matchesType;
        })
        .sort((a, b) => a.lineNumber - b.lineNumber),
    [pointBehaviors, points, type, sourceDetailsEntities]
  );

  const sourceIdToPointsMap = useMemo(() => {
    return filteredAndSortedPoints.reduce((map: SourceIdToPointsMap, point) => {
      if (!map.hasOwnProperty(point.sourceId)) {
        map[point.sourceId] = [point];
      } else {
        map[point.sourceId].push(point);
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
              const pointBehavior = pointBehaviors.get(point.id);

              return (
                <Breakpoint
                  key={point.id}
                  onEditPointBehavior={editPointBehavior}
                  onRemoveBreakpoint={() => deletePoints(point.id)}
                  point={point}
                  shouldBreak={pointBehavior?.shouldBreak ?? POINT_BEHAVIOR_DISABLED}
                  shouldLog={pointBehavior?.shouldLog ?? POINT_BEHAVIOR_DISABLED}
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
