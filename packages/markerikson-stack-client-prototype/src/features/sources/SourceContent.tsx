import { useMemo, useState } from "react";
import type { Location } from "@replayio/protocol";
import { skipToken } from "@reduxjs/toolkit/dist/query";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { countColumn } from "@codemirror/state";

import { useGetSourceTextQuery, useGetSourceHitCountsQuery } from "../../app/api";
import { useAppSelector } from "../../app/hooks";

export const SourceContent = () => {
  const [selectedLocation, setSelectedLocation] = useState<Pick<
    Location,
    "line" | "column"
  > | null>(null);
  const selectedSourceId = useAppSelector(state => state.sources.selectedSourceId);

  const { data: sourceText } = useGetSourceTextQuery(selectedSourceId ?? skipToken);
  const { data: sourceHits } = useGetSourceHitCountsQuery(selectedSourceId ?? skipToken);

  const domHandler = useMemo(() => {
    return EditorView.domEventHandlers({
      click(e, editorView) {
        const pos = editorView.posAtCoords({ x: e.clientX, y: e.clientY });
        const line = editorView.state.doc.lineAt(pos);
        const selectionRange = editorView.state.selection.ranges[0];
        const columnNumber = selectionRange.head - line.from;
        setSelectedLocation({ line: line.number, column: columnNumber });

        return false;
      },
    });
  }, []);

  if (!selectedSourceId) {
    return null;
  }

  return (
    <div>
      <div>Selected location: {JSON.stringify(selectedLocation)}</div>
      <CodeMirror
        value={sourceText}
        editable={false}
        style={{ maxHeight: 600, overflowY: "auto", minWidth: 800, maxWidth: 1000 }}
        extensions={[domHandler, javascript({ jsx: true })]}
      />
    </div>
  );
};
