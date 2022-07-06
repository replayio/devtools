import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { skipToken } from "@reduxjs/toolkit/dist/query";
import CodeMirror from "@uiw/react-codemirror";
import { useContext, useMemo, useState } from "react";

import { useGetSourceTextQuery } from "../../app/api";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import { locationSelected } from "./selectedSourcesSlice";

import { SelectedLocationHits } from "./SelectedLocationHits";
import { SelectedPointStackFrames } from "./SelectedPointStackFrames";

export const SourceContent = () => {
  const dispatch = useAppDispatch();
  const selectedSourceId = useAppSelector(state => state.selectedSources.selectedSourceId);

  const { currentData: sourceText } = useGetSourceTextQuery(
    selectedSourceId ? selectedSourceId : skipToken
  );

  const domHandler = useMemo(() => {
    return EditorView.domEventHandlers({
      click(e, editorView) {
        const pos = editorView.posAtCoords({ x: e.clientX, y: e.clientY });
        const line = editorView.state.doc.lineAt(pos!);
        const selectionRange = editorView.state.selection.ranges[0];
        const columnNumber = selectionRange.head - line.from;
        dispatch(locationSelected({ line: line.number, column: columnNumber }));

        return false;
      },
    });
  }, [dispatch]);

  if (!selectedSourceId) {
    return null;
  }

  return (
    <div>
      <div style={{ display: "flex" }}>
        <CodeMirror
          value={sourceText}
          editable={false}
          style={{ maxHeight: 600, overflowY: "auto", minWidth: 600, maxWidth: 600 }}
          extensions={[domHandler, javascript({ jsx: true })]}
        />
        <div style={{ marginLeft: 10 }}>
          <SelectedLocationHits />
        </div>

        <div style={{ marginLeft: 10 }}>
          <SelectedPointStackFrames />
        </div>
      </div>
    </div>
  );
};
