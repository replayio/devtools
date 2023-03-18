import { skipToken } from "@reduxjs/toolkit/dist/query";
import type { HitCount } from "@replayio/protocol";

import { useGetLineHitPointsQuery, useGetSourceHitCountsQuery } from "../../app/api";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { pointSelected } from "./selectedSourcesSlice";

export const SelectedLocationHits = () => {
  const dispatch = useAppDispatch();

  const selectedSourceId = useAppSelector(state => state.selectedSources.selectedSourceId);
  const selectedLocation = useAppSelector(state => state.selectedSources.selectedLocation);
  const selectedPoint = useAppSelector(state => state.selectedSources.selectedPoint);

  const { currentData: sourceHits } = useGetSourceHitCountsQuery(
    selectedSourceId ? selectedSourceId : skipToken
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
    location ? location : skipToken
  );

  return (
    <div>
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
  );
};
