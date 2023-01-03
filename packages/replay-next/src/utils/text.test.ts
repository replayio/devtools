import { truncate } from "bvaughn-architecture-demo/src/utils/text";

describe("text utils", () => {
  describe("truncate", () => {
    it("should not truncate strings shorter than the max length", () => {
      expect(truncate("12345", { maxLength: 10 })).toEqual("12345");
      expect(truncate("1234567890", { maxLength: 10 })).toEqual("1234567890");
    });

    it('should truncate strings at position: "start"', () => {
      expect(truncate("1234567890", { maxLength: 5, position: "start" })).toEqual("…7890");
      expect(truncate("1234567890", { maxLength: 6, position: "start" })).toEqual("…67890");

      // Should account for longer truncation markers
      expect(
        truncate("1234567890", { maxLength: 6, position: "start", truncationMarker: "..." })
      ).toEqual("...890");
    });

    it('should truncate strings at position: "end"', () => {
      expect(truncate("1234567890", { maxLength: 5, position: "end" })).toEqual("1234…");
      expect(truncate("1234567890", { maxLength: 6, position: "end" })).toEqual("12345…");

      // Should account for longer truncation markers
      expect(
        truncate("1234567890", { maxLength: 6, position: "end", truncationMarker: "..." })
      ).toEqual("123...");
    });

    it('should truncate strings at position: "middle"', () => {
      // Should account for even and odd lengths
      expect(truncate("1234567890", { maxLength: 5, position: "middle" })).toEqual("12…90");
      expect(truncate("1234567890", { maxLength: 6, position: "middle" })).toEqual("123…90");

      // Should account for longer truncation markers
      expect(
        truncate("1234567890", { maxLength: 5, position: "middle", truncationMarker: "..." })
      ).toEqual("1...0");
      expect(
        truncate("1234567890", { maxLength: 6, position: "middle", truncationMarker: "..." })
      ).toEqual("12...0");
    });

    it("edge case handling that should not occur", () => {
      expect(truncate("123", { maxLength: 2, position: "start", truncationMarker: "..." })).toEqual(
        "..."
      );
      expect(
        truncate("123", { maxLength: 2, position: "middle", truncationMarker: "..." })
      ).toEqual("...");
      expect(truncate("123", { maxLength: 2, position: "end", truncationMarker: "..." })).toEqual(
        "..."
      );
    });
  });
});
