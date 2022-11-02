import { SameLineSourceLocations } from "@replayio/protocol";
import { useContext, useEffect, useMemo } from "react";

import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getBreakpointPositionsSuspense } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import type { SourceEditor } from "devtools/client/debugger/src/utils/editor/source-editor";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";
import { useStringPref } from "ui/hooks/settings";

import ColumnBreakpoint from "./ColumnBreakpoint";

export default function ColumnBreakpoints({ editor }: { editor: SourceEditor }) {
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
  const pointsByLine = useMemo(() => {
    const map = points.reduce((map: Map<number, Point[]>, point) => {
      if (!point.shouldLog) {
        return map;
      }

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
    }, new Map());

    return Array.from(map.entries());
  }, [points, visibleLines]);

  const replayClient = useContext(ReplayClientContext);

  if (!focusedSourceId || points.length === 0) {
    return null;
  }

  const [, breakpointPositionsByLine] = getBreakpointPositionsSuspense(
    replayClient,
    focusedSourceId
  );

  return (
    <div>
      {pointsByLine.map(([lineNumber, points]) => (
        <PointsForRow
          key={lineNumber}
          breakpoints={breakpointPositionsByLine}
          editor={editor}
          points={points}
        />
      ))}
    </div>
  );
}

function PointsForRow({
  breakpoints,
  editor,
  points,
}: {
  breakpoints: Map<number, SameLineSourceLocations>;
  editor: SourceEditor;
  points: Point[];
}) {
  const line = points[0]!.location.line;

  const breakpointsForLine = breakpoints.get(line);

  if (!breakpointsForLine) {
    return null;
  }

  return breakpointsForLine.columns.map((column, index) => {
    const point = points.find(point => point.location.column === column);
    if (point == null) {
      return null;
    }

    return <ColumnBreakpoint key={index} editor={editor} insertAt={index} point={point} />;
  }) as any;
}
