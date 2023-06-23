import { useNonLoadingTimeRanges } from "ui/components/Timeline/useNonLoadingTimeRanges";
import { getZoomRegion } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

export default function NonLoadingRegions() {
  const { endTime } = useAppSelector(getZoomRegion);
  const nonLoadingTimeRanges = useNonLoadingTimeRanges();

  return (
    <>
      {nonLoadingTimeRanges.map((timeRange, index) => (
        <div
          className="unfocused-regions-container start"
          key={index}
          style={{
            left: `${(timeRange.start / endTime) * 100}%`,
            width: `${((timeRange.end - timeRange.start) / endTime) * 100}%`,
          }}
        >
          <div className="unfocused-regions" />
        </div>
      ))}
    </>
  );
}
