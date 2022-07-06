import { skipToken } from "@reduxjs/toolkit/dist/query";

import { useGetPauseQuery } from "../../app/api";
import { useAppSelector, useAppStore } from "../../app/hooks";
import {
  selectSourceDetailsEntities,
  selectCanonicalSourceName,
  selectSourceDetails,
} from "./sourcesSlice";

export const SelectedPointStackFrames = () => {
  const selectedPoint = useAppSelector(state => state.selectedSources.selectedPoint);
  const detailsEntities = useAppSelector(selectSourceDetailsEntities);

  const { currentData: pause } = useGetPauseQuery(selectedPoint ? selectedPoint : skipToken);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Current Pause Frames</h3>
      <ul>
        {pause?.data.frames?.map(frame => {
          const sourceUrl = selectCanonicalSourceName(detailsEntities, frame.location[0].sourceId);

          let finalFileURL = "No URL";

          if (sourceUrl) {
            finalFileURL = new URL(sourceUrl).pathname;
          }
          return (
            <li key={frame.frameId}>
              {frame.functionName}
              <br />
              {finalFileURL}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
