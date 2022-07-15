import { sameLineSourceLocationsToLocationList } from "./possibleBreakpoints";

describe("sameLineSourceLocationsToLocationList", () => {
  it("can return a list of locations", () => {
    expect(sameLineSourceLocationsToLocationList([{ line: 1, columns: [1, 2] }], "1")).toEqual([
      { line: 1, column: 1, sourceId: "1" },
      { line: 1, column: 2, sourceId: "1" },
    ]);
  });
});
