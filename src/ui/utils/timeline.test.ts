import { FocusWindow, ZoomRegion } from "ui/state/timeline";

import {
  filterToFocusWindow,
  getSecondsFromFormattedTime,
  getTimeFromPosition,
  isFocusWindowSubset,
  isValidTimeString,
  mergeSortedPointLists,
  overlap,
} from "./timeline";

const point = (time: number) => ({ time, point: `${time}` });
const focusWindow = (from: number, to: number): FocusWindow => ({
  begin: point(from),
  end: point(to),
});

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

describe("isFocusWindowSubset", () => {
  it("should always be true when previous focus region was null", () => {
    expect(isFocusWindowSubset(null, null)).toBe(true);
    expect(isFocusWindowSubset(null, focusWindow(0, 0))).toBe(true);
    expect(isFocusWindowSubset(null, focusWindow(0, 1000))).toBe(true);
    expect(isFocusWindowSubset(null, focusWindow(1000, 1000))).toBe(true);
  });

  it("should never be true when new focus region was null (unless previous one was also)", () => {
    expect(isFocusWindowSubset(focusWindow(0, 0), null)).toBe(false);
    expect(isFocusWindowSubset(focusWindow(0, 1000), null)).toBe(false);
    expect(isFocusWindowSubset(focusWindow(1000, 1000), null)).toBe(false);
  });

  it("should correctly differentiate between overlapping and non-overlapping focus regions", () => {
    expect(isFocusWindowSubset(focusWindow(0, 0), focusWindow(0, 0))).toBe(true);
    expect(isFocusWindowSubset(focusWindow(100, 200), focusWindow(0, 50))).toBe(false);
    expect(isFocusWindowSubset(focusWindow(100, 200), focusWindow(50, 150))).toBe(false);
    expect(isFocusWindowSubset(focusWindow(100, 200), focusWindow(100, 200))).toBe(true);
    expect(isFocusWindowSubset(focusWindow(100, 200), focusWindow(125, 175))).toBe(true);
    expect(isFocusWindowSubset(focusWindow(100, 200), focusWindow(150, 250))).toBe(false);
    expect(isFocusWindowSubset(focusWindow(100, 200), focusWindow(200, 300))).toBe(false);
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

describe("overlap", () => {
  const point = (time: number) => {
    return { point: "", time };
  };

  const range = (begin: number, end: number) => {
    return {
      begin: point(begin),
      end: point(end),
    };
  };

  it("correctly merges overlapping regions when the second begins during the first", () => {
    expect(overlap([range(0, 5)], [range(2, 7)])).toStrictEqual([range(2, 5)]);
  });

  it("correctly merges overlapping regions when the first begins during the second", () => {
    expect(overlap([range(2, 7)], [range(0, 5)])).toStrictEqual([range(2, 5)]);
  });

  it("leaves non-overlapping regions alone", () => {
    expect(overlap([range(0, 2)], [range(3, 5)])).toStrictEqual([]);
  });

  it("does not blow up with empty inputs", () => {
    expect(overlap([range(0, 2)], [])).toStrictEqual([]);
    expect(overlap([], [range(0, 2)])).toStrictEqual([]);
  });
});

describe("filterToFocusWindow", () => {
  it("will not include points before the region", () => {
    expect(filterToFocusWindow([point(5)], focusWindow(10, 20))).toEqual([[], 1, 0]);
  });
  it("will not include points after the region", () => {
    expect(filterToFocusWindow([point(25)], focusWindow(10, 20))).toEqual([[], 0, 1]);
  });
  it("will include points inside the region", () => {
    expect(filterToFocusWindow([point(5), point(15), point(25)], focusWindow(10, 20))).toEqual([
      [point(15)],
      1,
      1,
    ]);
  });
  it("will include points on the boundaries the region", () => {
    expect(filterToFocusWindow([point(10), point(15), point(20)], focusWindow(10, 20))).toEqual([
      [point(10), point(15), point(20)],
      0,
      0,
    ]);
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
