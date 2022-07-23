import { combineHitCounts, firstColumnForLocations } from "./hitCounts";

const hitCount = (sourceId = "1", column = 1, line = 1, hits = 1) => {
  return {
    location: {
      sourceId,
      column,
      line,
    },
    hits,
  };
};

describe("combineHitCounts", () => {
  it("should combine hit counts", () => {
    const hitCounts = combineHitCounts([hitCount(), hitCount("2")]);
    expect(hitCounts).toMatchInlineSnapshot(`
      Array [
        Object {
          "hits": 2,
          "location": Object {
            "column": 1,
            "line": 1,
            "sourceId": "1",
          },
        },
      ]
    `);
  });

  it("can handle multiple locations", () => {
    const hitCounts = combineHitCounts([
      hitCount(),
      hitCount("2"),
      hitCount("1", 2, 2),
      hitCount("2", 2, 2),
    ]);
    expect(hitCounts).toMatchInlineSnapshot(`
      Array [
        Object {
          "hits": 2,
          "location": Object {
            "column": 1,
            "line": 1,
            "sourceId": "1",
          },
        },
        Object {
          "hits": 2,
          "location": Object {
            "column": 2,
            "line": 2,
            "sourceId": "1",
          },
        },
      ]
    `);
  });
});

describe("firstColumnForLocations", () => {
  it("will only return one column per line", () => {
    expect(firstColumnForLocations([])).toEqual([]);
    expect(
      firstColumnForLocations([
        { line: 2, columns: [5, 4] },
        { line: 7, columns: [5, 6, 4, 3] },
        { line: 3, columns: [12, 8] },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "columns": Array [
            4,
          ],
          "line": 2,
        },
        Object {
          "columns": Array [
            3,
          ],
          "line": 7,
        },
        Object {
          "columns": Array [
            8,
          ],
          "line": 3,
        },
      ]
    `);
  });
});
