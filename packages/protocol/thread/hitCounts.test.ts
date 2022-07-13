import { combineHitCounts } from "./hitCounts";

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
