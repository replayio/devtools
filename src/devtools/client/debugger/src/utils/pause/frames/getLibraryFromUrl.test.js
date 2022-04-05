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

  test("NextJS library", () => {
    expect(
      getLibraryFromUrl({
        source: { url: "https://www.foo.com/_next/static/chunks/framework-f82aae7a1453fce0.js" },
      })
    ).toEqual("NextJS");
  });

  test("NextJS bundle application", () => {
    expect(
      getLibraryFromUrl({
        source: { url: "https://www.foo.com/_next/static/chunks/pages/_app-foobarbaz.js" },
      })
    ).toEqual(null);
  });
});
