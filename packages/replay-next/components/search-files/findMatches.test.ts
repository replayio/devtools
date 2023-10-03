import { findMatches } from "replay-next/components/search-files/findMatches";

describe("findMatches", () => {
  it("should handle empty text", () => {
    expect(findMatches("", "needle", true)).toMatchInlineSnapshot(`Array []`);
  });

  it("should handle empty needle", () => {
    expect(findMatches("text", "", true)).toMatchInlineSnapshot(`
      Array [
        Array [
          "text",
          "",
        ],
      ]
    `);
  });

  it("should handle case sensitive matches", () => {
    expect(findMatches("The the THE thE the", "the", true)).toMatchInlineSnapshot(`
      Array [
        Array [
          "The ",
          "the",
        ],
        Array [
          " THE thE ",
          "the",
        ],
      ]
    `);
  });

  it("should handle case insensitive matches", () => {
    expect(findMatches("The the THE", "the", false)).toMatchInlineSnapshot(`
      Array [
        Array [
          "",
          "The",
        ],
        Array [
          " ",
          "the",
        ],
        Array [
          " ",
          "THE",
        ],
      ]
    `);
  });

  it("should handle partially incomplete matches", () => {
    expect(findMatches("foo bar", "bark", false)).toMatchInlineSnapshot(`
      Array [
        Array [
          "foo bar",
          "",
        ],
      ]
    `);

    expect(findMatches("bark foo b", "bark", false)).toMatchInlineSnapshot(`
      Array [
        Array [
          "",
          "bark",
        ],
        Array [
          " foo b",
          "",
        ],
      ]
    `);

    expect(findMatches("export const", "render", false)).toMatchInlineSnapshot(`
      Array [
        Array [
          "export const",
          "",
        ],
      ]
    `);
  });

  it("should handle consecutive matches", () => {
    expect(findMatches("foobarbarbaz", "bar", false)).toMatchInlineSnapshot(`
      Array [
        Array [
          "foo",
          "bar",
        ],
        Array [
          "",
          "bar",
        ],
        Array [
          "baz",
          "",
        ],
      ]
    `);
  });
});
