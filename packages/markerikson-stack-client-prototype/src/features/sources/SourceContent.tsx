import { useMemo, useState } from "react";
import type { HitCount, Location, PointDescription } from "@replayio/protocol";
import { skipToken } from "@reduxjs/toolkit/dist/query";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { countColumn } from "@codemirror/state";

import {
  useGetSourceTextQuery,
  useGetSourceHitCountsQuery,
  useGetLineHitPointsQuery,
} from "../../app/api";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { pointSelected } from "./sourcesSlice";

export const SourceContent = () => {
  const [selectedLocation, setSelectedLocation] = useState<Pick<
    Location,
    "line" | "column"
  > | null>(null);
  const dispatch = useAppDispatch();
  const selectedSourceId = useAppSelector(state => state.sources.selectedSourceId);
  const selectedPoint = useAppSelector(state => state.sources.selectedPoint);

  const { currentData: sourceText } = useGetSourceTextQuery(selectedSourceId ?? skipToken);
  const { currentData: sourceHits } = useGetSourceHitCountsQuery(selectedSourceId ?? skipToken);

  let closestHitPoint: HitCount | null = null;
  if (sourceHits && selectedLocation) {
    const lineHits = sourceHits[selectedLocation.line];
    closestHitPoint = lineHits?.reduceRight((prevValue, hit) => {
      if (hit.location.column < selectedLocation.column) {
        return hit;
      }
      return prevValue;
    }, null);
  }

  const { currentData: locationHitPoints } = useGetLineHitPointsQuery(
    closestHitPoint?.location ?? skipToken
  );

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
      <div style={{ display: "flex" }}>
        <CodeMirror
          value={sourceText}
          editable={false}
          style={{ maxHeight: 600, overflowY: "auto", minWidth: 600, maxWidth: 600 }}
          extensions={[domHandler, javascript({ jsx: true })]}
        />
        <div style={{ marginLeft: 10 }}>
          <h3 style={{ marginTop: 0 }}>Selection Details</h3>
          <div>Selected location: {JSON.stringify(selectedLocation)}</div>
          <div>Closest point: {JSON.stringify(selectedLocation)}</div>
          <h4>Location Hits</h4>
          <ul>
            {locationHitPoints?.map(point => {
              const isSelected = point === selectedPoint;
              let entryText: React.ReactNode = point.time;
              if (isSelected) {
                entryText = <span style={{ fontWeight: "bold" }}>{entryText}</span>;
              }

              const onPointClicked = () => dispatch(pointSelected(point));
              return (
                <li key={point.point} onClick={onPointClicked}>
                  {entryText}
                </li>
              );
            }) ?? null}
          </ul>
        </div>
      </div>
    </div>
  );
};
