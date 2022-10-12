import classnames from "classnames";
import { getDocument, toEditorLine } from "devtools/client/debugger/src/utils/editor";
import { features } from "devtools/client/debugger/src/utils/prefs";
import { resizeBreakpointGutter } from "devtools/client/debugger/src/utils/ui";
import { PureComponent } from "react";
import { Point, PointId } from "shared/client/types";
import type { SourceDetails } from "ui/reducers/sources";

const breakpointSvg = document.createElement("div");
breakpointSvg.innerHTML =
  '<svg viewBox="0 0 60 15" width="60" height="15"><path d="M53.07.5H1.5c-.54 0-1 .46-1 1v12c0 .54.46 1 1 1h51.57c.58 0 1.15-.26 1.53-.7l4.7-6.3-4.7-6.3c-.38-.44-.95-.7-1.53-.7z"/></svg>';

type $FixTypeLater = any;

type BreakpointProps = {
  deletePoints: (...ids: PointId[]) => void;
  editPoint: (id: PointId, partialPoint: Partial<Point>) => void;
  editor: $FixTypeLater;
  point: Point;
  points: Point[];
  selectedSource: SourceDetails;
};

export default class Breakpoint extends PureComponent<BreakpointProps> {
  componentDidMount() {
    this.addBreakpoint(this.props);
  }

  componentDidUpdate(prevProps: BreakpointProps) {
    this.removeBreakpoint(prevProps);
    this.addBreakpoint(this.props);
  }

  componentWillUnmount() {
    this.removeBreakpoint(this.props);
  }

  makeMarker() {
    const bp = breakpointSvg.cloneNode(true) as HTMLDivElement;

    bp.className = classnames("editor new-breakpoint", {
      "folding-enabled": features.codeFolding,
    });

    bp.onmousedown = this.onClick;
    bp.oncontextmenu = this.onContextMenu;

    return bp;
  }

  onClick = (event: any) => {
    const { deletePoints, editPoint, point, points } = this.props;

    // ignore right clicks
    if ((event.ctrlKey && event.button === 0) || event.button === 2) {
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
  };

  onContextMenu = (event: any) => {
    event.stopPropagation();
    event.preventDefault();

    return;
  };

  addBreakpoint(props: BreakpointProps) {
    const { point, editor, selectedSource } = props;
    const selectedLocation = point.location;

    if (!selectedSource || !point.shouldBreak) {
      return;
    }

    const sourceId = selectedSource.id;
    const line = toEditorLine(selectedLocation.line);
    const doc = getDocument(sourceId);

    resizeBreakpointGutter(editor.codeMirror);
    // @ts-expect-error method doesn't exist on Doc
    doc.setGutterMarker(line, "breakpoints", this.makeMarker());

    editor.codeMirror.addLineClass(line, "line", "new-breakpoint");
    editor.codeMirror.removeLineClass(line, "line", "breakpoint-disabled");

    if (!point.shouldBreak) {
      editor.codeMirror.addLineClass(line, "line", "breakpoint-disabled");
    }
  }

  removeBreakpoint(props: BreakpointProps) {
    const { selectedSource, point } = props;
    if (!selectedSource) {
      return;
    }

    const sourceId = selectedSource.id;
    const doc = getDocument(sourceId);

    if (!doc) {
      return;
    }

    const selectedLocation = point.location;
    const line = toEditorLine(selectedLocation.line);

    // @ts-expect-error method doesn't exist on Doc
    doc.setGutterMarker(line, "breakpoints", null);
    // @ts-expect-error method doesn't exist on Doc
    doc.removeLineClass(line, "line", "new-breakpoint");
    // @ts-expect-error method doesn't exist on Doc
    doc.removeLineClass(line, "line", "breakpoint-disabled");
  }

  render() {
    return null;
  }
}
