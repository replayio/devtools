import { TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";

import { formatDuration, formatTimestamp } from "./time";

describe("Time util", () => {
  function toTSP(time: number): TimeStampedPoint {
    return { time, point: `${time * 1000}` };
  }

  describe("formatDuration", () => {
    it("should format values", () => {
      expect(formatDuration(0)).toEqual("0ms");
      expect(formatDuration(1)).toEqual("1.0ms");
      expect(formatDuration(500)).toEqual("500.0ms");
      expect(formatDuration(1_000)).toEqual("1s");
      expect(formatDuration(30_000)).toEqual("30s");
      expect(formatDuration(60_000)).toEqual("1m");
      expect(formatDuration(60_001)).toEqual("1m");
      expect(formatDuration(101_000)).toEqual("1m 41s");
      expect(formatDuration(101_500)).toEqual("1m 41.5s");
      expect(formatDuration(1000 * 30 * 60)).toEqual("30m");
      expect(formatDuration(1000 * 60 * 60)).toEqual("1h");
    });
  });

  describe("formatTimestamp", () => {
    it("should render low precision format", () => {
      expect(formatTimestamp(0)).toEqual("0:00");
      expect(formatTimestamp(1)).toEqual("0:00");
      expect(formatTimestamp(500)).toEqual("0:01");
      expect(formatTimestamp(1_000)).toEqual("0:01");
      expect(formatTimestamp(30_000)).toEqual("0:30");
      expect(formatTimestamp(60_000)).toEqual("1:00");
      expect(formatTimestamp(90_000)).toEqual("1:30");
    });

    it("should render low precision format", () => {
      expect(formatTimestamp(0, true)).toEqual("0:00.000");
      expect(formatTimestamp(1, true)).toEqual("0:00.001");
      expect(formatTimestamp(500, true)).toEqual("0:00.500");
      expect(formatTimestamp(1_000, true)).toEqual("0:01.000");
      expect(formatTimestamp(30_100, true)).toEqual("0:30.100");
      expect(formatTimestamp(60_010, true)).toEqual("1:00.010");
      expect(formatTimestamp(90_001, true)).toEqual("1:30.001");
    });

    it("should round fractional values", () => {
      expect(formatTimestamp(1.3, true)).toEqual("0:00.001");
      expect(formatTimestamp(1.7, true)).toEqual("0:00.002");
    });
  });
});
