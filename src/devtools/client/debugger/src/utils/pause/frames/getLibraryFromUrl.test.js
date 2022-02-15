import { getLibraryFromUrl } from "./getLibraryFromUrl";

describe("getLibraryFromUrl", () => {
  test("FB ReactDOM", () => {
    expect(
      getLibraryFromUrl({ source: { url: "https://www.foo.com/bar/ReactDOM-dev.classic.js" } })
    ).toEqual("React");
  });
  test("foo.react.js components", () => {
    expect(getLibraryFromUrl({ source: { url: "https://www.foo.com/bar/foo.react.js" } })).toEqual(
      null
    );
  });
  test("shared/react.js", () => {
    expect(
      getLibraryFromUrl({ source: { url: "https://www.foo.com/bar/shared/react.js" } })
    ).toEqual("React");
  });
});
