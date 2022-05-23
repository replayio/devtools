import { sanitizeUrlList } from "../utils";

describe("WorkspaceSettingsModal", () => {
  describe("utils", () => {
    describe("sanitizeUrlList", () => {
      it("should ignore extra whitespace", async () => {
        const expected = ["http://app.replay.io"];
        const actual = sanitizeUrlList("      \t \n http://app.replay.io   \t \n ");

        expect(actual).toEqual(expected);
      });

      it("should omit invalid urls", async () => {
        const expected = ["http://app.replay.io"];
        const actual = sanitizeUrlList("this-will-be-omitted, http://app.replay.io, 🐶");

        expect(actual).toEqual(expected);
      });

      it("should support wildcards", async () => {
        const expected = ["http://*.replay.io", "https://google.com"];
        const actual = sanitizeUrlList("http://*.replay.io, https://google.com");

        expect(actual).toEqual(expected);
      });

      it("should omit paths", async () => {
        const expected = ["http://app.replay.io"];
        const actual = sanitizeUrlList("http://app.replay.io/this/is/a/path");

        expect(actual).toEqual(expected);
      });

      it("should support a port", async () => {
        const expected = ["http://app.replay.io:8080"];
        const actual = sanitizeUrlList("http://app.replay.io:8080");

        expect(actual).toEqual(expected);
      });

      it("should ignore a non-numeric port", async () => {
        const expected = ["http://app.replay.io"];
        const actual = sanitizeUrlList("http://app.replay.io:abc");

        expect(actual).toEqual(expected);
      });
    });
  });
});
