const { commentKeys } = require("ui/utils/comments");

const freezeTime = now => seconds => new Date(now - seconds * 1000).toISOString();

describe("commentKeys", () => {
  test("keeps the same order even when the createdAt times changes a bit", () => {
    const secondsAgo = freezeTime(Date.now());

    const optimisticResponse = [
      { createdAt: secondsAgo(5), id: "A", user: { id: "1" } },
      { createdAt: secondsAgo(30), id: "B", user: { id: "1" } },
      { createdAt: secondsAgo(15), id: "C", user: { id: "1" } },
    ];
    const serverResponse = [
      { createdAt: secondsAgo(6), id: "A", user: { id: "1" } },
      { createdAt: secondsAgo(28), id: "B", user: { id: "1" } },
      { createdAt: secondsAgo(14), id: "C", user: { id: "1" } },
    ];

    // Compare comment IDs, since the "createdAt" timestamps are expected to change.
    expect(optimisticResponse.map(({ id }) => id)).toEqual(["A", "B", "C"]);
    expect(serverResponse.map(({ id }) => id)).toEqual(["A", "B", "C"]);
  });

  test("includes source location and point if present", () => {
    const secondsAgo = freezeTime(Date.now());

    const comments = [
      { createdAt: secondsAgo(1), id: "A", point: "123", user: { id: "1" } },
      {
        createdAt: secondsAgo(2),
        id: "B",
        point: "234",
        sourceLocation: { line: 567, sourceId: "abc" },
        user: { id: "1" },
      },
    ];

    const keys = commentKeys(comments);
    expect(keys[0]).toContain("123");
    expect(keys[1]).toContain("234-abc-567");
  });
});
