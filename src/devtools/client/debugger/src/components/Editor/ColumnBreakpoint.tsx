import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import classnames from "classnames";
import SourceEditor from "devtools/client/debugger/src/utils/editor/source-editor";
import React, { Component, ContextType } from "react";
import { Point } from "shared/client/types";
import { features } from "ui/utils/prefs";

import { getDocument } from "../../utils/editor";

import Panel from "./Breakpoints/Panel/Panel";

const pointButton = document.createElement("button");
pointButton.innerHTML =
  '<svg viewBox="0 0 11 13" width="11" height="13"><path d="M5.07.5H1.5c-.54 0-1 .46-1 1v10c0 .54.46 1 1 1h3.57c.58 0 1.15-.26 1.53-.7l3.7-5.3-3.7-5.3C6.22.76 5.65.5 5.07.5z"/></svg>';

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
  bp.onclick = onClick;

  // NOTE: flow does not know about oncontextmenu
  bp.oncontextmenu = onContextMenu;

  return bp;
}

type CBProps = {
  point: Point;
  editor: SourceEditor;
  insertAt: number;
};

export default class ColumnPoint extends Component<CBProps> {
  bookmark: any;

  static contextType = PointsContext;
  context!: ContextType<typeof PointsContext>;

  addColumnPoint = (nextProps?: CBProps) => {
    const { point } = nextProps || this.props;
    const { column, line, sourceId } = point.location;

    if (!features.columnBreakpoints) {
      return null;
    }

    const doc = getDocument(sourceId);
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

    const widget = makeBookmark({
      isActive: true,
      onClick: this.onClick,
      onContextMenu: this.onContextMenu,
      title,
    });

    this.bookmark = doc.setBookmark({ line, ch: column }, { widget });
  };

  clearColumnPoint = () => {
    if (this.bookmark) {
      this.bookmark.clear();
      this.bookmark = null;
    }
  };

  onClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    const { point } = this.props;
    const { deletePoints, editPoint } = this.context;

    // TODO We should revisit this behavior; it's not clear what the user is asking for here IMO.
    if (point.shouldLog) {
      deletePoints(point.id);
    } else {
      editPoint(point.id, {
        shouldLog: true,
      });
    }
  };

  onContextMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    return;
  };

  componentDidMount() {
    this.addColumnPoint();
  }

  componentWillUnmount() {
    this.clearColumnPoint();
  }

  componentDidUpdate() {
    this.clearColumnPoint();
    this.addColumnPoint();
  }

  shouldComponentUpdate(nextProps: CBProps) {
    return this.props.point != nextProps.point;
  }

  render() {
    const { editor, point, insertAt } = this.props;

    // Only render the log point panel if we have a logging-enabled Point at this column.
    // Otherwise this component just renders a clickable "bookmark" in Code Mirror.
    if (!point.shouldLog) {
      return null;
    }

    return <Panel breakpoint={point} editor={editor} insertAt={insertAt} />;
  }
}
