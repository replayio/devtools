import { getNonLoadingRegionTimeRanges } from "./app";

const POINT_PLACEHOLDER = "POINT_PLACEHOLDER";
describe("getNonLoadingRegionTimesFromLoadingRegions", () => {
  it("should return the full range when there are no loading regions", () => {
    const timeRanges = getNonLoadingRegionTimeRanges([], 1000);
    expect(timeRanges.length).toEqual(1);
    expect(timeRanges[0].start).toEqual(0);
    expect(timeRanges[0].end).toEqual(1000);
  });
  it("should return no range when the loading regions are fully covered", () => {
    const timeRanges = getNonLoadingRegionTimeRanges(
      [
        {
          begin: { point: POINT_PLACEHOLDER, time: 0 },
          end: { point: POINT_PLACEHOLDER, time: 100 },
        },
      ],
      100
    );

    expect(timeRanges.length).toEqual(0);
  });
  it("should return the second half when the first half is loading", () => {
    const timeRanges = getNonLoadingRegionTimeRanges(
      [
        {
          begin: { point: POINT_PLACEHOLDER, time: 0 },
          end: { point: POINT_PLACEHOLDER, time: 100 },
        },
      ],
      200
    );

    expect(timeRanges.length).toEqual(1);
    expect(timeRanges[0].end).toEqual(200);
    expect(timeRanges[0].start).toEqual(100);
  });
  it("should return the second half when the first half is loading", () => {
    const timeRanges = getNonLoadingRegionTimeRanges(
      [
        {
          begin: { point: POINT_PLACEHOLDER, time: 100 },
          end: { point: POINT_PLACEHOLDER, time: 200 },
        },
      ],
      200
    );

    expect(timeRanges.length).toEqual(1);
    expect(timeRanges[0].end).toEqual(100);
    expect(timeRanges[0].start).toEqual(0);
  });
  it("should return the inverse of a single loading range", () => {
    const timeRanges = getNonLoadingRegionTimeRanges(
      [
        {
          begin: { point: POINT_PLACEHOLDER, time: 100 },
          end: { point: POINT_PLACEHOLDER, time: 200 },
        },
      ],
      300
    );

    expect(timeRanges.length).toEqual(2);
    expect(timeRanges[0].end).toEqual(100);
    expect(timeRanges[0].start).toEqual(0);
    expect(timeRanges[1].end).toEqual(300);
    expect(timeRanges[1].start).toEqual(200);
  });
  it("should return the inverse of multiple loading ranges", () => {
    const timeRanges = getNonLoadingRegionTimeRanges(
      [
        {
          begin: { point: POINT_PLACEHOLDER, time: 0 },
          end: { point: POINT_PLACEHOLDER, time: 100 },
        },
        {
          begin: { point: POINT_PLACEHOLDER, time: 200 },
          end: { point: POINT_PLACEHOLDER, time: 300 },
        },
      ],
      300
    );

    expect(timeRanges.length).toEqual(1);
    expect(timeRanges[0].end).toEqual(200);
    expect(timeRanges[0].start).toEqual(100);
  });
});
