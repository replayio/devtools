import classnames from "classnames";
import { useContext, useLayoutEffect } from "react";

import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { getDocument } from "devtools/client/debugger/src/utils/editor/source-documents";
import SourceEditor from "devtools/client/debugger/src/utils/editor/source-editor";
import { Point } from "shared/client/types";
import { features } from "ui/utils/prefs";

import Panel from "./Breakpoints/Panel/Panel";

const { columnBreakpoints } = features;

const pointButton = document.createElement("button");
pointButton.innerHTML =
  '<svg viewBox="0 0 11 13" width="11" height="13"><path d="M5.07.5H1.5c-.54 0-1 .46-1 1v10c0 .54.46 1 1 1h3.57c.58 0 1.15-.26 1.53-.7l3.7-5.3-3.7-5.3C6.22.76 5.65.5 5.07.5z"/></svg>';

export default function ColumnBreakpoint({
  editor,
  insertAt,
  point,
}: {
  editor: SourceEditor;
  insertAt: number;
  point: Point;
}) {
  const { deletePoints, editPoint } = useContext(PointsContext);

  useLayoutEffect(() => {
    if (!columnBreakpoints) {
      return;
    }

    const doc = getDocument(point.location.sourceId);
    if (!doc) {
      return;
    }

    // TODO We should revisit this behavior; it's not clear what the user is asking for here IMO.
    let title;
    if (point.shouldLog) {
      title = "Remove point";
    } else {
      title = "Enabling logging";
    }

    const onClick = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      // TODO We should revisit this behavior; it's not clear what the user is asking for here IMO.
      if (point.shouldLog) {
        deletePoints(point.id);
      } else {
        editPoint(point.id, {
          shouldLog: true,
        });
      }
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const widget = makeBookmark({
      isActive: true,
      onClick,
      onContextMenu,
      title,
    });

    const bookmark = doc.setBookmark(
      { line: point.location.line - 1, ch: point.location.column },
      { widget }
    );

    return () => {
      bookmark.clear();
    };
  }, [deletePoints, editPoint, point]);

  // Only render the log point panel if we have a logging-enabled Point at this column.
  // Otherwise this component just renders a clickable "bookmark" in Code Mirror.
  if (!point.shouldLog) {
    return null;
  }

  return <Panel breakpoint={point} editor={editor} insertAt={insertAt} />;
}

function makeBookmark({
  isActive,
  onClick,
  onContextMenu,
  title,
}: {
  isActive: boolean;
  onClick: (e: any) => void;
  onContextMenu: (e: any) => void;
  title: string;
}) {
  const bp = pointButton.cloneNode(true) as HTMLButtonElement;
  bp.className = classnames("column-breakpoint", {
    active: isActive,
  });
  bp.setAttribute("title", title);
  bp.addEventListener("click", onClick);
  bp.addEventListener("contextmenu", onContextMenu);

  return bp;
}
