import { SourceId } from "@replayio/protocol";
import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import {
  createHeadlessEditor,
  waitForEditor,
} from "devtools/client/debugger/src/utils/editor/create-editor";
import { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Point } from "shared/client/types";

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
  const [headlessEditor, setHeadlessEditor] = useState<any>(null);

  useEffect(() => {
    (async () => {
      await waitForEditor();
      setHeadlessEditor(createHeadlessEditor());
    })();
  }, []);

  const filteredAndSortedPoints = useMemo(
    () =>
      points
        .filter(point => {
          if (type === "breakpoint") {
            return point.shouldBreak;
          } else {
            return point.shouldLog;
          }
        })
        .sort((a, b) => a.location.line - b.location.line),
    [points, type]
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

  if (headlessEditor === null) {
    return null;
  }

  if (filteredAndSortedPoints.length === 0) {
    return (
      <div className="pane">
        <div className="text-themeBodyColor mx-2 mt-2 mb-4 space-y-3 whitespace-normal rounded-lg bg-themeTextFieldBgcolor p-3 text-center text-xs">
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
                  editor={headlessEditor}
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
