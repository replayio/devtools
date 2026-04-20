import type { Property } from "@replayio/protocol";

import { deserializeChunkedString, splitStringIntoChunks } from "./evalChunkedStrings";

describe("evalChunkedStrings", () => {
  describe("splitStringIntoChunks", () => {
    it("stores a single chunk without a leading count when under the chunk size", () => {
      const chunks: (string | number)[] = [];
      const n = splitStringIntoChunks(chunks, "hello");
      expect(n).toBe(1);
      expect(chunks).toEqual(["hello"]);
    });

    it("prefixes with chunk count when the string is split across multiple parts", () => {
      const long = "x".repeat(10_000);
      const chunks: (string | number)[] = [];
      const n = splitStringIntoChunks(chunks, long);
      expect(n).toBeGreaterThan(1);
      expect(chunks[0]).toBe(n);
      expect(chunks.slice(1).join("")).toBe(long);
    });
  });

  describe("deserializeChunkedString", () => {
    it("reconcatenates a single-chunk payload", () => {
      const props: Property[] = [{ value: "ab" } as Property];
      expect(deserializeChunkedString(props)).toBe("ab");
      expect(props).toEqual([]);
    });

    it("reads leading count when multiple chunks were serialized", () => {
      const props: Property[] = [
        { value: 2 } as Property,
        { value: "aa" } as Property,
        { value: "bb" } as Property,
      ];
      expect(deserializeChunkedString(props)).toBe("aabb");
      expect(props).toEqual([]);
    });
  });
});
