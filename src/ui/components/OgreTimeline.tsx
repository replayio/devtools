import { TimeStampedPointRange } from "@recordreplay/protocol";
import { useSelector } from "react-redux";
import { useFeature } from "ui/hooks/settings";
import { getLoadedRegions } from "ui/reducers/app";
import { getZoomRegion } from "ui/reducers/timeline";

const Span = ({
  regions,
  endTime,
  className,
}: {
  regions: TimeStampedPointRange;
  endTime: number;
  className: string;
}) => {
  const { begin, end } = regions;
  const style = {
    left: `${(begin.time / endTime) * 100}%`,
    width: `${((end.time - begin.time) / endTime) * 100}%`,
  };

  return <div className={`absolute h-full ${className}`} style={style} />;
};

const Spans = ({ regions, color }: { regions: TimeStampedPointRange[]; color: string }) => {
  const { endTime } = useSelector(getZoomRegion)!;

  return (
    <div className="w-full h-1 z-50 relative">
      {regions.map((r, i) => (
        <Span regions={r} endTime={endTime} className={`bg-${color}-500`} key={i} />
      ))}
    </div>
  );
};

export default function OgreTimeline() {
  const loadedRegions = useSelector(getLoadedRegions)!;
  const { value: showAdvancedTimeline } = useFeature("advancedTimeline");

  if (!showAdvancedTimeline) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-1 absolute -top-3 w-full">
      <Spans regions={loadedRegions.loading} color="gray" />
      <Spans regions={loadedRegions.loaded} color="orange" />
      <Spans regions={loadedRegions.indexed} color="green" />
    </div>
  );
}
