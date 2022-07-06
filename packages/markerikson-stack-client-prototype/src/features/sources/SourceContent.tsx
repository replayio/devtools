import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import type { HitCount, Location } from "@replayio/protocol";
import { skipToken } from "@reduxjs/toolkit/dist/query";
import CodeMirror from "@uiw/react-codemirror";
import { useContext, useMemo, useState } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import {
  useGetSourceTextQuery,
  useGetSourceHitCountsQuery,
  useGetLineHitPointsQuery,
  useGetPauseQuery,
} from "../../app/api";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import { pointSelected, locationSelected } from "./selectedSourcesSlice";

import { SelectedLocationHits } from "./SelectedLocationHits";

export const SourceContent = () => {
  const dispatch = useAppDispatch();
  const selectedSourceId = useAppSelector(state => state.selectedSources.selectedSourceId);
  const selectedPoint = useAppSelector(state => state.selectedSources.selectedPoint);

  const { currentData: sourceText } = useGetSourceTextQuery(
    selectedSourceId ? selectedSourceId : skipToken
  );
  const { currentData: sourceHits } = useGetSourceHitCountsQuery(
    selectedSourceId ? selectedSourceId : skipToken
  );

  const { currentData: pause } = useGetPauseQuery(selectedPoint ? selectedPoint : skipToken);

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
          <h3 style={{ marginTop: 0 }}>Current Pause Frames</h3>
          <ul>
            {pause?.data.frames?.map(frame => {
              return (
                <li key={frame.frameId}>
                  {frame.functionName} / {JSON.stringify(frame.functionLocation)}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
