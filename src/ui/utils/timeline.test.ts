import { overlap } from "./timeline";

const point = (time: number) => {
  return { point: "", time };
};
const range = (begin: number, end: number) => {
  return {
    begin: point(begin),
    end: point(end),
  };
};

describe("overlap", () => {
  it("correctly merges overlapping regions when the second begins during the first", () => {
    expect(overlap([range(0, 5)], [range(2, 7)])).toStrictEqual([range(2, 5)]);
  });

  it("correctly merges overlapping regions when the first begins during the second", () => {
    expect(overlap([range(2, 7)], [range(0, 5)])).toStrictEqual([range(2, 5)]);
  });

  it("leaves non-overlapping regions alone", () => {
    expect(overlap([range(0, 2)], [range(3, 5)])).toStrictEqual([]);
  });

  it("does not blow up with empty inputs", () => {
    expect(overlap([range(0, 2)], [])).toStrictEqual([]);
    expect(overlap([], [range(0, 2)])).toStrictEqual([]);
  });
});
