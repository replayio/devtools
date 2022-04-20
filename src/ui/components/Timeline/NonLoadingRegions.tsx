import { useSelector } from "react-redux";
import { getNonLoadingTimeRanges } from "ui/reducers/app";
import { getZoomRegion } from "ui/reducers/timeline";
import { TimeRange } from "ui/utils/app";

const NonLoadingRegion = ({ range }: { range: TimeRange }) => {
  const { endTime } = useSelector(getZoomRegion)!;
  const { start, end } = range;
  const style = {
    left: `${(start / endTime) * 100}%`,
    width: `${((end - start) / endTime) * 100}%`,
  };

  return (
    <div className="unfocused-regions-container start" style={style}>
      <div className="unfocused-regions" />
    </div>
  );
};

export default function NonLoadingRegions() {
  const timeRanges = useSelector(getNonLoadingTimeRanges);

  return (
    <>
      {timeRanges.map((r, i) => (
        <NonLoadingRegion key={i} range={r} />
      ))}
    </>
  );
}
