import { LoadedRegions } from "ui/state/app";

export * from "./why";

export function isInLoadedRegion(regions: LoadedRegions, executionPoint: string) {
  return (
    regions !== null &&
    regions.loaded.some(
      ({ begin, end }) =>
        BigInt(executionPoint) >= BigInt(begin.point) && BigInt(executionPoint) <= BigInt(end.point)
    )
  );
}
