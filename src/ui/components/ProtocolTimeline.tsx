import { TimeStampedPointRange } from "@recordreplay/protocol";
import clamp from "lodash/clamp";
import { gPaintPoints, hasAllPaintPoints } from "protocol/graphics";
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
    width: `${clamp(((end.time - begin.time) / endTime) * 100, 0, 100)}%`,
  };

  return <div className={`absolute h-full ${className}`} style={style} />;
};

const Spans = ({
  regions,
  color,
  title,
}: {
  regions: TimeStampedPointRange[];
  color: string;
  title: string;
}) => {
  const { endTime } = useSelector(getZoomRegion)!;

  return (
    <div className="relative z-10 h-1 w-full" title={title}>
      {regions.map((r, i) => (
        <Span regions={r} endTime={endTime} className={color} key={i} />
      ))}
    </div>
  );
};

export default function ProtocolTimeline() {
  const loadedRegions = useSelector(getLoadedRegions);
  const { value: showProtocolTimeline } = useFeature("protocolTimeline");
  const firstPaint = gPaintPoints[0];
  const lastPaint = gPaintPoints[gPaintPoints.length - 1];

  if (!showProtocolTimeline || !loadedRegions) {
    return null;
  }

  return (
    <div className="absolute -top-4 flex w-full flex-col space-y-1">
      <Spans regions={loadedRegions.loading} color="bg-gray-500" title="Loading" />
      <Spans regions={loadedRegions.loaded} color="bg-orange-500" title="Loaded" />
      <Spans regions={loadedRegions.indexed} color="bg-green-500" title="Indexed" />
      <Spans
        regions={
          hasAllPaintPoints
            ? [
                {
                  begin: { point: firstPaint.point, time: firstPaint.time },
                  end: { point: lastPaint.point, time: Infinity },
                },
              ]
            : [
                {
                  begin: { point: firstPaint.point, time: firstPaint.time },
                  end: { point: lastPaint.point, time: lastPaint.time },
                },
              ]
        }
        color="bg-sky-500"
        title="Paints"
      />
    </div>
  );
}
