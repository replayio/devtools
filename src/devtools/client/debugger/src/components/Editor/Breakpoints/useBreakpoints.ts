import classNames from "classnames";
import { useContext, useEffect } from "react";

import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { getDocument, resizeBreakpointGutter } from "devtools/client/debugger/src/utils/editor";
import type { SourceEditor } from "devtools/client/debugger/src/utils/editor/source-editor";
import { features } from "devtools/client/debugger/src/utils/prefs";
import { getSelectedSource } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

const { codeFolding } = features;

export default function useEditorBreakpoints(sourceEditor: SourceEditor | null) {
  const selectedSource = useAppSelector(getSelectedSource);

  const { deletePoints, editPoint, points } = useContext(PointsContext);

  useEffect(() => {
    if (!points || !selectedSource || !sourceEditor) {
      return;
    }

    const { editor } = sourceEditor;

    const doc = getDocument(selectedSource.id);
    if (!doc) {
      return;
    }

    // We only need to render one gutter breakpoint per line.
    // This Set is used to track which lines we've already rendered.
    const renderedLines = new Set();

    points.forEach(point => {
      if (!point.shouldBreak) {
        return;
      }

      const lineNumber = point.location.line;
      if (renderedLines.has(lineNumber)) {
        return;
      }

      renderedLines.add(lineNumber);

      const marker = makeMarker();
      marker.addEventListener("click", event => {
        if ((event.ctrlKey && event.button === 0) || event.button === 2) {
          // Ignore right clicks
          return;
        }

        event.stopPropagation();
        event.preventDefault();

        if (point.shouldLog) {
          editPoint(point.id, { shouldBreak: false });
        } else {
          deletePoints(
            ...points
              .filter(({ location }) => location.line === point.location.line)
              .map(({ id }) => id)
          );
        }
      });
      marker.addEventListener("contextmenu", event => {
        event.stopPropagation();
        event.preventDefault();
      });

      const lineIndex = lineNumber - 1;
      editor.setGutterMarker(lineIndex, "breakpoints", marker);
      editor.addLineClass(lineIndex, "line", "new-breakpoint");
      editor.removeLineClass(lineIndex, "line", "breakpoint-disabled");

      if (!point.shouldBreak) {
        editor.addLineClass(lineIndex, "line", "breakpoint-disabled");
      }
    });

    resizeBreakpointGutter(editor);

    return () => {
      points.forEach(point => {
        if (!point.shouldBreak) {
          return;
        }

        const lineNumber = point.location.line;
        const lineIndex = lineNumber - 1;
        editor.setGutterMarker(lineIndex, "breakpoints", null);
        editor.removeLineClass(lineIndex, "line", "new-breakpoint");
        editor.removeLineClass(lineIndex, "line", "breakpoint-disabled");
      });
    };
  }, [deletePoints, editPoint, points, selectedSource, sourceEditor]);
}

const BREAKPOINT = document.createElement("div");
BREAKPOINT.innerHTML =
  '<svg viewBox="0 0 60 15" width="60" height="15"><path d="M53.07.5H1.5c-.54 0-1 .46-1 1v12c0 .54.46 1 1 1h51.57c.58 0 1.15-.26 1.53-.7l4.7-6.3-4.7-6.3c-.38-.44-.95-.7-1.53-.7z"/></svg>';

function makeMarker(): HTMLDivElement {
  const marker = BREAKPOINT.cloneNode(true) as HTMLDivElement;
  marker.className = classNames("editor new-breakpoint", {
    "folding-enabled": codeFolding,
  });

  return marker;
}
