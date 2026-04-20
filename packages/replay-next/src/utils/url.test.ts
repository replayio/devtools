import { getRelativePath, getRelativePathWithoutFile, parseUrlMemoized } from "./url";

describe("replay-next url utils", () => {
  beforeEach(() => {
    parseUrlMemoized.cache?.clear?.();
  });

  describe("parseUrlMemoized", () => {
    it("rewrites webpack://_N_E prefix for parsing", () => {
      const parsed = parseUrlMemoized("webpack://_N_E/./src/page.tsx");
      expect(parsed.protocol).toBe("webpack:");
      expect(parsed.pathname).toContain("src");
    });

    it("rewrites webpack-internal prefix for parsing", () => {
      const parsed = parseUrlMemoized("webpack-internal:///./foo.ts");
      expect(parsed.protocol).toBe("webpack-internal:");
    });

    it("falls back to treating a bare filename as pathname when URL parsing throws", () => {
      const parsed = parseUrlMemoized("not-a-valid-url");
      expect(parsed.pathname).toBe("not-a-valid-url");
      expect(parsed.path).toBe("not-a-valid-url");
    });
  });

  describe("getRelativePath", () => {
    it("returns path after the first slash in pathname", () => {
      expect(getRelativePath("https://example.com/a/b/c")).toBe("a/b/c");
    });

    it("returns the input url when parsed pathname is empty", () => {
      expect(getRelativePath("")).toBe("");
    });
  });

  describe("getRelativePathWithoutFile", () => {
    it("strips the final path segment (file name)", () => {
      expect(getRelativePathWithoutFile("https://example.com/pkg/src/file.ts")).toBe("pkg/src");
    });
  });
});
