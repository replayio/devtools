import { ExecutionPoint, TimeStampedPointRange } from "@replayio/protocol";

export function isPointInRegions(point: ExecutionPoint, regions: TimeStampedPointRange[]) {
  const pointNumber = BigInt(point);
  return regions.find(
    ({ begin, end }) => pointNumber >= BigInt(begin.point) && pointNumber <= BigInt(end.point)
  );
}

export function isTimeInRegions(time: number, regions: TimeStampedPointRange[]) {
  return regions.find(({ begin, end }) => time >= begin.time && time <= end.time);
}
