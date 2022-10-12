import { SameLineSourceLocations, SourceId } from "@replayio/protocol";
import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getBreakpointPositionsSuspense } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { useContext, useEffect, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";
import { useStringPref } from "ui/hooks/settings";

import ColumnBreakpoint from "./ColumnBreakpoint";

type $FixTypeLater = any;

export default function ColumnBreakpoints({ editor }: { editor: $FixTypeLater }) {
  const { focusedSourceId, visibleLines } = useContext(SourcesContext);

  const { value: hitCountsMode } = useStringPref("hitCounts");

  useEffect(() => {
    const updateWidth = () => {
      const editorElement = editor.editor.getWrapperElement();
      const gutter = editor.editor.getGutterElement();

      const gutterWidth = gutter.getBoundingClientRect().width;
      const scrollWidth = editorElement.getBoundingClientRect().width;

      // Magic formula to determine scrollbar width: https://stackoverflow.com/a/60008044/62937
      let scrollbarWidth = window.innerWidth - document.body.clientWidth;

      // Fill the _visible_ width of the editor, minus scrollbar, minus a small bit of padding
      const newWidth = scrollWidth - gutterWidth - scrollbarWidth - 10;

      let root = document.documentElement;
      root.style.setProperty("--print-statement-max-width", newWidth + "px");
      root.style.setProperty("--codemirror-gutter-width", gutterWidth + "px");
    };

    editor.editor.on("refresh", updateWidth);

    updateWidth();

    return () => {
      editor.editor.off("refresh", updateWidth);
    };
  }, [editor, hitCountsMode]);

  const { points } = useContext(PointsContext);
  const pointsByLine = useMemo(
    () =>
      points.reduce((map: Map<number, Point[]>, point) => {
        const lineNumber = point.location.line;

        if (visibleLines !== null) {
          if (lineNumber < visibleLines.start.line || lineNumber > visibleLines.end.line) {
            return map;
          }
        }

        if (!map.has(lineNumber)) {
          map.set(lineNumber, [point]);
        } else {
          map.get(lineNumber)!.push(point);
        }

        return map;
      }, new Map()),
    [points, visibleLines]
  );

  const replayClient = useContext(ReplayClientContext);

  if (!focusedSourceId || points.length === 0) {
    return null;
  }

  const breakpoints = getBreakpointPositionsSuspense(replayClient, focusedSourceId, visibleLines);

  return (
    <div>
      {Array.from(pointsByLine.entries()).map(([lineNumber, points]) => (
        <PointsForRow key={lineNumber} breakpoints={breakpoints} editor={editor} points={points} />
      ))}
    </div>
  );
}

function PointsForRow({
  breakpoints,
  editor,
  points,
}: {
  breakpoints: SameLineSourceLocations[];
  editor: $FixTypeLater;
  points: Point[];
}) {
  const line = points[0]!.location.line;

  // TODO BAC-2329
  // The backend sometimes returns duplicate columns per line;
  // In order to prevent the frontend from showing something weird, let's dedupe them here.
  const breakpointsForLine = useMemo(() => {
    const match = breakpoints.find(breakpoint => breakpoint.line === line);
    if (match != null) {
      return new Set(match.columns);
    } else {
      return null;
    }
  }, [breakpoints, line]);

  const client = useContext(ReplayClientContext);

  if (breakpointsForLine == null) {
    return null;
  }

  return Array.from(breakpointsForLine).map((column, index) => {
    const point = points.find(point => point.location.column === column);
    if (point == null) {
      return null;
    }

    return <ColumnBreakpoint key={index} editor={editor} insertAt={index} point={point} />;
  }) as any;
}
