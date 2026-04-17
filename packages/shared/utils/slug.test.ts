import { SLUG_SEPARATOR, extractIdAndSlug, validateUUID } from "./slug";

describe("slug", () => {
  const validId = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

  describe("validateUUID", () => {
    it("accepts canonical lowercase UUID v4 shape", () => {
      expect(validateUUID(validId)).toBe(true);
    });

    it("rejects malformed strings", () => {
      expect(validateUUID("not-a-uuid")).toBe(false);
      expect(validateUUID("")).toBe(false);
      expect(validateUUID(`${validId}x`)).toBe(false);
    });
  });

  describe("extractIdAndSlug", () => {
    it("parses a bare UUID", () => {
      expect(extractIdAndSlug(validId)).toEqual({ id: validId, slug: undefined });
    });

    it("parses slug--uuid form", () => {
      const joined = `my-title${SLUG_SEPARATOR}${validId}`;
      expect(extractIdAndSlug(joined)).toEqual({ id: validId, slug: "my-title" });
    });

    it("returns undefined id when second segment is not a UUID", () => {
      expect(extractIdAndSlug(`foo${SLUG_SEPARATOR}bar`)).toEqual({
        id: undefined,
        slug: undefined,
      });
    });

    it("uses first path segment when given string[]", () => {
      const joined = `x${SLUG_SEPARATOR}${validId}`;
      expect(extractIdAndSlug([joined, "ignored"])).toEqual({ id: validId, slug: "x" });
    });

    it("handles undefined input", () => {
      expect(extractIdAndSlug(undefined)).toEqual({ id: undefined, slug: undefined });
    });
  });
});
