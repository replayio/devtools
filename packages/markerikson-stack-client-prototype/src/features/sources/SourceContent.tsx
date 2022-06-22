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

import { pointSelected } from "./sourcesSlice";

export const SourceContent = () => {
  const [selectedLocation, setSelectedLocation] = useState<Pick<
    Location,
    "line" | "column"
  > | null>(null);
  const dispatch = useAppDispatch();
  const selectedSourceId = useAppSelector(state => state.sources.selectedSourceId);
  const selectedPoint = useAppSelector(state => state.sources.selectedPoint);

  const replayClient = useContext(ReplayClientContext)!;
  const sessionId = replayClient.getSessionId()!;

  const { currentData: sourceText } = useGetSourceTextQuery(
    selectedSourceId ? { sessionId, sourceId: selectedSourceId } : skipToken
  );
  const { currentData: sourceHits } = useGetSourceHitCountsQuery(
    selectedSourceId ? { sessionId, sourceId: selectedSourceId } : skipToken
  );

  let closestHitPoint: HitCount | null = null;
  if (sourceHits && selectedLocation) {
    const lineHits = sourceHits[selectedLocation.line];
    closestHitPoint = lineHits?.reduceRight((prevValue, hit) => {
      if (hit.location.column < selectedLocation.column) {
        return hit;
      }
      return prevValue;
    }, null as HitCount | null);
  }

  const location = closestHitPoint?.location;
  const { currentData: locationHitPoints } = useGetLineHitPointsQuery(
    location ? { location, sessionId } : skipToken
  );

  const { currentData: pause } = useGetPauseQuery(
    selectedPoint
      ? {
          point: selectedPoint,
          sessionId,
        }
      : skipToken
  );

  const domHandler = useMemo(() => {
    return EditorView.domEventHandlers({
      click(e, editorView) {
        const pos = editorView.posAtCoords({ x: e.clientX, y: e.clientY });
        const line = editorView.state.doc.lineAt(pos!);
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
