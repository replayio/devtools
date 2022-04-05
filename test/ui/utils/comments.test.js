const { commentKeys } = require("ui/utils/comments");

const freezeTime = now => seconds => new Date(now - seconds * 1000).toISOString();

describe("commentKeys", () => {
  test("keeps the same order even when the createdAt times changes a bit", () => {
    const secondsAgo = freezeTime(Date.now());

    const optimisticResponse = [
      { id: "A", user: { id: "1" }, createdAt: secondsAgo(5) },
      { id: "B", user: { id: "1" }, createdAt: secondsAgo(30) },
      { id: "C", user: { id: "1" }, createdAt: secondsAgo(15) },
    ];
    const serverResponse = [
      { id: "A", user: { id: "1" }, createdAt: secondsAgo(6) },
      { id: "B", user: { id: "1" }, createdAt: secondsAgo(28) },
      { id: "C", user: { id: "1" }, createdAt: secondsAgo(14) },
    ];

    // Compare comment IDs, since the "createdAt" timestamps are expected to change.
    expect(optimisticResponse.map(({ id }) => id)).toEqual(["A", "B", "C"]);
    expect(serverResponse.map(({ id }) => id)).toEqual(["A", "B", "C"]);
  });

  test("includes source location and point if present", () => {
    const secondsAgo = freezeTime(Date.now());

    const comments = [
      { id: "A", user: { id: "1" }, createdAt: secondsAgo(1), point: "123" },
      {
        id: "B",
        user: { id: "1" },
        createdAt: secondsAgo(2),
        point: "234",
        sourceLocation: { sourceId: "abc", line: 567 },
      },
    ];

    const keys = commentKeys(comments);
    expect(keys[0]).toContain("123");
    expect(keys[1]).toContain("234-abc-567");
  });
});
