import { getCodePoints, getCodePointsLength, sliceCodePoints } from "./codePointString";

const unicodeStr = "Boo 👻";

describe("getCodePoints", () => {
  it("returns an array of code points", () => {
    const codePoints = getCodePoints(unicodeStr);
    expect(codePoints).toMatchInlineSnapshot(`
      Array [
        "B",
        "o",
        "o",
        " ",
        "👻",
      ]
    `);
    expect(codePoints).not.toEqual(unicodeStr.split(""));
  });
});

describe("getCodePointsLength", () => {
  it("returns the length in code points", () => {
    const length = getCodePointsLength(unicodeStr);
    expect(length).toBe(5);

    // as opposed to code units...
    expect(unicodeStr.length).toBe(6);
  });
});

describe("sliceCodePoints", () => {
  it("returns the correct substring", () => {
    const substring = sliceCodePoints(unicodeStr, 4, 5);
    expect(substring).toMatchInlineSnapshot(`"👻"`);

    // as opposed to code units...
    expect(substring).not.toEqual(unicodeStr.slice(4, 5));
  });

  it("works with no `to` index", () => {
    const substring = sliceCodePoints(unicodeStr, 4);
    expect(substring).toMatchInlineSnapshot(`"👻"`);
  });

  it("works with a negative index", () => {
    const substring = sliceCodePoints(unicodeStr, -1);
    expect(substring).toMatchInlineSnapshot(`"👻"`);
  });
});
