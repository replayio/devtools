import {
  getFormattedTime,
  getSecondsFromFormattedTime,
  isValidTimeString,
  overlap,
} from "./timeline";

describe("getFormattedTime", () => {
  it("should properly format time with milliseconds", () => {
    expect(getFormattedTime(0, true)).toBe("0:00.000");
    expect(getFormattedTime(1_000, true)).toBe("0:01.000");
    expect(getFormattedTime(1_234, true)).toBe("0:01.234");
    expect(getFormattedTime(30_000, true)).toBe("0:30.000");
    expect(getFormattedTime(60_000, true)).toBe("1:00.000");
    expect(getFormattedTime(60_001, true)).toBe("1:00.001");
    expect(getFormattedTime(61_000, true)).toBe("1:01.000");
    expect(getFormattedTime(12_345, true)).toBe("0:12.345");
    expect(getFormattedTime(120_500, true)).toBe("2:00.500");
  });

  it("should properly format time without milliseconds", () => {
    expect(getFormattedTime(0, false)).toBe("0:00");
    expect(getFormattedTime(1_000, false)).toBe("0:01");
    expect(getFormattedTime(1_499, false)).toBe("0:01");
    expect(getFormattedTime(1_500, false)).toBe("0:02");
    expect(getFormattedTime(58_900, false)).toBe("0:59");
    expect(getFormattedTime(59_900, false)).toBe("1:00");
    expect(getFormattedTime(60_000, false)).toBe("1:00");
    expect(getFormattedTime(120_500, false)).toBe("2:01");
  });
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
