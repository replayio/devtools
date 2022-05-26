import { formatDuration, formatTimestamp } from "./time";

describe("time utilities", () => {
  describe("formatDuration", () => {
    it("should format time (in ms) as duration", () => {
      // Formatted as milliseconds
      expect(formatDuration(0)).toMatchInlineSnapshot(`"0ms"`);
      expect(formatDuration(1)).toMatchInlineSnapshot(`"1.0ms"`);
      expect(formatDuration(500)).toMatchInlineSnapshot(`"500.0ms"`);
      expect(formatDuration(999)).toMatchInlineSnapshot(`"999.0ms"`);

      // Formatted as seconds
      expect(formatDuration(1_000)).toMatchInlineSnapshot(`"1s"`);
      expect(formatDuration(1_001)).toMatchInlineSnapshot(`"1s"`);
      expect(formatDuration(1_500)).toMatchInlineSnapshot(`"1.5s"`);
      expect(formatDuration(30_000)).toMatchInlineSnapshot(`"30s"`);
      expect(formatDuration(59_499)).toMatchInlineSnapshot(`"59.4s"`);
      expect(formatDuration(59_999)).toMatchInlineSnapshot(`"59.9s"`);

      // Formatted as minutes
      expect(formatDuration(60_000)).toMatchInlineSnapshot(`"1m"`);
      expect(formatDuration(60_001)).toMatchInlineSnapshot(`"1m"`);
      expect(formatDuration(90_000)).toMatchInlineSnapshot(`"1m 30s"`);
    });
  });

  describe("formatTimestamp", () => {
    it("should format time (in ms) as a timestamp", () => {
      expect(formatTimestamp(0)).toMatchInlineSnapshot(`"0:00"`);
      expect(formatTimestamp(1)).toMatchInlineSnapshot(`"0:00"`);
      expect(formatTimestamp(500)).toMatchInlineSnapshot(`"0:01"`);
      expect(formatTimestamp(999)).toMatchInlineSnapshot(`"0:01"`);
      expect(formatTimestamp(1_000)).toMatchInlineSnapshot(`"0:01"`);
      expect(formatTimestamp(1_001)).toMatchInlineSnapshot(`"0:01"`);
      expect(formatTimestamp(1_500)).toMatchInlineSnapshot(`"0:02"`);
      expect(formatTimestamp(30_000)).toMatchInlineSnapshot(`"0:30"`);
      expect(formatTimestamp(59_499)).toMatchInlineSnapshot(`"0:59"`);
      expect(formatTimestamp(59_999)).toMatchInlineSnapshot(`"1:00"`);
      expect(formatTimestamp(60_000)).toMatchInlineSnapshot(`"1:00"`);
      expect(formatTimestamp(60_001)).toMatchInlineSnapshot(`"1:00"`);
      expect(formatTimestamp(90_000)).toMatchInlineSnapshot(`"1:30"`);
    });
  });
});
