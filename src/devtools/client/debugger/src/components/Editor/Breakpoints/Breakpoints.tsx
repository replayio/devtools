import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import SourceEditor from "devtools/client/debugger/src/utils/editor/source-editor";
import { useContext } from "react";
import { getSelectedSource } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

import Breakpoint from "./Breakpoint";

export default function Breakpoints({ editor }: { editor: SourceEditor }) {
  const selectedSource = useAppSelector(getSelectedSource);

  const { deletePoints, editPoint, points } = useContext(PointsContext);

  if (!selectedSource || !points) {
    return null;
  }

  // We only need to render one gutter breakpoint per line.
  const renderedLines = new Set();

  return (
    <div>
      {points.map(point => {
        if (renderedLines.has(point.location.line)) {
          return null;
        }

        renderedLines.add(point.location.line);

        return (
          <Breakpoint
            key={point.id}
            deletePoints={deletePoints}
            editPoint={editPoint}
            point={point}
            points={points}
            selectedSource={selectedSource}
            editor={editor}
          />
        );
      })}
    </div>
  );
}
