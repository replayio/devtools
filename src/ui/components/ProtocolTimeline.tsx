import {
  loadedRegions as LoadedRegions,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import clamp from "lodash/clamp";
import React, { useEffect, useRef } from "react";

import { gPaintPoints, hasAllPaintPoints } from "protocol/graphics";
import useLoadedRegions from "replay-next/src/hooks/useLoadedRegions";
import { getZoomRegion } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

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
  points,
}: {
  regions: TimeStampedPointRange[];
  color: string;
  title: string;
  points?: TimeStampedPoint[];
}) => {
  const { endTime } = useAppSelector(getZoomRegion)!;

  return (
    <div className="relative z-10 h-1 w-full" title={title}>
      {regions.map((r, i) => (
        <Span regions={r} endTime={endTime} className={`bg-${color}`} key={i} />
      ))}
      {points?.map(p => (
        <div
          key={p.point}
          style={{
            position: "absolute",
            top: -2,
            left: `${(100.0 * p.time) / endTime}%`,
          }}
        >
          <svg
            className={`fill-${color} stroke-${color}`}
            width="9"
            height="9"
            viewBox="0 0 9 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="4.5" cy="4.5" r="4.5" />
          </svg>
        </div>
      ))}
    </div>
  );
};

const EMPTY_LOADED_REGIONS: LoadedRegions = {
  indexed: [],
  loaded: [],
  loading: [],
};

export default function ProtocolTimeline() {
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* this is to change the padding when protocol timeline is present */
    const timeline = timelineRef.current;
    if (!timeline) {
      return;
    }
    console.log(timeline);

    const protocolTimeline = document.querySelector(".protocolTimeline");

    console.log(protocolTimeline);

    if (protocolTimeline) {
      timeline.classList.add("specialBorder");
    }
  }, []);
  const loadedRegions = useLoadedRegions() ?? EMPTY_LOADED_REGIONS;

  const firstPaint = gPaintPoints[0];
  const lastPaint = gPaintPoints[gPaintPoints.length - 1];

  return (
    <div ref={timelineRef} className="protocolTimeline flex w-full flex-col space-y-1">
      {/* This is pretty silly, but these are the classnames that get generated
      dynamically by this component. And if they are not statically in the
      build, then tailwind will not include the rules for them, which makes them
      not work.  */}
      <div className="hidden bg-gray-500 bg-orange-500 bg-green-500 bg-sky-500 fill-sky-500 stroke-sky-500"></div>
      <Spans regions={loadedRegions.loading} color="gray-500" title="Loading" />
      <Spans regions={loadedRegions.loaded} color="orange-500" title="Loaded" />
      <Spans regions={loadedRegions.indexed} color="green-500" title="Indexed" />
      <Spans
        regions={[
          {
            begin: { point: firstPaint.point, time: firstPaint.time },
            end: { point: lastPaint.point, time: hasAllPaintPoints ? Infinity : lastPaint.time },
          },
        ]}
        color="sky-500"
        points={gPaintPoints}
        title="Paints"
      />
    </div>
  );
}
