import { skipToken } from "@reduxjs/toolkit/dist/query";

import { useGetPauseQuery } from "../../app/api";
import { useAppSelector } from "../../app/hooks";

export const SelectedPointStackFrames = () => {
  const selectedPoint = useAppSelector(state => state.selectedSources.selectedPoint);

  const { currentData: pause } = useGetPauseQuery(selectedPoint ? selectedPoint : skipToken);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Current Pause Frames</h3>
      <ul>
        {pause?.data.frames?.map(frame => {
          return <li key={frame.frameId}>{frame.functionName}</li>;
        })}
      </ul>
    </div>
  );
};
