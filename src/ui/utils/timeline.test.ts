import { ZoomRegion } from "ui/state/timeline";

import {
  getSecondsFromFormattedTime,
  getTimeFromPosition,
  isValidTimeString,
  mergeSortedPointLists,
} from "./timeline";

const point = (time: number) => ({ time, point: `${time}` });

describe("getSecondsFromFormattedTime", () => {
  it("should parse standalone seconds", () => {
    expect(getSecondsFromFormattedTime("0")).toBe(0);
    expect(getSecondsFromFormattedTime("1")).toBe(1_000);
    expect(getSecondsFromFormattedTime("60")).toBe(60_000);
    expect(getSecondsFromFormattedTime("61")).toBe(61_000);
  });

  it("should parse seconds and milliseconds", () => {
    expect(getSecondsFromFormattedTime("0.0")).toBe(0);
    expect(getSecondsFromFormattedTime("0.00")).toBe(0);
    expect(getSecondsFromFormattedTime("0.000")).toBe(0);
    expect(getSecondsFromFormattedTime("0.123")).toBe(123);
    expect(getSecondsFromFormattedTime("1.1")).toBe(1_100);
    expect(getSecondsFromFormattedTime("1.10")).toBe(1_100);
    expect(getSecondsFromFormattedTime("1.100")).toBe(1_100);
    expect(getSecondsFromFormattedTime("61.02")).toBe(61_020);
  });

  it("should parse minutes and seconds", () => {
    expect(getSecondsFromFormattedTime("0:00")).toBe(0);
    expect(getSecondsFromFormattedTime("0:01")).toBe(1_000);
    expect(getSecondsFromFormattedTime("0:10")).toBe(10_000);
    expect(getSecondsFromFormattedTime("1:00")).toBe(60_000);
    expect(getSecondsFromFormattedTime("1:01")).toBe(61_000);
    expect(getSecondsFromFormattedTime("1:11")).toBe(71_000);
  });

  it("should parse minutes, seconds, and milliseconds", () => {
    expect(getSecondsFromFormattedTime("0:00.0")).toBe(0);
    expect(getSecondsFromFormattedTime("0:00.00")).toBe(0);
    expect(getSecondsFromFormattedTime("0:00.000")).toBe(0);
    expect(getSecondsFromFormattedTime("0:01.0")).toBe(1_000);
    expect(getSecondsFromFormattedTime("0:10.50")).toBe(10_500);
    expect(getSecondsFromFormattedTime("1:00.050")).toBe(60_050);
    expect(getSecondsFromFormattedTime("1:01.009")).toBe(61_009);
  });

  it("should ignore leading and trailing spaces", () => {
    // Weird formatting to prevent linter from "fixing" the strings
    expect(getSecondsFromFormattedTime(" " + "61" + " ")).toBe(61_000);
    expect(getSecondsFromFormattedTime(" " + "61.02" + " ")).toBe(61_020);
    expect(getSecondsFromFormattedTime(" " + "1:11" + " ")).toBe(71_000);
    expect(getSecondsFromFormattedTime(" " + "1:01.009" + " ")).toBe(61_009);
  });

  it("should throw on invalidate format", () => {
    expect(() => getSecondsFromFormattedTime("a_61-b")).toThrow('Invalid format "a_61-b"');
    expect(() => getSecondsFromFormattedTime("a#61.02-b")).toThrow('Invalid format "a#61.02-b"');
    expect(() => getSecondsFromFormattedTime("/!1:11-b")).toThrow('Invalid format "/!1:11-b"');
    expect(() => getSecondsFromFormattedTime("?1:01.009-C")).toThrow(
      'Invalid format "?1:01.009-C"'
    );
  });
});

describe("getTimeFromPosition", () => {
  const RECT = {
    left: 50,
    width: 100,
  };

  const ZOOM_REGION: ZoomRegion = {
    beginTime: 0,
    endTime: 1000,
    scale: 1,
  };

  it("should calculate the right relative time", () => {
    expect(getTimeFromPosition(50, RECT, ZOOM_REGION)).toBe(0);
    expect(getTimeFromPosition(75, RECT, ZOOM_REGION)).toBe(250);
    expect(getTimeFromPosition(100, RECT, ZOOM_REGION)).toBe(500);
    expect(getTimeFromPosition(125, RECT, ZOOM_REGION)).toBe(750);
    expect(getTimeFromPosition(150, RECT, ZOOM_REGION)).toBe(1000);
  });

  it("should properly clamp times", () => {
    expect(getTimeFromPosition(0, RECT, ZOOM_REGION)).toBe(0);
    expect(getTimeFromPosition(25, RECT, ZOOM_REGION)).toBe(0);
    expect(getTimeFromPosition(175, RECT, ZOOM_REGION)).toBe(1000);
    expect(getTimeFromPosition(200, RECT, ZOOM_REGION)).toBe(1000);
  });
});

describe("isValidTimeString", () => {
  it("should recognized valid time strings", () => {
    expect(isValidTimeString("0")).toBe(true);
    expect(isValidTimeString("0:00")).toBe(true);
    expect(isValidTimeString("0:00.0")).toBe(true);
    expect(isValidTimeString("1")).toBe(true);
    expect(isValidTimeString("1:23")).toBe(true);
    expect(isValidTimeString("1:23.4")).toBe(true);
    expect(isValidTimeString("12:34.5")).toBe(true);
    expect(isValidTimeString("12:34.56")).toBe(true);
    expect(isValidTimeString("12:34.57")).toBe(true);
    expect(isValidTimeString("1.2")).toBe(true);
    expect(isValidTimeString("1.23")).toBe(true);
    expect(isValidTimeString("1.234")).toBe(true);
  });

  it("should recognized invalid time strings", () => {
    expect(isValidTimeString("0:0:0")).toBe(false);
    expect(isValidTimeString("0.0.0")).toBe(false);
    expect(isValidTimeString("0:0.0:0")).toBe(false);
    expect(isValidTimeString("a")).toBe(false);
    expect(isValidTimeString("a.a")).toBe(false);
    expect(isValidTimeString("1.a")).toBe(false);
    expect(isValidTimeString("a.1")).toBe(false);
    expect(isValidTimeString("a:1")).toBe(false);
    expect(isValidTimeString("a:b")).toBe(false);
    expect(isValidTimeString("1:b")).toBe(false);
  });
});

describe("mergeSortedPointLists", () => {
  it("will correctly interleave overlapping ranges", () => {
    expect(mergeSortedPointLists([point(5), point(10)], [point(7), point(12)])).toEqual([
      point(5),
      point(7),
      point(10),
      point(12),
    ]);
  });

  it("will correctly concat non-overlapping ranges", () => {
    expect(mergeSortedPointLists([point(5), point(7)], [point(10), point(12)])).toEqual([
      point(5),
      point(7),
      point(10),
      point(12),
    ]);
  });

  it("will raise an error if things are not sorted", () => {
    // We expect errors to be logged; don't clutter the console
    console.error = jest.fn();

    expect(() =>
      mergeSortedPointLists([point(7), point(5)], [point(10), point(12)])
    ).toThrowError();
    expect(() =>
      mergeSortedPointLists([point(5), point(7)], [point(12), point(10)])
    ).toThrowError();
  });
});
