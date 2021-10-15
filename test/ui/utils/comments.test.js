const { commentKeys } = require("ui/utils/comments");

const freezeTime = now => seconds => new Date(now - seconds * 1000).toISOString();

describe("commentKeys", () => {
  test("keeps the same order even when the createdAt times changes a bit", () => {
    const secondsAgo = freezeTime(Date.now());

    const optimisticResponse = [
      { user: { id: "1" }, createdAt: secondsAgo(5) },
      { user: { id: "1" }, createdAt: secondsAgo(30) },
      { user: { id: "1" }, createdAt: secondsAgo(15) },
    ];
    const serverResponse = [
      { user: { id: "1" }, createdAt: secondsAgo(6) },
      { user: { id: "1" }, createdAt: secondsAgo(28) },
      { user: { id: "1" }, createdAt: secondsAgo(14) },
    ];

    // Notice the one-indexing, because 0 is falsey and sometimes that leads to subtle bugs
    expect(commentKeys(optimisticResponse)).toEqual(["3", "1", "2"]);
    expect(commentKeys(serverResponse)).toEqual(["3", "1", "2"]);
  });

  test("includes source location and point if present", () => {
    const secondsAgo = freezeTime(Date.now());

    const comments = [
      { user: { id: "1" }, createdAt: secondsAgo(1), point: "1" },
      {
        user: { id: "1" },
        createdAt: secondsAgo(2),
        point: "2",
        sourceLocation: { sourceId: "abc", line: 10 },
      },
    ];

    expect(commentKeys(comments)).toEqual(["2-1", "1-2-abc-10"]);
  });
});
